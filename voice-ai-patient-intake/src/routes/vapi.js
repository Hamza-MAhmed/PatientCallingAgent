const express = require("express");
const {
  createPatient,
  findActiveByPhone
} = require("../services/patient.service");

const router = express.Router();

function getToolCalls(body) {
  return body?.message?.toolCalls ||
    body?.message?.tool_calls ||
    body?.toolCalls ||
    [];
}

function parseArguments(raw) {
  if (raw === undefined || raw === null) return {};
  if (typeof raw === "object") return raw;
  if (typeof raw === "string") {
    try { return JSON.parse(raw); }
    catch { throw Object.assign(new Error("Invalid Vapi tool arguments JSON"), { status: 422 }); }
  }
  throw Object.assign(new Error("Invalid Vapi tool arguments"), { status: 422 });
}

function getToolCallId(call) {
  return call?.id || call?.toolCallId || call?.tool_call_id;
}

function getFunctionName(call) {
  return call?.function?.name ||
    call?.function?.toolName ||
    call?.name ||
    call?.toolName;
}

function getArguments(call) {
  return call?.function?.arguments ??
    call?.function?.parameters ??
    call?.arguments ??
    call?.parameters ??
    {};
}

router.post("/", async (req, res, next) => {
  try {
    const calls = getToolCalls(req.body);

    if (!Array.isArray(calls) || calls.length === 0) {
      return res.status(400).json({
        results: [],
        error: "No Vapi tool calls found in message.toolCalls"
      });
    }

    const results = [];

    for (const call of calls) {
      const toolCallId = getToolCallId(call);
      const name = getFunctionName(call);

      if (!toolCallId) {
        results.push({
          toolCallId: "unknown",
          result: "Tool call is missing an id."
        });
        continue;
      }

      if (name !== "register_patient") {
        results.push({
          toolCallId,
          result: `Unsupported tool: ${name || "unknown"}`
        });
        continue;
      }

      try {
        const args = parseArguments(getArguments(call));

        // Bonus behavior from the assessment: recognize a returning caller
        // by phone number. We still register only when the tool is explicitly
        // invoked as register_patient.
        if (args.phone_number) {
          const existing = await findActiveByPhone(args.phone_number);
          if (existing) {
            console.log("[vapi-duplicate-phone]", JSON.stringify({
              phone_number: existing.phone_number,
              patient_id: existing.patient_id
            }));
          }
        }

        const patient = await createPatient(args);

        console.log("[vapi-register-patient]", JSON.stringify({
          toolCallId,
          patient: {
            patient_id: patient.patient_id,
            first_name: patient.first_name,
            last_name: patient.last_name,
            date_of_birth: patient.date_of_birth,
            sex: patient.sex,
            phone_number: patient.phone_number,
            email: patient.email
          }
        }));

        results.push({
          toolCallId,
          result: `Patient successfully registered with ID ${patient.patient_id}`
        });
      } catch (err) {
        console.error("[vapi-register-error]", {
          toolCallId,
          message: err.message
        });

        results.push({
          toolCallId,
          result: `Patient registration failed: ${err.message}`
        });
      }
    }

    res.status(200).json({ results });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
