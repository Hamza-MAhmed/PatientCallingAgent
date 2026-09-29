const express = require("express");
const {
  listPatients,
  getPatient,
  createPatient,
  updatePatient,
  softDeletePatient
} = require("../services/patient.service");
const { ok, fail } = require("../utils/envelope");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const data = await listPatients({
      last_name: req.query.last_name,
      date_of_birth: req.query.date_of_birth,
      phone_number: req.query.phone_number
    });
    res.status(200).json(ok(data));
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const data = await getPatient(req.params.id);
    if (!data) return res.status(404).json(fail("Patient not found"));
    res.status(200).json(ok(data));
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const data = await createPatient(req.body);
    res.status(201).json(ok(data));
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const data = await updatePatient(req.params.id, req.body);
    if (!data) return res.status(404).json(fail("Patient not found"));
    res.status(200).json(ok(data));
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const data = await softDeletePatient(req.params.id);
    if (!data) return res.status(404).json(fail("Patient not found"));
    res.status(200).json(ok(data));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
