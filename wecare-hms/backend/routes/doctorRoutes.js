const express = require("express");
const router = express.Router();
const { createDoctor, getDoctors } = require("../controllers/doctorController");

router.post("/", createDoctor);
router.get("/", getDoctors);

module.exports = router;