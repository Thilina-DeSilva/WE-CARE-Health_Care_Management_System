const roleButtons = document.querySelectorAll(".role-btn");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

let selectedRole = "doctor";

roleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    roleButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    selectedRole = button.dataset.role;
    loginMessage.textContent = `Selected role: ${selectedRole}`;
    loginMessage.style.color = "#6b7280";
  });
});

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    loginMessage.textContent = "Please enter username and password.";
    loginMessage.style.color = "#dc2626";
    return;
  }

  const validCredentials = {
    doctor: { username: "doctor", password: "123", page: "doctor.html" },
    pharmacist: { username: "pharmacist", password: "123", page: "pharmacist.html" },
    receptionist: { username: "receptionist", password: "123", page: "receptionist.html" },
    admin: { username: "admin", password: "123", page: "admin.html" }
  };

  const current = validCredentials[selectedRole];

  if (username === current.username && password === current.password) {
    loginMessage.textContent = "Login successful. Redirecting...";
    loginMessage.style.color = "#16a34a";

    setTimeout(() => {
      window.location.href = current.page;
    }, 700);
  } else {
    loginMessage.textContent = "Invalid credentials for selected role.";
    loginMessage.style.color = "#dc2626";
  }
});