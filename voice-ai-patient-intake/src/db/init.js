const { randomUUID } = require("crypto");
const sequelize = require("./sequelize");
const Patient = require("./patient.model");
const { validatePatientInput } = require("../utils/validation");

const seedPatients = [
  {
    patient_id: randomUUID(),
    first_name: "Jane",
    last_name: "Doe",
    date_of_birth: "1990-05-15",
    sex: "Female",
    phone_number: "2125550101",
    email: "jane.doe@example.com",
    address_line_1: "123 Main Street",
    address_line_2: "Apt 4B",
    city: "New York",
    state: "NY",
    zip_code: "10001",
    insurance_provider: "Example Health",
    insurance_member_id: "EH123456",
    preferred_language: "English",
    emergency_contact_name: "John Doe",
    emergency_contact_phone: "2125550102"
  },
  {
    patient_id: randomUUID(),
    first_name: "Michael",
    last_name: "Smith",
    date_of_birth: "1985-11-20",
    sex: "Male",
    phone_number: "4155550133",
    email: "michael.smith@example.com",
    address_line_1: "500 Market Street",
    address_line_2: null,
    city: "San Francisco",
    state: "CA",
    zip_code: "94105",
    insurance_provider: null,
    insurance_member_id: null,
    preferred_language: "English",
    emergency_contact_name: null,
    emergency_contact_phone: null
  }
];

async function initializeDatabase() {
  await sequelize.authenticate();
  await sequelize.sync();

  const count = await Patient.count();
  if (count === 0) {
    const now = new Date();
    for (const seed of seedPatients) {
      const parsed = validatePatientInput(seed, { partial: false });
      await Patient.create({
        ...parsed,
        created_at: now,
        updated_at: now,
        deleted_at: null
      });
    }
    console.log("[db] Seeded 2 demonstration patients.");
  }
}

module.exports = { initializeDatabase };
