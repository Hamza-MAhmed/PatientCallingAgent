# Voice AI Patient Intake Backend

Production-oriented Node.js/Express backend for the Voice AI Patient Registration technical assessment.

## Important ORM note

The assessment prompt asks for **Node/Express** while also naming **SQLAlchemy/SQLModel**, which are Python ORM libraries. They cannot be used directly inside a Node.js process.

This implementation preserves the requested Node/Express architecture and uses **Sequelize + SQLite**, which is the Node.js ORM equivalent for this requirement. If SQLAlchemy is a hard requirement, the backend should instead be implemented in Python/FastAPI.

The supplied assessment PDF also recommends Node.js/Express as a backend option and requires persistence, REST endpoints, server-side validation, environment-based secrets, observability, and a clear README.

## Stack

- Node.js 20+
- Express 5
- Sequelize 6
- SQLite
- Zod-style validation logic (custom deterministic validation is used here)
- Helmet
- CORS
- Jest + Supertest

## Run

```bash
npm install
cp .env.example .env
npm start
```

The service creates `patients.db` automatically in the configured location and seeds two patients if the database is empty.

Development:

```bash
npm run dev
```

Tests:

```bash
npm test
```

## Environment variables

```env
PORT=3000
NODE_ENV=development
DATABASE_PATH=./patients.db
CORS_ORIGIN=*
```

No API keys are hardcoded.

## Endpoints

### Health

```http
GET /health
```

### List patients

```http
GET /patients
GET /patients?last_name=Doe
GET /patients?date_of_birth=1990-05-15
GET /patients?phone_number=2125550101
```

Only non-deleted patients are returned.

### Get patient

```http
GET /patients/{uuid}
```

Returns `404` if the UUID does not exist or the record has been soft-deleted.

### Create

```http
POST /patients
Content-Type: application/json
```

Example:

```json
{
  "first_name": "Jane",
  "last_name": "Doe",
  "date_of_birth": "1990-05-15",
  "sex": "Female",
  "phone_number": "2125550101",
  "email": "jane@example.com",
  "address_line_1": "123 Main Street",
  "address_line_2": "Apt 4B",
  "city": "New York",
  "state": "NY",
  "zip_code": "10001",
  "insurance_provider": "Example Health",
  "insurance_member_id": "ABC123",
  "preferred_language": "English",
  "emergency_contact_name": "John Doe",
  "emergency_contact_phone": "2125550102"
}
```

Returns `201`.

### Partial update

```http
PUT /patients/{uuid}
```

Any mutable patient field can be supplied. `patient_id`, timestamps, and `deleted_at` are server-controlled.

### Soft delete

```http
DELETE /patients/{uuid}
```

The row remains in SQLite; `deleted_at` is populated.

## Response envelope

Normal API responses:

```json
{
  "data": {},
  "error": null
}
```

Errors:

```json
{
  "data": null,
  "error": "Patient not found"
}
```

Validation errors use HTTP `422`. Missing records use `404`. Malformed/invalid request conditions use `400` where appropriate.

## Vapi webhook

Endpoint:

```http
POST /webhook/vapi
```

The handler reads `message.toolCalls` and supports the common Vapi shape:

```json
{
  "message": {
    "toolCalls": [
      {
        "id": "call_123",
        "function": {
          "name": "register_patient",
          "arguments": "{\"first_name\":\"Jane\", ...}"
        }
      }
    ]
  }
}
```

It returns:

```json
{
  "results": [
    {
      "toolCallId": "call_123",
      "result": "Patient successfully registered with ID <uuid>"
    }
  ]
}
```

The endpoint also accepts object-valued `arguments` and common `tool_calls`/`toolCallId` variants.

### Vapi tool definition

Configure a Vapi tool named `register_patient` with arguments matching the patient schema. The Vapi server URL should point to:

```text
https://YOUR_PUBLIC_HOST/webhook/vapi
```

The voice agent should only invoke the tool after it has collected the required information and explicitly confirmed the complete information with the caller.

## Suggested voice-agent behavior

System prompt principles:

1. Act as a calm patient intake coordinator.
2. Collect required fields conversationally rather than as a rigid IVR.
3. Accept natural phrasing and corrections.
4. Validate/re-prompt when a field is invalid.
5. Do not invent missing information.
6. Required fields must be complete before registration.
7. Offer optional insurance, emergency-contact, and preferred-language information.
8. Read back all collected information and ask the caller to confirm.
9. Call `register_patient` only after confirmation.
10. If the tool reports failure, apologize briefly and retry or explain that registration could not be completed.
11. Never expose internal tool errors, database details, or secrets to the caller.

## Data validation

Server-side validation covers:

- First/last names: 1-50 characters, alphabetic characters plus hyphens/apostrophes.
- DOB: `YYYY-MM-DD`, real calendar date, not future.
- Sex: exact allowed enum.
- Phone: normalized to U.S. 10 digits.
- Email: basic valid email shape.
- City: 1-100 characters.
- State: valid U.S. 2-letter abbreviation, including DC.
- ZIP: `12345` or `12345-6789`.
- Emergency phone: U.S. 10 digits when supplied.
- Unknown input fields are rejected.

The assessment PDF expresses DOB as MM/DD/YYYY in its conversational data model, while the API requirement supplied for this implementation explicitly requires `YYYY-MM-DD`. The API accepts the requested format and also normalizes `MM/DD/YYYY` from Vapi into `YYYY-MM-DD` for resilience.

## Security / production notes

- Helmet enabled.
- JSON body size limited.
- CORS is configurable and defaults to `*` as required by the assessment.
- Secrets belong in environment variables.
- SQLite file is excluded from git.
- Soft deletion prevents accidental physical deletion.
- Database indexes are created for common filters.
- Graceful SIGINT/SIGTERM shutdown.
- Final Vapi payload and patient creation events are logged to stdout.

Before a real healthcare deployment, add authentication/authorization, HTTPS, audit logging, encryption/key management, access controls, retention policies, structured redacted logs, and a compliance review. This assessment implementation is not represented as HIPAA-compliant merely because it stores patient data.

## Trade-offs

SQLite is intentionally used because the assessment allows it and the requested local file is `patients.db`. For a horizontally scaled production deployment, PostgreSQL would be preferable.

Sequelize is used because SQLAlchemy/SQLModel are Python-only while this backend is Node/Express.

The Vapi webhook supports `register_patient`; the actual phone number/assistant provisioning remains a Vapi/telephony configuration concern.

## Project structure

```text
src/
  app.js
  server.js
  config/
    env.js
  db/
    sequelize.js
    patient.model.js
    init.js
  middleware/
    error-handler.js
  routes/
    patients.js
    vapi.js
  services/
    patient.service.js
  utils/
    envelope.js
    validation.js
tests/
  patients.test.js
```
