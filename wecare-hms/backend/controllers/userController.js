const db = require("../config/db");

// Create user
const createUser = (req, res) => {
  const { full_name, email, password_hash, phone, role_id } = req.body;

  const sql = `
    INSERT INTO users (full_name, email, password_hash, phone, role_id, status)
    VALUES (?, ?, ?, ?, ?, 'ACTIVE')
  `;

  db.query(sql, [full_name, email, password_hash, phone, role_id], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "User creation error",
        error: err.message
      });
    }

    res.status(201).json({
      message: "User created successfully",
      user_id: result.insertId
    });
  });
};


// Get all users
const getUsers = (req, res) => {
  const sql = `
    SELECT 
      u.user_id,
      u.full_name,
      u.email,
      u.phone,
      r.role_name,
      u.status
    FROM users u
    JOIN roles r ON u.role_id = r.role_id
    ORDER BY u.user_id DESC
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
  createUser,
  getUsers
};