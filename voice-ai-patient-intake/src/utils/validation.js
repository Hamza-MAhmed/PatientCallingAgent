const US_STATES = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
  "DC"
]);

const NAME_RE = /^[A-Za-z]+(?:[-'][A-Za-z]+)*$/;
const PHONE_RE = /^\d{10}$/;
const ZIP_RE = /^\d{5}(?:-\d{4})?$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sexValues = ["Male", "Female", "Other", "Decline to Answer"];

function isRealDateOnly(value) {
  if (!DATE_RE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day;
}

function isFutureDate(value) {
  const today = new Date();
  const todayOnly = new Date(Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate()
  ));
  const [year, month, day] = value.split("-").map(Number);
  const candidate = new Date(Date.UTC(year, month - 1, day));
  return candidate > todayOnly;
}

function normalizeDate(value) {
  // API contract is YYYY-MM-DD. Vapi may occasionally send MM/DD/YYYY.
  if (typeof value !== "string") return value;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [m, d, y] = value.split("/");
    return `${y}-${m}-${d}`;
  }
  return value;
}

function normalizePhone(value) {
  if (typeof value !== "string") return value;
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  return digits;
}

function normalizeState(value) {
  return typeof value === "string" ? value.trim().toUpperCase() : value;
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : value;
}

const patientFields = [
  "patient_id", "first_name", "last_name", "date_of_birth", "sex", "phone_number",
  "email", "address_line_1", "address_line_2", "city", "state",
  "zip_code", "insurance_provider", "insurance_member_id",
  "preferred_language", "emergency_contact_name", "emergency_contact_phone"
];

function validatePatientInput(input, { partial = false } = {}) {
  const raw = { ...input };

  if (raw.date_of_birth !== undefined) raw.date_of_birth = normalizeDate(raw.date_of_birth);
  for (const key of ["phone_number", "emergency_contact_phone"]) {
    if (raw[key] !== undefined && raw[key] !== null) raw[key] = normalizePhone(raw[key]);
  }
  if (raw.state !== undefined) raw.state = normalizeState(raw.state);

  for (const key of Object.keys(raw)) {
    if (typeof raw[key] === "string") raw[key] = normalizeString(raw[key]);
  }

  const errors = [];

  const checkRequired = (key) => {
    if (!partial && (raw[key] === undefined || raw[key] === null || raw[key] === "")) {
      errors.push(`${key} is required`);
    }
  };

  for (const key of [
    "first_name","last_name","date_of_birth","sex","phone_number",
    "address_line_1","city","state","zip_code"
  ]) checkRequired(key);

  if (raw.first_name !== undefined &&
      (typeof raw.first_name !== "string" || raw.first_name.length < 1 ||
       raw.first_name.length > 50 || !NAME_RE.test(raw.first_name))) {
    errors.push("first_name must be 1-50 characters and contain only alphabetic characters, hyphens, or apostrophes");
  }

  if (raw.last_name !== undefined &&
      (typeof raw.last_name !== "string" || raw.last_name.length < 1 ||
       raw.last_name.length > 50 || !NAME_RE.test(raw.last_name))) {
    errors.push("last_name must be 1-50 characters and contain only alphabetic characters, hyphens, or apostrophes");
  }

  if (raw.date_of_birth !== undefined &&
      (!isRealDateOnly(raw.date_of_birth) || isFutureDate(raw.date_of_birth))) {
    errors.push("date_of_birth must be a valid YYYY-MM-DD date that is not in the future");
  }

  if (raw.sex !== undefined && !sexValues.includes(raw.sex)) {
    errors.push(`sex must be one of: ${sexValues.join(", ")}`);
  }

  if (raw.phone_number !== undefined &&
      (!PHONE_RE.test(raw.phone_number))) {
    errors.push("phone_number must be a valid U.S. 10-digit phone number");
  }

  if (raw.email !== undefined && raw.email !== null && raw.email !== "" &&
      (!EMAIL_RE.test(raw.email) || raw.email.length > 254)) {
    errors.push("email must be a valid email address");
  }

  if (raw.address_line_1 !== undefined &&
      (typeof raw.address_line_1 !== "string" || raw.address_line_1.length < 1)) {
    errors.push("address_line_1 is required and must be non-empty");
  }

  if (raw.city !== undefined &&
      (typeof raw.city !== "string" || raw.city.length < 1 || raw.city.length > 100)) {
    errors.push("city must be 1-100 characters");
  }

  if (raw.state !== undefined &&
      (!US_STATES.has(raw.state))) {
    errors.push("state must be a valid 2-letter U.S. state abbreviation");
  }

  if (raw.zip_code !== undefined && !ZIP_RE.test(raw.zip_code)) {
    errors.push("zip_code must be 5 digits or ZIP+4");
  }

  if (raw.emergency_contact_phone !== undefined &&
      raw.emergency_contact_phone !== null &&
      raw.emergency_contact_phone !== "" &&
      !PHONE_RE.test(raw.emergency_contact_phone)) {
    errors.push("emergency_contact_phone must be a valid U.S. 10-digit phone number");
  }

  if (raw.preferred_language === undefined || raw.preferred_language === null || raw.preferred_language === "") {
    if (!partial) raw.preferred_language = "English";
  }

  const unknownKeys = Object.keys(raw).filter(k => !patientFields.includes(k));
  if (unknownKeys.length) errors.push(`Unknown field(s): ${unknownKeys.join(", ")}`);

  if (errors.length) {
    const error = new Error(errors.join("; "));
    error.status = 422;
    error.details = errors;
    throw error;
  }

  return raw;
}

module.exports = {
  validatePatientInput,
  patientFields,
  sexValues,
  US_STATES
};
