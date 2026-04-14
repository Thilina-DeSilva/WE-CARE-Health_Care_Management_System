/* ================================================================
   WE CARE — Login System
   Authenticates against admin-created accounts in wecare_users.
   Staff ID = username, tempPassword = password.
   On success, stores session in localStorage and redirects.
   ================================================================ */

const roleButtons  = document.querySelectorAll(".role-btn");
const loginForm    = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const demoList     = document.getElementById("demoCredentialsList");

let selectedRole = "doctor";

/* ─── Role tabs ─────────────────────────────────── */
roleButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    roleButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedRole = btn.dataset.role;
    setMsg("Select your role and enter credentials.", "default");
    updateDemoBox();
  });
});

/* ─── Storage helpers ───────────────────────────── */
function getUsers() {
  return JSON.parse(localStorage.getItem("wecare_users")) || [];
}

function getDoctors() {
  return JSON.parse(localStorage.getItem("wecare_doctors")) || [];
}

/* ─── Role → page map ───────────────────────────── */
const ROLE_PAGES = {
  ADMIN:        "admin.html",
  RECEPTIONIST: "receptionist.html",
  DOCTOR:       "doctor.html",
  PHARMACIST:   "pharmacist.html"
};

/* ─── Hardcoded fallback accounts (if admin hasn't created users yet) ─── */
const FALLBACK_ACCOUNTS = [
  { staffId:"ADM-001", name:"Admin",       role:"ADMIN",        tempPassword:"admin123",       status:"ACTIVE" },
  { staffId:"REC-001", name:"Receptionist",role:"RECEPTIONIST", tempPassword:"receptionist123",status:"ACTIVE" },
  { staffId:"DOC-001", name:"Dr. Silva",   role:"DOCTOR",       tempPassword:"doctor123",      status:"ACTIVE" },
  { staffId:"PHA-001", name:"Pharmacist",  role:"PHARMACIST",   tempPassword:"pharmacist123",  status:"ACTIVE" }
];

function getAllAccounts() {
  const users = getUsers();
  return users.length ? users : FALLBACK_ACCOUNTS;
}

/* ─── Demo box: show real accounts for selected role ─ */
function updateDemoBox() {
  if (!demoList) return;
  const role = selectedRole.toUpperCase();
  const accounts = getAllAccounts().filter(u => u.role === role && u.status === "ACTIVE");

  if (!accounts.length) {
    demoList.innerHTML = `<li style="color:#94a3b8;">No ${selectedRole} accounts created yet. Ask admin to create one.</li>`;
    return;
  }

  demoList.innerHTML = accounts.map(u =>
    `<li><strong>${u.staffId}</strong> — password: <code style="background:#f0f4f9;padding:1px 6px;border-radius:4px;">${u.tempPassword || "—"}</code> <span style="color:#94a3b8;">(${u.name})</span></li>`
  ).join("");
}

/* ─── Status message helper ─────────────────────── */
function setMsg(text, type) {
  if (!loginMessage) return;
  loginMessage.textContent = text;
  loginMessage.style.color = type === "success" ? "#10b981"
    : type === "error" ? "#f04040"
    : "#94a3b8";
}

/* ─── Login submit ──────────────────────────────── */
loginForm.addEventListener("submit", e => {
  e.preventDefault();

  const staffId  = document.getElementById("username").value.trim().toUpperCase();
  const password = document.getElementById("password").value.trim();
  const role     = selectedRole.toUpperCase();

  if (!staffId || !password) {
    setMsg("Please enter your Staff ID and password.", "error");
    return;
  }

  const accounts = getAllAccounts();

  // Find user matching Staff ID + role + password
  const user = accounts.find(u =>
    u.staffId.toUpperCase() === staffId &&
    u.role === role &&
    u.tempPassword === password
  );

  if (!user) {
    // Give helpful message
    const idExists = accounts.find(u => u.staffId.toUpperCase() === staffId);
    if (idExists && idExists.role !== role) {
      setMsg(`Staff ID ${staffId} belongs to role: ${idExists.role}. Please select the correct role tab.`, "error");
    } else if (idExists) {
      setMsg("Incorrect password. Check the credentials below.", "error");
    } else {
      setMsg(`Staff ID "${staffId}" not found. Ask admin to create your account.`, "error");
    }
    return;
  }

  if (user.status !== "ACTIVE") {
    setMsg("Your account is inactive. Contact the administrator.", "error");
    return;
  }

  // ─── Store session ─────────────────────────────
  const session = {
    staffId:   user.staffId,
    name:      user.name,
    role:      user.role,
    loginTime: new Date().toISOString()
  };
  localStorage.setItem("wecare_session", JSON.stringify(session));

  // Role-specific ID storage so each dashboard knows who is logged in
  if (user.role === "DOCTOR") {
    // Find matching doctor record by doctorId or name
    const doctors = getDoctors();
    // Doctor users created via admin have staffId like DOC-001 which matches doctorId
    const doctor = doctors.find(d => d.doctorId === user.staffId) ||
                   doctors.find(d => d.name.toLowerCase() === user.name.toLowerCase());
    if (doctor) {
      localStorage.setItem("wecare_current_doctor_id", doctor.doctorId);
    } else {
      // staffId IS the doctorId for doctor accounts
      localStorage.setItem("wecare_current_doctor_id", user.staffId);
    }
  }

  setMsg(`Welcome, ${user.name}! Redirecting…`, "success");

  const page = ROLE_PAGES[user.role] || "index.html";
  setTimeout(() => { window.location.href = page; }, 700);
});

/* ─── Init ──────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  // Clear any old session on login page load
  localStorage.removeItem("wecare_session");
  localStorage.removeItem("wecare_current_doctor_id");
  updateDemoBox();
});
