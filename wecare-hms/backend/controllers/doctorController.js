const db = require("../config/db");

// Create doctor
const createDoctor = (req, res) => {
  const { full_name, email, password_hash, phone, specialization, license_no, room_no } = req.body;

  // role_id for DOCTOR
  const getRoleSql = `SELECT role_id FROM roles WHERE role_name = 'DOCTOR'`;

  db.query(getRoleSql, (err, roleResult) => {
    if (err) {
      return res.status(500).json({ message: "Role fetch error", error: err.message });
    }

    if (roleResult.length === 0) {
      return res.status(404).json({ message: "DOCTOR role not found" });
    }

    const role_id = roleResult[0].role_id;

    const insertUserSql = `
      INSERT INTO users (full_name, email, password_hash, phone, role_id, status)
      VALUES (?, ?, ?, ?, ?, 'ACTIVE')
    `;

    db.query(insertUserSql, [full_name, email, password_hash, phone, role_id], (err2, userResult) => {
      if (err2) {
        return res.status(500).json({ message: "User insert error", error: err2.message });
      }

      const user_id = userResult.insertId;

      const insertDoctorSql = `
        INSERT INTO doctors (user_id, specialization, license_no, room_no)
        VALUES (?, ?, ?, ?)
      `;

      db.query(insertDoctorSql, [user_id, specialization, license_no, room_no], (err3, doctorResult) => {
        if (err3) {
          return res.status(500).json({ message: "Doctor insert error", error: err3.message });
        }

        res.status(201).json({
          message: "Doctor created successfully",
          user_id,
          doctor_id: doctorResult.insertId
        });
      });
    });
  });
};

// Get all doctors
const getDoctors = (req, res) => {
  const sql = `
    SELECT 
      d.doctor_id,
      u.user_id,
      u.full_name,
      u.email,
      u.phone,
      d.specialization,
      d.license_no,
      d.room_no
    FROM doctors d
    JOIN users u ON d.user_id = u.user_id
    ORDER BY d.doctor_id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error", error: err.message });
    }

    res.json(results);
  });
};

module.exports = {
  createDoctor,
  getDoctors
};