const db = require("../config/db");

// Create appointment
const createAppointment = (req, res) => {
  const { patient_id, doctor_id, appointment_date, appointment_time } = req.body;

  const sql = `
    INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [patient_id, doctor_id, appointment_date, appointment_time], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Database error",
        error: err.message
      });
    }

    res.status(201).json({
      message: "Appointment created successfully",
      appointment_id: result.insertId
    });
  });
};

// Get all appointments
const getAppointments = (req, res) => {
  const sql = `
    SELECT 
      a.appointment_id,
      a.appointment_date,
      a.appointment_time,
      a.status,
      p.full_name AS patient_name,
      d.doctor_id,
      u.full_name AS doctor_name
    FROM appointments a
    JOIN patients p ON a.patient_id = p.patient_id
    JOIN doctors d ON a.doctor_id = d.doctor_id
    JOIN users u ON d.user_id = u.user_id
    ORDER BY a.appointment_id DESC
  `;

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

module.exports = {
  createAppointment,
  getAppointments
};