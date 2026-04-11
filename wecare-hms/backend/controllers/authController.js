const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const loginUser = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const sql = "SELECT u.user_id, u.full_name, u.email, u.password_hash, u.status, r.role_name FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.email = ?";

  db.query(sql, [email], async (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Database error",
        error: err.message
      });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = results[0];

    if (user.status !== "ACTIVE") {
      return res.status(403).json({ message: "Account is inactive" });
    }

    try {
      const isMatch = await bcrypt.compare(password, user.password_hash);

      if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const token = jwt.sign(
        {
          user_id: user.user_id,
          email: user.email,
          role: user.role_name
        },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }
      );

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user.user_id,
          name: user.full_name,
          email: user.email,
          role: user.role_name
        }
      });
    } catch (compareError) {
      return res.status(500).json({
        message: "Password verification failed",
        error: compareError.message
      });
    }
  });
};

module.exports = { loginUser };