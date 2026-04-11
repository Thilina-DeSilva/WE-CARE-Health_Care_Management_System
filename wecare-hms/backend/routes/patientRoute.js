const express = require("express");
const router = express.Router();

const {
  createPatient,
  getPatients,
  searchPatients
} = require("../controllers/patientController");

router.post("/", createPatient);
router.get("/", getPatients);
router.get("/search", searchPatients);

module.exports = router;