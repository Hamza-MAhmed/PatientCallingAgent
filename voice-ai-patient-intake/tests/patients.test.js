process.env.NODE_ENV = "test";
process.env.DATABASE_PATH = "./patients.test.db";

const fs = require("fs");
const request = require("supertest");
const app = require("../src/app");
const sequelize = require("../src/db/sequelize");
const Patient = require("../src/db/patient.model");
const { randomUUID } = require("crypto");

beforeAll(async () => {
  if (fs.existsSync("./patients.test.db")) fs.unlinkSync("./patients.test.db");
  await sequelize.sync();
});

afterAll(async () => {
  await sequelize.close();
  if (fs.existsSync("./patients.test.db")) fs.unlinkSync("./patients.test.db");
});

const validPatient = () => ({
  first_name: "John",
  last_name: "O'Connor",
  date_of_birth: "1992-02-29",
  sex: "Male",
  phone_number: "2025550199",
  email: "john@example.com",
  address_line_1: "1 Test Street",
  address_line_2: null,
  city: "Washington",
  state: "DC",
  zip_code: "20001",
  preferred_language: "English"
});

test("POST /patients creates a patient", async () => {
  const response = await request(app).post("/patients").send(validPatient());
  expect(response.status).toBe(201);
  expect(response.body.error).toBeNull();
  expect(response.body.data.patient_id).toBeTruthy();
});

test("future DOB is rejected", async () => {
  const response = await request(app).post("/patients").send({
    ...validPatient(),
    phone_number: "2025550188",
    date_of_birth: "2999-01-01"
  });
  expect(response.status).toBe(422);
  expect(response.body.data).toBeNull();
});

test("soft delete hides patient", async () => {
  const patient = await Patient.create({
    patient_id: randomUUID(),
    ...validPatient(),
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null
  });

  const deleted = await request(app).delete(`/patients/${patient.patient_id}`);
  expect(deleted.status).toBe(200);

  const fetched = await request(app).get(`/patients/${patient.patient_id}`);
  expect(fetched.status).toBe(404);
});

test("Vapi webhook returns required tool result", async () => {
  const payload = {
    message: {
      toolCalls: [{
        id: "call_test_123",
        function: {
          name: "register_patient",
          arguments: JSON.stringify({
            ...validPatient(),
            phone_number: "3035550109",
            email: "vapi@example.com"
          })
        }
      }]
    }
  };

  const response = await request(app).post("/webhook/vapi").send(payload);
  expect(response.status).toBe(200);
  expect(response.body.results).toHaveLength(1);
  expect(response.body.results[0].toolCallId).toBe("call_test_123");
  expect(response.body.results[0].result).toMatch(/^Patient successfully registered with ID /);
});
