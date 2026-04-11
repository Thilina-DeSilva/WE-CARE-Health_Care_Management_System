const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const itemRoutes = require("./routes/itemRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const patientRoutes = require("./routes/patientRoute");
const appointmentRoutes = require("./routes/appointmentRoutes");
const app = express();
const doctorRoutes = require("./routes/doctorRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const userRoutes = require("./routes/userRoutes");

app.use(cors());
app.use(express.json());
app.use("/api/items", itemRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/users", userRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/payments", paymentRoutes);
app.get("/", (req, res) => {
  res.send("WE CARE backend is running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});