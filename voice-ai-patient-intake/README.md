# Voice AI Patient Intake Backend

Production-oriented Node.js/Express backend for the Voice AI Patient Registration technical assessment.

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
npm start
```

The service creates `patients.db` automatically in the configured location and seeds two patients if the database is empty.

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
