
const navButtons = document.querySelectorAll(".nav-btn[data-target]");
const sections = document.querySelectorAll(".content-section");
const logoutBtn = document.getElementById("logoutBtn");

const appointmentSearchInput = document.getElementById("appointmentSearchInput");
const doctorAppointmentTableBody = document.getElementById("doctorAppointmentTableBody");

const consultationForm = document.getElementById("consultationForm");
const saveConsultationBtn = document.getElementById("saveConsultationBtn");
const clearConsultationBtn = document.getElementById("clearConsultationBtn");
const consultationMessageBox = document.getElementById("consultationMessageBox");

const historySearchInput = document.getElementById("historySearchInput");
const historyTableBody = document.getElementById("historyTableBody");
const totalConsultationsBtn = document.getElementById("totalConsultationsBtn");

function getAppointments() {
  return JSON.parse(localStorage.getItem("wecare_appointments")) || [];
}

function getConsultations() {
  return JSON.parse(localStorage.getItem("wecare_consultations")) || [];
}

function saveConsultations(data) {
  localStorage.setItem("wecare_consultations", JSON.stringify(data));
}

function showSection(targetId) {
  navButtons.forEach((btn) => btn.classList.remove("active"));
  sections.forEach((section) => section.classList.remove("active-section"));

  document.getElementById(targetId).classList.add("active-section");
  document.querySelector(`.nav-btn[data-target="${targetId}"]`)?.classList.add("active");

  if (targetId === "section-appointments") renderAppointments();
  if (targetId === "section-history") renderHistory();
  if (targetId === "section-profile") updateConsultationCount();
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showSection(button.dataset.target);
  });
});

function setStatusMessage(element, text, type = "default") {
  element.textContent = text;

  if (type === "success") element.style.color = "#16a34a";
  else if (type === "error") element.style.color = "#dc2626";
  else if (type === "warning") element.style.color = "#d97706";
  else element.style.color = "#6b7280";
}

function renderAppointments() {
  const appointments = getAppointments();
  const keyword = appointmentSearchInput.value.trim().toLowerCase();

  const filtered = appointments.filter((appointment) => {
    return appointment.appointmentPatient.toLowerCase().includes(keyword);
  });

  doctorAppointmentTableBody.innerHTML = "";

  if (filtered.length === 0) {
    doctorAppointmentTableBody.innerHTML = `<tr class="empty-row">
        <td colspan="4">No appointments found.</td>
      </tr>`;
  } else {
    filtered.forEach((appointment) => {
      const badgeClass =
        appointment.appointmentStatus.toLowerCase() === "completed"
          ? "badge-completed"
          : "badge-booked";

      doctorAppointmentTableBody.innerHTML += `<tr>
          <td>${appointment.appointmentPatient}</td>
          <td>${appointment.appointmentDate}</td>
          <td>${appointment.appointmentTime}</td>
          <td><span class="badge ${badgeClass}">${appointment.appointmentStatus}</span></td>
        </tr>`;
    });
  }

  updateAppointmentSummary(filtered);
}

function updateAppointmentSummary(appointments) {
  const todayAppointmentsCount = document.getElementById("todayAppointmentsCount");
  const completedAppointmentsCount = document.getElementById("completedAppointmentsCount");
  const pendingAppointmentsCount = document.getElementById("pendingAppointmentsCount");

  const total = appointments.length;
  const completed = appointments.filter(
    (appointment) => appointment.appointmentStatus.toLowerCase() === "completed"
  ).length;
  const pending = total - completed;

  todayAppointmentsCount.textContent = total;
  completedAppointmentsCount.textContent = completed;
  pendingAppointmentsCount.textContent = pending;
}

appointmentSearchInput.addEventListener("input", renderAppointments);


saveConsultationBtn.addEventListener("click", () => {
  const consultPatientName = document.getElementById("consultPatientName").value.trim();
  const consultAppointmentDate = document.getElementById("consultAppointmentDate").value;
  const diagnosis = document.getElementById("diagnosis").value.trim();
  const consultNotes = document.getElementById("consultNotes").value.trim();
  const prescribedItems = document.getElementById("prescribedItems").value.trim();

  if (!consultPatientName || !consultAppointmentDate || !diagnosis || !consultNotes || !prescribedItems) {
    setStatusMessage(consultationMessageBox, "Please fill all consultation fields.", "error");
    return;
  }

  const consultations = getConsultations();
  consultations.push({
    consultPatientName,
    consultAppointmentDate,
    diagnosis,
    consultNotes,
    prescribedItems
  });

  saveConsultations(consultations);
  consultationForm.reset();
  setStatusMessage(consultationMessageBox, "Consultation saved successfully.", "success");
  updateConsultationCount();
});

clearConsultationBtn.addEventListener("click", () => {
  consultationForm.reset();
  setStatusMessage(consultationMessageBox, "Form cleared.", "default");
});

function renderHistory() {
  const consultations = getConsultations();
  const keyword = historySearchInput.value.trim().toLowerCase();

  const filtered = consultations.filter((consultation) =>
    consultation.consultPatientName.toLowerCase().includes(keyword)
  );

  historyTableBody.innerHTML = "";

  if (filtered.length === 0) {
    historyTableBody.innerHTML = `<tr class="empty-row">
        <td colspan="5">No consultation history found.</td>
      </tr>`;
    return;
  }

  filtered.forEach((consultation) => {
    historyTableBody.innerHTML += `<tr>
        <td>${consultation.consultPatientName}</td>
        <td>${consultation.consultAppointmentDate}</td>
        <td>${consultation.diagnosis}</td>
        <td>${consultation.consultNotes}</td>
        <td>${consultation.prescribedItems}</td>
      </tr>`;
  });
}

historySearchInput.addEventListener("input", renderHistory);

function updateConsultationCount() {
  const consultations = getConsultations();
  totalConsultationsBtn.textContent = `Total Consultations: ${consultations.length}`;
}

logoutBtn.addEventListener("click", () => {
  window.location.href = "index.html";
});

document.addEventListener("DOMContentLoaded", () => {
  renderAppointments();
  renderHistory();
  updateConsultationCount();
});