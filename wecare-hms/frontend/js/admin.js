let navButtons;
let sections;
let logoutBtn;

let userTableBody;
let doctorTableBody;
let stockTableBody;
let appointmentTableBody;
let reportInvoiceTableBody;

let saveUserBtn;
let clearUserBtn;
let printIdBadgeBtn;
let userMessageBox;

let saveDoctorBtn;
let clearDoctorBtn;
let doctorMessageBox;

let saveStockBtn;
let clearStockBtn;
let stockMessageBox;

let revenueChart;
let salesChart;

const SPECIALIZATIONS = [
  "Allergy and Immunology",
  "Anesthesiology",
  "Cardiology",
  "Cardiothoracic Surgery",
  "Dermatology",
  "Emergency Medicine",
  "Endocrinology",
  "Family Medicine",
  "Gastroenterology",
  "General Medicine",
  "General Surgery",
  "Gynecology",
  "Hematology",
  "Internal Medicine",
  "Nephrology",
  "Neurology",
  "Neurosurgery",
  "Obstetrics",
  "Oncology",
  "Ophthalmology",
  "Orthopedics",
  "Otolaryngology (ENT)",
  "Pediatrics",
  "Psychiatry",
  "Pulmonology",
  "Radiology",
  "Rheumatology",
  "Urology"
];

function getUsers() {
  return JSON.parse(localStorage.getItem("wecare_users")) || [
    {
      staffId: "ADM-001",
      name: "Admin User",
      email: "admin@wecare.com",
      phone: "0771234567",
      role: "ADMIN",
      status: "ACTIVE",
      tempPassword: "Admin@123"
    }
  ];
}

function saveUsers(data) {
  localStorage.setItem("wecare_users", JSON.stringify(data));
}

function getDoctors() {
  return JSON.parse(localStorage.getItem("wecare_doctors")) || [
    {
      doctorId: "DOC-001",
      name: "Dr. Silva",
      specialization: "Cardiology",
      license: "LIC1001",
      email: "drsilva@wecare.com",
      phone: "0778881111",
      room: "A12",
      experience: 12,
      schedule: "Mon-Fri 9AM-2PM"
    }
  ];
}

function saveDoctors(data) {
  localStorage.setItem("wecare_doctors", JSON.stringify(data));
}

function getInventory() {
  return JSON.parse(localStorage.getItem("wecare_inventory")) || [
    { itemId: "ITM-001", name: "Paracetamol", type: "MEDICINE", price: 50, stock: 120 },
    { itemId: "ITM-002", name: "Amoxicillin", type: "MEDICINE", price: 120, stock: 8 },
    { itemId: "ITM-003", name: "Blood Test", type: "LAB_TEST", price: 1500, stock: 0 }
  ];
}

function saveInventory(data) {
  localStorage.setItem("wecare_inventory", JSON.stringify(data));
}

function getAppointments() {
  return JSON.parse(localStorage.getItem("wecare_appointments")) || [
    {
      appointmentPatient: "Kasun Perera",
      doctorName: "Dr. Silva",
      appointmentDate: "2026-04-05",
      appointmentTime: "10:00 AM",
      appointmentStatus: "BOOKED"
    }
  ];
}

function getInvoices() {
  return JSON.parse(localStorage.getItem("wecare_invoices")) || [
    {
      invoiceId: "INV-001",
      patient: "Kasun Perera",
      date: "2026-04-05",
      method: "Cash",
      total: 2500
    }
  ];
}

function setStatusMessage(element, text, type = "default") {
  if (!element) return;
  element.textContent = text;

  if (type === "success") element.style.color = "#16a34a";
  else if (type === "error") element.style.color = "#dc2626";
  else if (type === "warning") element.style.color = "#d97706";
  else element.style.color = "#6b7280";
}

function clearFieldErrors(ids) {
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = "";
  });
}

function populateSpecializations() {
  const datalist = document.getElementById("specializationList");
  if (!datalist) return;

  datalist.innerHTML = SPECIALIZATIONS.map(
    (item) => `<option value="${item}"></option>`
  ).join("");
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validPhone(phone) {
  return /^0\d{9}$/.test(phone);
}

function validLicense(license) {
  return /^[A-Za-z0-9-]{4,20}$/.test(license);
}

function generateStaffId(role, list) {
  const prefixMap = {
    ADMIN: "ADM",
    RECEPTIONIST: "REC",
    DOCTOR: "DOC",
    PHARMACIST: "PHA"
  };

  const prefix = prefixMap[role] || "USR";
  const count = list.filter((item) => item.staffId && item.staffId.startsWith(prefix)).length + 1;
  return `${prefix}-${String(count).padStart(3, "0")}`;
}

function generateDoctorId(list) {
  const count = list.length + 1;
  return `DOC-${String(count).padStart(3, "0")}`;
}

function generateItemId(list) {
  const count = list.length + 1;
  return `ITM-${String(count).padStart(3, "0")}`;
}

function generateTempPassword(name, role) {
  const clean = name.replace(/\s+/g, "").slice(0, 4) || "USER";
  const rolePart = role.slice(0, 3);
  const random = Math.floor(100 + Math.random() * 900);
  return `${clean}@${rolePart}${random}`;
}

function showSection(targetId) {
  navButtons.forEach((btn) => btn.classList.remove("active"));
  sections.forEach((section) => section.classList.remove("active-section"));

  const targetSection = document.getElementById(targetId);
  if (!targetSection) return;

  targetSection.classList.add("active-section");

  const targetButton = document.querySelector(`.nav-btn[data-target="${targetId}"]`);
  if (targetButton) targetButton.classList.add("active");

  if (targetId === "section-overview") renderOverview();
  if (targetId === "section-users") renderUsers();
  if (targetId === "section-doctors") renderDoctors();
  if (targetId === "section-stock") renderStock();
  if (targetId === "section-appointments") renderAppointments();
  if (targetId === "section-reports") renderReports();
}

/* Overview */
function renderOverview() {
  const users = getUsers();
  const doctors = getDoctors();
  const appointments = getAppointments();
  const invoices = getInvoices();

  const revenue = invoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);

  document.getElementById("metricUsers").textContent = users.length;
  document.getElementById("metricDoctors").textContent = doctors.length;
  document.getElementById("metricAppointments").textContent = appointments.length;
  document.getElementById("metricRevenue").textContent = revenue.toFixed(2);

  const activityList = document.getElementById("activityList");
  activityList.innerHTML = "";

  const activities = [
    `${users.length} total users available in the system`,
    `${doctors.length} doctor profiles are active`,
    `${appointments.length} appointments currently scheduled`,
    `${invoices.length} invoices generated so far`
  ];

  activities.forEach((activity) => {
    activityList.innerHTML += `<div class="activity-item">${activity}</div>`;
  });

  const alertsList = document.getElementById("alertsList");
  alertsList.innerHTML = "";

  const lowStockItems = getInventory().filter(
    (item) => item.type === "MEDICINE" && Number(item.stock) <= 10
  );

  const alerts = [];

  if (lowStockItems.length > 0) alerts.push(`${lowStockItems.length} item(s) are low in stock`);
  if (appointments.length === 0) alerts.push("No appointments are currently available");
  if (invoices.length === 0) alerts.push("No invoices have been generated yet");
  if (alerts.length === 0) alerts.push("No critical alerts at the moment");

  alerts.forEach((alert) => {
    alertsList.innerHTML += `<div class="alert-item">${alert}</div>`;
  });
}

/* User Management */
function setupUserEventListeners() {
  if (!saveUserBtn || !clearUserBtn) return;

  saveUserBtn.addEventListener("click", () => {
    clearFieldErrors([
      "userNameError",
      "userEmailError",
      "userPhoneError",
      "userRoleError",
      "userStatusError"
    ]);

    const editingUserId = document.getElementById("editingUserId").value;
    const name = document.getElementById("userName").value.trim();
    const email = document.getElementById("userEmail").value.trim().toLowerCase();
    const phone = document.getElementById("userPhone").value.trim();
    const role = document.getElementById("userRole").value;
    const status = document.getElementById("userStatus").value;

    let hasError = false;

    if (name.length < 3) {
      document.getElementById("userNameError").textContent = "Full name must be at least 3 characters.";
      hasError = true;
    }

    if (!validEmail(email)) {
      document.getElementById("userEmailError").textContent = "Enter a valid email address.";
      hasError = true;
    }

if (!validPhone(phone)) {
      document.getElementById("userPhoneError").textContent = "Phone must be 10 digits and start with 0.";
      hasError = true;
    }

    if (!role) {
      document.getElementById("userRoleError").textContent = "Please select a role.";
      hasError = true;
    }

    if (!status) {
      document.getElementById("userStatusError").textContent = "Please select a status.";
      hasError = true;
    }

    let users = getUsers();

    const duplicateEmail = users.find(
      (u) => u.email === email && u.staffId !== editingUserId
    );

    if (duplicateEmail) {
      document.getElementById("userEmailError").textContent = "This email is already used.";
      hasError = true;
    }

    if (hasError) {
      setStatusMessage(userMessageBox, "Please fix the highlighted user form errors.", "error");
      return;
    }

    if (editingUserId) {
      const user = users.find((u) => u.staffId === editingUserId);
      if (!user) return;

      user.name = name;
      user.email = email;
      user.phone = phone;
      user.role = role;
      user.status = status;

      saveUsers(users);
      setStatusMessage(userMessageBox, "User updated successfully.", "success");
    } else {
      const staffId = generateStaffId(role, users);
      const tempPassword = generateTempPassword(name, role);

      users.push({
        staffId,
        name,
        email,
        phone,
        role,
        status,
        tempPassword
      });

      saveUsers(users);

      document.getElementById("generatedStaffId").textContent = staffId;
      document.getElementById("generatedPassword").textContent = tempPassword;

      setStatusMessage(
        userMessageBox,
        `User created successfully. Generated ID: ${staffId}`,
        "success"
      );
    }

    document.getElementById("userForm").reset();
    document.getElementById("editingUserId").value = "";
    renderUsers();
    renderOverview();
  });

  clearUserBtn.addEventListener("click", () => {
    document.getElementById("userForm").reset();
    document.getElementById("editingUserId").value = "";
    document.getElementById("generatedStaffId").textContent = "Will generate on save";
    document.getElementById("generatedPassword").textContent = "Will generate on save";

    clearFieldErrors([
      "userNameError",
      "userEmailError",
      "userPhoneError",
      "userRoleError",
      "userStatusError"
    ]);

    setStatusMessage(userMessageBox, "User form cleared.", "default");
  });

  printIdBadgeBtn.addEventListener("click", () => {
    document.getElementById("printBadgeModal").classList.add("show");
    document.getElementById("badgeStaffIdInput").focus();
  });
}

function editUser(staffId) {
  const users = getUsers();
  const user = users.find((u) => u.staffId === staffId);
  if (!user) return;

  document.getElementById("editingUserId").value = user.staffId;
  document.getElementById("userName").value = user.name;
  document.getElementById("userEmail").value = user.email;
  document.getElementById("userPhone").value = user.phone;
  document.getElementById("userRole").value = user.role;
  document.getElementById("userStatus").value = user.status;
  document.getElementById("generatedStaffId").textContent = user.staffId;
  document.getElementById("generatedPassword").textContent = user.tempPassword || "-";

  setStatusMessage(userMessageBox, `Editing user ${user.staffId}`, "warning");
}

function deleteUser(staffId) {
  const ok = confirm("Are you sure you want to delete this user?");
  if (!ok) return;

  let users = getUsers();
  users = users.filter((u) => u.staffId !== staffId);
  saveUsers(users);
  renderUsers();
  renderOverview();
  setStatusMessage(userMessageBox, "User deleted successfully.", "success");
}

function renderUsers() {
  const users = getUsers();
  userTableBody.innerHTML = "";

  if (users.length === 0) {
    userTableBody.innerHTML = `<tr><td colspan="8">No users found.</td></tr>`;
    return;
  }

users.forEach((user) => {
    userTableBody.innerHTML += 
      `<tr>
        <td>${user.staffId}</td>
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>${user.phone}</td>
        <td>${user.role}</td>
        <td>${user.status}</td>
        <td>${user.tempPassword || "-"}</td>
        <td>
          <div class="row-actions">
            <button class="action-btn edit" onclick="editUser('${user.staffId}')">Edit</button>
            <button class="action-btn delete" onclick="deleteUser('${user.staffId}')">Delete</button>
          </div>
        </td>
      </tr>
    `;
  });
}

/* Doctor Management */
function setupDoctorEventListeners() {
  if (!saveDoctorBtn || !clearDoctorBtn) return;

  saveDoctorBtn.addEventListener("click", () => {
    clearFieldErrors([
      "doctorNameError",
      "doctorSpecializationError",
      "doctorLicenseError",
      "doctorEmailError",
      "doctorPhoneError",
      "doctorRoomError",
      "doctorExperienceError",
      "doctorScheduleError"
    ]);

    const editingDoctorId = document.getElementById("editingDoctorId").value;
    const name = document.getElementById("doctorFullName").value.trim();
    const specialization = document.getElementById("doctorSpecialization").value.trim();
    const license = document.getElementById("doctorLicense").value.trim();
    const email = document.getElementById("doctorEmail").value.trim().toLowerCase();
    const phone = document.getElementById("doctorPhone").value.trim();
    const room = document.getElementById("doctorRoom").value.trim();
    const experience = document.getElementById("doctorExperience").value.trim();
    const schedule = document.getElementById("doctorSchedule").value.trim();

    let hasError = false;

    if (name.length < 3) {
      document.getElementById("doctorNameError").textContent = "Doctor name must be at least 3 characters.";
      hasError = true;
    }

    if (!SPECIALIZATIONS.includes(specialization)) {
      document.getElementById("doctorSpecializationError").textContent = "Select a valid specialization from the list.";
      hasError = true;
    }

    if (!validLicense(license)) {
      document.getElementById("doctorLicenseError").textContent = "Enter a valid license number.";
      hasError = true;
    }

    if (!validEmail(email)) {
      document.getElementById("doctorEmailError").textContent = "Enter a valid doctor email.";
      hasError = true;
    }

    if (!validPhone(phone)) {
      document.getElementById("doctorPhoneError").textContent = "Phone must be 10 digits and start with 0.";
      hasError = true;
    }

    if (!room) {
      document.getElementById("doctorRoomError").textContent = "Enter room number.";
      hasError = true;
    }

    if (experience === "" || Number(experience) < 0 || Number(experience) > 60) {
      document.getElementById("doctorExperienceError").textContent = "Enter valid years of experience.";
      hasError = true;
    }

    if (schedule.length < 5) {
      document.getElementById("doctorScheduleError").textContent = "Enter a proper schedule.";
      hasError = true;
    }

    let doctors = getDoctors();

    const duplicateLicense = doctors.find(
      (d) => d.license === license && d.doctorId !== editingDoctorId
    );

    if (duplicateLicense) {
      document.getElementById("doctorLicenseError").textContent = "License number already exists.";
      hasError = true;
    }

    if (hasError) {
      setStatusMessage(doctorMessageBox, "Please fix the highlighted doctor form errors.", "error");
      return;
    }

    if (editingDoctorId) {
      const doctor = doctors.find((d) => d.doctorId === editingDoctorId);
      if (!doctor) return;

      doctor.name = name;
      doctor.specialization = specialization;
      doctor.license = license;
      doctor.email = email;
      doctor.phone = phone;
      doctor.room = room;
      doctor.experience = Number(experience);
      doctor.schedule = schedule;

saveDoctors(doctors);
      setStatusMessage(doctorMessageBox, "Doctor updated successfully.", "success");
    } else {
      const doctorId = generateDoctorId(doctors);

      doctors.push({
        doctorId,
        name,
        specialization,
        license,
        email,
        phone,
        room,
        experience: Number(experience),
        schedule
      });

      saveDoctors(doctors);
      setStatusMessage(doctorMessageBox, `Doctor created successfully. ID: ${doctorId}`, "success");
    }

    document.getElementById("doctorForm").reset();
    document.getElementById("editingDoctorId").value = "";
    renderDoctors();
    renderOverview();
  });

  clearDoctorBtn.addEventListener("click", () => {
    document.getElementById("doctorForm").reset();
    document.getElementById("editingDoctorId").value = "";

    clearFieldErrors([
      "doctorNameError",
      "doctorSpecializationError",
      "doctorLicenseError",
      "doctorEmailError",
      "doctorPhoneError",
      "doctorRoomError",
      "doctorExperienceError",
      "doctorScheduleError"
    ]);

    setStatusMessage(doctorMessageBox, "Doctor form cleared.", "default");
  });
}

function editDoctor(doctorId) {
  const doctors = getDoctors();
  const doctor = doctors.find((d) => d.doctorId === doctorId);
  if (!doctor) return;

  document.getElementById("editingDoctorId").value = doctor.doctorId;
  document.getElementById("doctorFullName").value = doctor.name;
  document.getElementById("doctorSpecialization").value = doctor.specialization;
  document.getElementById("doctorLicense").value = doctor.license;
  document.getElementById("doctorEmail").value = doctor.email;
  document.getElementById("doctorPhone").value = doctor.phone;
  document.getElementById("doctorRoom").value = doctor.room;
  document.getElementById("doctorExperience").value = doctor.experience;
  document.getElementById("doctorSchedule").value = doctor.schedule;

  setStatusMessage(doctorMessageBox, `Editing doctor ${doctor.doctorId}`, "warning");
}

function deleteDoctor(doctorId) {
  const ok = confirm("Are you sure you want to delete this doctor?");
  if (!ok) return;

  let doctors = getDoctors();
  doctors = doctors.filter((d) => d.doctorId !== doctorId);
  saveDoctors(doctors);
  renderDoctors();
  renderOverview();
  setStatusMessage(doctorMessageBox, "Doctor deleted successfully.", "success");
}

function renderDoctors() {
  const doctors = getDoctors();
  doctorTableBody.innerHTML = "";

  if (doctors.length === 0) {
    doctorTableBody.innerHTML = `<tr><td colspan="10">No doctor records found.</td></tr>`;
    return;
  }

  doctors.forEach((doctor) => {
    doctorTableBody.innerHTML += 
      `<tr>
        <td>${doctor.doctorId}</td>
        <td>${doctor.name}</td>
        <td>${doctor.specialization}</td>
        <td>${doctor.license}</td>
        <td>${doctor.email}</td>
        <td>${doctor.phone}</td>
        <td>${doctor.room}</td>
        <td>${doctor.experience}</td>
        <td>${doctor.schedule}</td>
        <td>
          <div class="row-actions">
            <button class="action-btn edit" onclick="editDoctor('${doctor.doctorId}')">Edit</button>
            <button class="action-btn delete" onclick="deleteDoctor('${doctor.doctorId}')">Delete</button>
          </div>
        </td>
      </tr>
    `;
  });
}

/* Stock Management */
function setupStockEventListeners() {
  if (!saveStockBtn || !clearStockBtn) return;

  saveStockBtn.addEventListener("click", () => {
    clearFieldErrors([
      "stockNameError",
      "stockTypeError",
      "stockPriceError",
      "stockQtyError"
    ]);

    const editingStockId = document.getElementById("editingStockId").value;
    const name = document.getElementById("stockName").value.trim();
    const type = document.getElementById("stockType").value;
    const price = document.getElementById("stockPrice").value.trim();
    const qty = document.getElementById("stockQty").value.trim();

    let hasError = false;

if (name.length < 2) {
      document.getElementById("stockNameError").textContent = "Enter a valid item name.";
      hasError = true;
    }

    if (!type) {
      document.getElementById("stockTypeError").textContent = "Select item type.";
      hasError = true;
    }

    if (price === "" || Number(price) < 0) {
      document.getElementById("stockPriceError").textContent = "Price must be 0 or more.";
      hasError = true;
    }

    if (qty === "" || Number(qty) < 0) {
      document.getElementById("stockQtyError").textContent = "Stock quantity must be 0 or more.";
      hasError = true;
    }

    let inventory = getInventory();

    if (hasError) {
      setStatusMessage(stockMessageBox, "Please fix the highlighted stock form errors.", "error");
      return;
    }

    if (editingStockId) {
      const item = inventory.find((i) => i.itemId === editingStockId);
      if (!item) return;

      item.name = name;
      item.type = type;
      item.price = Number(price);
      item.stock = Number(qty);

      saveInventory(inventory);
      setStatusMessage(stockMessageBox, "Stock item updated successfully.", "success");
    } else {
      const itemId = generateItemId(inventory);

      inventory.push({
        itemId,
        name,
        type,
        price: Number(price),
        stock: Number(qty)
      });

      saveInventory(inventory);
      setStatusMessage(stockMessageBox, `Stock item created successfully. ID: ${itemId}`, "success");
    }

    document.getElementById("stockForm").reset();
    document.getElementById("editingStockId").value = "";
    renderStock();
    renderOverview();
  });

  clearStockBtn.addEventListener("click", () => {
    document.getElementById("stockForm").reset();
    document.getElementById("editingStockId").value = "";

    clearFieldErrors([
      "stockNameError",
      "stockTypeError",
      "stockPriceError",
      "stockQtyError"
    ]);

    setStatusMessage(stockMessageBox, "Stock form cleared.", "default");
  });
}

function editStock(itemId) {
  const inventory = getInventory();
  const item = inventory.find((i) => i.itemId === itemId);
  if (!item) return;

  document.getElementById("editingStockId").value = item.itemId;
  document.getElementById("stockName").value = item.name;
  document.getElementById("stockType").value = item.type;
  document.getElementById("stockPrice").value = item.price;
  document.getElementById("stockQty").value = item.stock;

  setStatusMessage(stockMessageBox, `Editing stock item ${item.itemId}`, "warning");
}

function deleteStock(itemId) {
  const ok = confirm("Are you sure you want to delete this stock item?");
  if (!ok) return;

  let inventory = getInventory();
  inventory = inventory.filter((i) => i.itemId !== itemId);
  saveInventory(inventory);
  renderStock();
  renderOverview();
  setStatusMessage(stockMessageBox, "Stock item deleted successfully.", "success");
}

function renderStock() {
  const inventory = getInventory();
  stockTableBody.innerHTML = "";

  if (inventory.length === 0) {
    stockTableBody.innerHTML = `<tr><td colspan="7">No stock data available.</td></tr>`;
    return;
  }

  inventory.forEach((item) => {
    const status =
      item.type === "MEDICINE"
        ? Number(item.stock) <= 10
          ? "Low Stock"
          : "Available"
        : "Billable";

    stockTableBody.innerHTML += 
      `<tr>
        <td>${item.itemId}</td>
        <td>${item.name}</td>
        <td>${item.type}</td>
        <td>Rs. ${Number(item.price).toFixed(2)}</td>
        <td>${item.stock}</td>
        <td>${status}</td>
        <td>
          <div class="row-actions">
            <button class="action-btn edit" onclick="editStock('${item.itemId}')">Edit</button>
            <button class="action-btn delete" onclick="deleteStock('${item.itemId}')">Delete</button>
          </div>
        </td>
      </tr>
    `;
  });
}

/* Appointments */
function renderAppointments() {
  const appointments = getAppointments();
  appointmentTableBody.innerHTML = "";


if (appointments.length === 0) {
    appointmentTableBody.innerHTML = `<tr><td colspan="5">No appointments found.</td></tr>`;
    return;
  }

  appointments.forEach((appointment) => {
    appointmentTableBody.innerHTML += 
      `<tr>
        <td>${appointment.appointmentPatient}</td>
        <td>${appointment.doctorName}</td>
        <td>${appointment.appointmentDate}</td>
        <td>${appointment.appointmentTime}</td>
        <td>${appointment.appointmentStatus}</td>
      </tr>
    `;
  });
}

/* Reports */
function renderReports() {
  const invoices = getInvoices();
  reportInvoiceTableBody.innerHTML = "";

  if (invoices.length === 0) {
    reportInvoiceTableBody.innerHTML = `<tr><td colspan="5">No invoice report data available.</td></tr>`;
  } else {
    invoices.forEach((invoice) => {
      reportInvoiceTableBody.innerHTML += 
        `<tr>
          <td>${invoice.invoiceId}</td>
          <td>${invoice.patient}</td>
          <td>${invoice.date}</td>
          <td>${invoice.method}</td>
          <td>Rs. ${Number(invoice.total).toFixed(2)}</td>
        </tr>
      `;
    });
  }

  renderRevenueChart(invoices);
  renderSalesChart(invoices);
}

function renderRevenueChart(invoices) {
  const ctx = document.getElementById("revenueChart");
  if (!ctx) return;

  const labels = invoices.map((invoice) => invoice.invoiceId);
  const data = invoices.map((invoice) => Number(invoice.total));

  if (revenueChart) revenueChart.destroy();

  revenueChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Revenue",
          data,
          borderColor: "#7b6ee6",
          backgroundColor: "rgba(123, 110, 230, 0.15)",
          fill: true,
          tension: 0.35
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true }
      }
    }
  });
}

function renderSalesChart(invoices) {
  const ctx = document.getElementById("salesChart");
  if (!ctx) return;

  const methodCounts = {
    Cash: 0,
    Card: 0,
    Online: 0
  };

  invoices.forEach((invoice) => {
    if (methodCounts[invoice.method] !== undefined) {
      methodCounts[invoice.method] += 1;
    }
  });

  if (salesChart) salesChart.destroy();

  salesChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(methodCounts),
      datasets: [
        {
          label: "Sales Count",
          data: Object.values(methodCounts),
          backgroundColor: ["#7b6ee6", "#4f7ef1", "#9f8ff5"]
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true }
      }
    }
  });
}

/* Employee ID Badge Functions */
function fillEmployeeBadge(user) {
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  // Role to Department Mapping
  const roleDeptMap = {
    ADMIN: "Administration",
    RECEPTIONIST: "Reception",
    DOCTOR: "Medical",
    PHARMACIST: "Pharmacy"
  };

  document.getElementById("badgeEmployeeId").textContent = user.staffId || "ADM-001";
  document.getElementById("badgeEmployeeName").textContent = user.name || "-";
  document.getElementById("badgeEmployeeRole").textContent = user.role || "-";
  document.getElementById("badgeEmployeeDept").textContent = roleDeptMap[user.role] || "Staff";
  document.getElementById("badgeEmployeePhone").textContent = user.phone || "-";
  document.getElementById("badgeIssuedDate").textContent = formattedDate;
}

function printEmployeeIdBadge(user) {
  fillEmployeeBadge(user);
  const printWrap = document.getElementById("printBadgeWrap");
  printWrap.classList.add("show");
  
  // Wait for rendering before printing
  setTimeout(() => {
    window.print();
    // Hide after print dialog closes
    setTimeout(() => {
      printWrap.classList.remove("show");
    }, 500);
  }, 100);
}

document.addEventListener("DOMContentLoaded", () => {
  navButtons = document.querySelectorAll(".nav-btn[data-target]");
  sections = document.querySelectorAll(".content-section");
  logoutBtn = document.getElementById("logoutBtn");

  userTableBody = document.getElementById("userTableBody");
  doctorTableBody = document.getElementById("doctorTableBody");
  stockTableBody = document.getElementById("stockTableBody");
  appointmentTableBody = document.getElementById("appointmentTableBody");
  reportInvoiceTableBody = document.getElementById("reportInvoiceTableBody");

  saveUserBtn = document.getElementById("saveUserBtn");
  clearUserBtn = document.getElementById("clearUserBtn");
  printIdBadgeBtn = document.getElementById("printIdBadgeBtn");
  userMessageBox = document.getElementById("userMessageBox");

  saveDoctorBtn = document.getElementById("saveDoctorBtn");
  clearDoctorBtn = document.getElementById("clearDoctorBtn");
  doctorMessageBox = document.getElementById("doctorMessageBox");

  saveStockBtn = document.getElementById("saveStockBtn");
  clearStockBtn = document.getElementById("clearStockBtn");
  stockMessageBox = document.getElementById("stockMessageBox");

  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      showSection(button.dataset.target);
    });
  });

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }

  /* Modal Event Listeners */
  const printBadgeModal = document.getElementById("printBadgeModal");
  const closePrintBadgeModal = document.getElementById("closePrintBadgeModal");
  const badgeStaffIdInput = document.getElementById("badgeStaffIdInput");
  const printBadgeConfirmBtn = document.getElementById("printBadgeConfirmBtn");
  const cancelPrintBadgeBtn = document.getElementById("cancelPrintBadgeBtn");
  const badgeStaffIdError = document.getElementById("badgeStaffIdError");

  function closeModal() {
    printBadgeModal.classList.remove("show");
    badgeStaffIdInput.value = "";
    badgeStaffIdError.textContent = "";
  }

  closePrintBadgeModal.addEventListener("click", closeModal);
  cancelPrintBadgeBtn.addEventListener("click", closeModal);

  badgeStaffIdInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      printBadgeConfirmBtn.click();
    }
  });

  printBadgeConfirmBtn.addEventListener("click", () => {
    const staffId = badgeStaffIdInput.value.trim().toUpperCase();

    badgeStaffIdError.textContent = "";

    if (!staffId) {
      badgeStaffIdError.textContent = "Please enter a Staff ID.";
      return;
    }

    const users = getUsers();
    const user = users.find((u) => u.staffId === staffId);

    if (!user) {
      badgeStaffIdError.textContent = `Staff ID "${staffId}" not found.`;
      return;
    }

    closeModal();
    printEmployeeIdBadge(user);
  });

  printBadgeModal.addEventListener("click", (e) => {
    if (e.target === printBadgeModal) {
      closeModal();
    }
  });

setupUserEventListeners();
  setupDoctorEventListeners();
  setupStockEventListeners();
  populateSpecializations();

  showSection("section-overview");
  renderUsers();
  renderDoctors();
  renderStock();
  renderAppointments();
  renderReports();
});