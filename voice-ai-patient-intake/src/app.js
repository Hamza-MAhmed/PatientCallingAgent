const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { corsOrigin } = require("./config/env");
const patientRoutes = require("./routes/patients");
const vapiRoutes = require("./routes/vapi");
const errorHandler = require("./middleware/error-handler");
const { ok, fail } = require("./utils/envelope");

const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({
  origin: corsOrigin === "*" ? "*" : corsOrigin
}));
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));

const path = require("path");
app.use(express.static(path.join(__dirname, "../public")));

app.get("/health", (req, res) => {
  res.status(200).json(ok({
    status: "ok",
    service: "voice-ai-patient-intake"
  }));
});

app.use("/patients", patientRoutes);
app.use("/webhook/vapi", vapiRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.use((req, res) => {
  res.status(404).json(fail("Route not found"));
});

app.use(errorHandler);

module.exports = app;
