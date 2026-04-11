const db = require("../config/db");

// Create schedule
const createSchedule = (req, res) => {
  const { doctor_id, day_of_week, start_time, end_time, max_patients } = req.body;

  const sql = `
    INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, max_patients)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql, [doctor_id, day_of_week, start_time, end_time, max_patients], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Schedule error", error: err.message });
    }

    res.status(201).json({
      message: "Schedule created successfully",
      schedule_id: result.insertId
    });
  });
};

// Get all schedules
const getSchedules = (req, res) => {
  const sql = `
    SELECT 
      s.schedule_id,
      s.doctor_id,
      u.full_name AS doctor_name,
      s.day_of_week,
      s.start_time,
      s.end_time,
      s.max_patients
    FROM doctor_schedules s
    JOIN doctors d ON s.doctor_id = d.doctor_id
    JOIN users u ON d.user_id = u.user_id
    ORDER BY s.schedule_id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error", error: err.message });
    }

    res.json(results);
  });
};

module.exports = {
  createSchedule,
  getSchedules
};