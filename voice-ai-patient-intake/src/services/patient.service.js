const { randomUUID } = require("crypto");
const { Op } = require("sequelize");
const Patient = require("../db/patient.model");
const { validatePatientInput, patientFields } = require("../utils/validation");

function serialize(patient) {
  if (!patient) return null;
  const obj = patient.toJSON ? patient.toJSON() : patient;
  return {
    patient_id: obj.patient_id,
    first_name: obj.first_name,
    last_name: obj.last_name,
    date_of_birth: obj.date_of_birth,
    sex: obj.sex,
    phone_number: obj.phone_number,
    email: obj.email,
    address_line_1: obj.address_line_1,
    address_line_2: obj.address_line_2,
    city: obj.city,
    state: obj.state,
    zip_code: obj.zip_code,
    insurance_provider: obj.insurance_provider,
    insurance_member_id: obj.insurance_member_id,
    preferred_language: obj.preferred_language,
    emergency_contact_name: obj.emergency_contact_name,
    emergency_contact_phone: obj.emergency_contact_phone,
    created_at: obj.created_at,
    updated_at: obj.updated_at,
    deleted_at: obj.deleted_at
  };
}

function normalizePayload(body, partial) {
  return validatePatientInput(body, { partial });
}

async function listPatients(filters) {
  const where = { deleted_at: null };

  if (filters.last_name) where.last_name = filters.last_name.trim();
  if (filters.date_of_birth) {
    const validated = validatePatientInput({ date_of_birth: filters.date_of_birth }, { partial: true });
    where.date_of_birth = validated.date_of_birth;
  }
  if (filters.phone_number) {
    const validated = validatePatientInput({ phone_number: filters.phone_number }, { partial: true });
    where.phone_number = validated.phone_number;
  }

  const rows = await Patient.findAll({
    where,
    order: [["created_at", "DESC"]]
  });
  return rows.map(serialize);
}

async function getPatient(id) {
  const row = await Patient.findOne({ where: { patient_id: id, deleted_at: null } });
  return serialize(row);
}

async function createPatient(body) {
  const payload = normalizePayload(body, false);
  const now = new Date();

  const existing = await Patient.findOne({
    where: { phone_number: payload.phone_number, deleted_at: null }
  });

  // Duplicate phone numbers are not forbidden by the stated schema, so we
  // deliberately allow them. The Vapi layer may use this for duplicate detection.
  const row = await Patient.create({
    patient_id: randomUUID(),
    ...payload,
    created_at: now,
    updated_at: now,
    deleted_at: null
  });

  console.log("[patient-created]", JSON.stringify(serialize(row)));
  return serialize(row);
}

async function updatePatient(id, body) {
  const row = await Patient.findOne({ where: { patient_id: id, deleted_at: null } });
  if (!row) return null;

  const payload = normalizePayload(body, true);
  const allowed = {};
  for (const key of patientFields) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) allowed[key] = payload[key];
  }

  await row.update({
    ...allowed,
    updated_at: new Date()
  });

  return serialize(row);
}

async function softDeletePatient(id) {
  const row = await Patient.findOne({ where: { patient_id: id, deleted_at: null } });
  if (!row) return null;

  await row.update({
    deleted_at: new Date(),
    updated_at: new Date()
  });

  return serialize(row);
}

async function findActiveByPhone(phone) {
  const payload = validatePatientInput({ phone_number: phone }, { partial: true });
  const row = await Patient.findOne({
    where: { phone_number: payload.phone_number, deleted_at: null }
  });
  return serialize(row);
}

module.exports = {
  serialize,
  listPatients,
  getPatient,
  createPatient,
  updatePatient,
  softDeletePatient,
  findActiveByPhone
};
