const db = require("../config/db");

// Create patient
const createPatient = (req, res) => {
  const { nic, full_name, dob, gender, phone, address } = req.body;

  const sql = `
    INSERT INTO patients (nic, full_name, dob, gender, phone, address)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [nic, full_name, dob, gender, phone, address], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Database error",
        error: err.message
      });
    }

    res.status(201).json({
      message: "Patient created successfully",
      patient_id: result.insertId
    });
  });
};

// Get all patients
const getPatients = (req, res) => {
  const sql = `SELECT * FROM patients ORDER BY patient_id DESC`;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Database error",
        error: err.message
      });
    }

    res.json(results);
  });
};

// Search patients
const searchPatients = (req, res) => {
  const { search } = req.query;
  const keyword = `%${search || ""}%`;

  const sql = `
    SELECT * FROM patients
    WHERE full_name LIKE ? OR nic LIKE ?
    ORDER BY patient_id DESC
  `;

  db.query(sql, [keyword, keyword], (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Database error",
        error: err.message
      });
    }

    res.json(results);
  });
};

module.exports = {
  createPatient,
  getPatients,
  searchPatients
};