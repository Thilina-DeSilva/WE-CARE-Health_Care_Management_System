let navButtons;
let sections;

let patientForm;
let saveBtn;
let clearBtn;
let printIdBtn;
let messageBox;

let appointmentForm;
let appointmentSaveBtn;
let appointmentClearBtn;
let appointmentMessageBox;

let patientSearchInput;
let appointmentSearchInput;

let patientTableBody;
let appointmentTableBody;

let logoutBtn;

let cameraPreview;
let cameraCanvas;
let patientPhotoInput;
let patientPhotoPreview;
let startCameraBtn;
let capturePhotoBtn;
let stopCameraBtn;

let currentCameraStream = null;
let currentPatientPhotoData = "";

const BASE_SLOTS = [
  "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30",
  "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30"
];

const NEED_TO_SPECIALIZATION = {
  "General Medicine": ["General Medicine", "Family Medicine"],
  "Cardiology": ["Cardiology", "General Medicine"],
  "Dermatology": ["Dermatology", "General Medicine"],
  "Neurology": ["Neurology", "General Medicine"],
  "Orthopedics": ["Orthopedics", "General Surgery"],
  "Pediatrics": ["Pediatrics", "General Medicine"],
  "ENT": ["Otolaryngology (ENT)", "General Medicine"],
  "Gynecology": ["Gynecology", "Obstetrics"],
  "Emergency Medicine": ["Emergency Medicine", "General Medicine"]
};

document.addEventListener("DOMContentLoaded", () => {
  navButtons = document.querySelectorAll(".nav-btn[data-target]");
  sections = document.querySelectorAll(".content-section");

  patientForm = document.getElementById("patientForm");
  saveBtn = document.getElementById("saveBtn");
  clearBtn = document.getElementById("clearBtn");
  printIdBtn = document.getElementById("printIdBtn");
  messageBox = document.getElementById("messageBox");

  appointmentForm = document.getElementById("appointmentForm");
  appointmentSaveBtn = document.getElementById("appointmentSaveBtn");
  appointmentClearBtn = document.getElementById("appointmentClearBtn");
  appointmentMessageBox = document.getElementById("appointmentMessageBox");

  patientSearchInput = document.getElementById("patientSearchInput");
  appointmentSearchInput = document.getElementById("appointmentSearchInput");

  patientTableBody = document.getElementById("patientTableBody");
  appointmentTableBody = document.getElementById("appointmentTableBody");

  logoutBtn = document.getElementById("logoutBtn");

  cameraPreview = document.getElementById("cameraPreview");
  cameraCanvas = document.getElementById("cameraCanvas");
  patientPhotoInput = document.getElementById("patientPhoto");
  patientPhotoPreview = document.getElementById("patientPhotoPreview");
  startCameraBtn = document.getElementById("startCameraBtn");
  capturePhotoBtn = document.getElementById("capturePhotoBtn");
  stopCameraBtn = document.getElementById("stopCameraBtn");

  seedDoctorsIfMissing();
  seedPatientsIfMissing();

  setupNav();
  setupPatientEvents();
  setupAppointmentEvents();
  setupCameraEvents();

  setMinimumDateTime();
  populatePatientDropdown();
  populatePatientSearchList();
  renderPatients();
  renderAppointments();
  showSection("section-add-patient");
});

function setupNav() {
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
}

function showSection(targetId) {
  navButtons.forEach((btn) => btn.classList.remove("active"));
  sections.forEach((section) => section.classList.remove("active-section"));

  const targetSection = document.getElementById(targetId);
  if (!targetSection) return;

  targetSection.classList.add("active-section");
  document.querySelector(`.nav-btn[data-target="${targetId}"]`)?.classList.add("active");

  if (targetId === "section-patient-list") renderPatients();
  if (targetId === "section-appointment-list") renderAppointments();
  if (targetId === "section-add-appointment") {
    populatePatientDropdown();
    populatePatientSearchList();
    filterDoctors();
    buildTimeSlots();
  }
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

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validPhone(phone) {
  return /^0\d{9}$/.test(phone);
}

// FIX: ID generators use max existing ID to prevent collision after deletion
function generatePatientId() {
  const patients = getPatients();
  if (patients.length === 0) return "PAT-001";
  const maxNum = Math.max(...patients.map(p => {
    const n = parseInt((p.patientId || "0").replace(/\D/g, ""), 10);
    return isNaN(n) ? 0 : n;
  }));
  return `PAT-${String(maxNum + 1).padStart(3, "0")}`;
}

function generateAppointmentId() {
  const appointments = getAppointments();
  if (appointments.length === 0) return "APT-001";
  const maxNum = Math.max(...appointments.map(a => {
    const n = parseInt((a.appointmentId || "0").replace(/\D/g, ""), 10);
    return isNaN(n) ? 0 : n;
  }));
  return `APT-${String(maxNum + 1).padStart(3, "0")}`;
}

function getPatients() {
  return JSON.parse(localStorage.getItem("wecare_patients")) || [];
}

function savePatients(data) {
  localStorage.setItem("wecare_patients", JSON.stringify(data));
}

function getAppointments() {
  return JSON.parse(localStorage.getItem("wecare_appointments")) || [];
}

function saveAppointments(data) {
  localStorage.setItem("wecare_appointments", JSON.stringify(data));
}

function getDoctors() {
  const fromAdmin = JSON.parse(localStorage.getItem("wecare_doctors"));
  if (fromAdmin && fromAdmin.length) return fromAdmin;

  return [
    { doctorId: "DOC-001", name: "Dr. Silva", specialization: "Cardiology", schedule: "Mon-Fri 9AM-2PM" },
    { doctorId: "DOC-002", name: "Dr. Perera", specialization: "General Medicine", schedule: "Mon-Fri 9AM-5PM" },
    { doctorId: "DOC-003", name: "Dr. Nadeesha", specialization: "Dermatology", schedule: "Tue-Sat 10AM-4PM" },
    { doctorId: "DOC-004", name: "Dr. Kasthuri", specialization: "Pediatrics", schedule: "Mon-Fri 9AM-3PM" },
    { doctorId: "DOC-005", name: "Dr. Fernando", specialization: "Emergency Medicine", schedule: "Daily 8AM-6PM" }
  ];
}

function seedDoctorsIfMissing() {
  const existing = JSON.parse(localStorage.getItem("wecare_doctors"));
  if (!existing || existing.length === 0) {
    localStorage.setItem("wecare_doctors", JSON.stringify(getDoctors()));
  }
}

function seedPatientsIfMissing() {
  const existing = JSON.parse(localStorage.getItem("wecare_patients"));
  if (!existing) {
    localStorage.setItem("wecare_patients", JSON.stringify([]));
  }
}

function getPOSQueue() {
  return JSON.parse(localStorage.getItem("wecare_pos_queue")) || [];
}

function savePOSQueue(data) {
  localStorage.setItem("wecare_pos_queue", JSON.stringify(data));
}

function getReceipts() {
  return JSON.parse(localStorage.getItem("wecare_reception_payments")) || [];
}

function saveReceipts(data) {
  localStorage.setItem("wecare_reception_payments", JSON.stringify(data));
}

function setMinimumDateTime() {
  const appointmentDate = document.getElementById("appointmentDate");
  if (!appointmentDate) return;

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  appointmentDate.min = `${yyyy}-${mm}-${dd}`;
}

function calculateAge(dob) {
  if (!dob) return 0;
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function setupCameraEvents() {
  if (patientPhotoInput) patientPhotoInput.addEventListener("change", handlePhotoUpload);

  if (startCameraBtn) {
    startCameraBtn.addEventListener("click", async () => {
      try {
        currentCameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        cameraPreview.srcObject = currentCameraStream;
        setStatusMessage(messageBox, "Camera started.", "success");
      } catch (error) {
        setStatusMessage(messageBox, "Camera access failed. Check browser permissions.", "error");
      }
    });
  }

  if (capturePhotoBtn) {
    capturePhotoBtn.addEventListener("click", () => {
      if (!currentCameraStream) {
        setStatusMessage(messageBox, "Start camera first.", "warning");
        return;
      }
      const context = cameraCanvas.getContext("2d");
      cameraCanvas.width = cameraPreview.videoWidth || 320;
      cameraCanvas.height = cameraPreview.videoHeight || 220;
      context.drawImage(cameraPreview, 0, 0, cameraCanvas.width, cameraCanvas.height);
      currentPatientPhotoData = cameraCanvas.toDataURL("image/png");
      patientPhotoPreview.src = currentPatientPhotoData;
      setStatusMessage(messageBox, "Photo captured successfully.", "success");
    });
  }

  if (stopCameraBtn) stopCameraBtn.addEventListener("click", stopCamera);
}

function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    currentPatientPhotoData = e.target.result;
    if (patientPhotoPreview) patientPhotoPreview.src = currentPatientPhotoData;
  };
  reader.readAsDataURL(file);
}

function stopCamera() {
  if (currentCameraStream) {
    currentCameraStream.getTracks().forEach((track) => track.stop());
    currentCameraStream = null;
    if (cameraPreview) cameraPreview.srcObject = null;
    setStatusMessage(messageBox, "Camera stopped.", "default");
  }
}

function setupPatientEvents() {
  if (saveBtn) saveBtn.addEventListener("click", handleSavePatient);
  if (clearBtn) clearBtn.addEventListener("click", clearPatientForm);
  if (printIdBtn) printIdBtn.addEventListener("click", printCurrentPatientCard);
  if (patientSearchInput) patientSearchInput.addEventListener("input", renderPatients);
}

function handleSavePatient() {
  clearFieldErrors([
    "nicError", "fullNameError", "emailError", "dobError", "genderError",
    "phoneError", "addressError", "emergencyContactError", "bloodGroupError", "medicalNotesError"
  ]);

  const editingPatientId = document.getElementById("editingPatientId").value;
  const nic = document.getElementById("nic").value.trim();
  const fullName = document.getElementById("fullName").value.trim();
  const email = document.getElementById("emailAddress").value.trim().toLowerCase();
  const dob = document.getElementById("dob").value;
  const gender = document.getElementById("gender").value;
  const phone = document.getElementById("phone").value.trim();
  const address = document.getElementById("address").value.trim();
  const emergencyContact = document.getElementById("emergencyContact").value.trim();
  const bloodGroup = document.getElementById("bloodGroup").value;
  const medicalNotes = document.getElementById("medicalNotes").value.trim();

  let hasError = false;

  if (nic.length < 5) {
    document.getElementById("nicError").textContent = "Enter a valid NIC or passport.";
    hasError = true;
  }

  if (fullName.length < 3) {
    document.getElementById("fullNameError").textContent = "Enter full patient name.";
    hasError = true;
  }

  if (!validEmail(email)) {
    document.getElementById("emailError").textContent = "Enter a valid email.";
    hasError = true;
  }

  if (!dob) {
    document.getElementById("dobError").textContent = "Select date of birth.";
    hasError = true;
  }

  if (dob && new Date(dob) > new Date()) {
    document.getElementById("dobError").textContent = "Date of birth cannot be in the future.";
    hasError = true;
  }

  // FIX: Validate that patient is not younger than 0 (impossible DOB)
  if (dob) {
    const age = calculateAge(dob);
    if (age > 150) {
      document.getElementById("dobError").textContent = "Enter a realistic date of birth.";
      hasError = true;
    }
  }

  if (!gender) {
    document.getElementById("genderError").textContent = "Select gender.";
    hasError = true;
  }

  if (!validPhone(phone)) {
    document.getElementById("phoneError").textContent = "Phone must be 10 digits and start with 0.";
    hasError = true;
  }

  if (address.length < 5) {
    document.getElementById("addressError").textContent = "Enter a valid address.";
    hasError = true;
  }

  if (!validPhone(emergencyContact)) {
    document.getElementById("emergencyContactError").textContent = "Emergency contact must be 10 digits.";
    hasError = true;
  }

  if (!bloodGroup) {
    document.getElementById("bloodGroupError").textContent = "Select blood group.";
    hasError = true;
  }

  let patients = getPatients();

  const duplicateNic = patients.find(
    (p) => p.nic.toLowerCase() === nic.toLowerCase() && p.patientId !== editingPatientId
  );

  if (duplicateNic) {
    document.getElementById("nicError").textContent = "A patient with this NIC already exists.";
    hasError = true;
  }

  if (hasError) {
    setStatusMessage(messageBox, "Please fix the patient form errors.", "error");
    return;
  }

  if (editingPatientId) {
    const patient = patients.find((p) => p.patientId === editingPatientId);
    if (!patient) return;

    patient.nic = nic;
    patient.fullName = fullName;
    patient.email = email;
    patient.dob = dob;
    patient.gender = gender;
    patient.phone = phone;
    patient.address = address;
    patient.emergencyContact = emergencyContact;
    patient.bloodGroup = bloodGroup;
    patient.medicalNotes = medicalNotes;
    patient.photo = currentPatientPhotoData || patient.photo || "";

    savePatients(patients);
    setStatusMessage(messageBox, `Patient ${editingPatientId} updated successfully.`, "success");
  } else {
    const patientId = generatePatientId();

    const newPatient = {
      patientId,
      nic,
      fullName,
      email,
      dob,
      gender,
      phone,
      address,
      emergencyContact,
      bloodGroup,
      medicalNotes,
      photo: currentPatientPhotoData || "",
      registeredDate: new Date().toLocaleDateString()
    };

    patients.push(newPatient);
    savePatients(patients);

    document.getElementById("generatedPatientId").textContent = patientId;
    setStatusMessage(messageBox, `Patient added successfully. ID: ${patientId}`, "success");
  }

  renderPatients();
  populatePatientDropdown();
  populatePatientSearchList();
  clearPatientForm(false);
}

function clearPatientForm(resetMessage = true) {
  if (patientForm) patientForm.reset();
  document.getElementById("editingPatientId").value = "";
  document.getElementById("generatedPatientId").textContent = "Auto generated on save";
  if (patientPhotoPreview) patientPhotoPreview.src = "";
  currentPatientPhotoData = "";
  clearFieldErrors([
    "nicError", "fullNameError", "emailError", "dobError", "genderError",
    "phoneError", "addressError", "emergencyContactError", "bloodGroupError", "medicalNotesError"
  ]);
  if (resetMessage) {
    setStatusMessage(messageBox, "Patient form cleared.", "default");
  }
}

function renderPatients() {
  const patients = getPatients();
  const keyword = patientSearchInput ? patientSearchInput.value.trim().toLowerCase() : "";

  const filtered = patients.filter((patient) => {
    return (
      (patient.patientId || "").toLowerCase().includes(keyword) ||
      (patient.nic || "").toLowerCase().includes(keyword) ||
      (patient.fullName || "").toLowerCase().includes(keyword)
    );
  });

  if (!patientTableBody) return;
  patientTableBody.innerHTML = "";

  if (filtered.length === 0) {
    patientTableBody.innerHTML = `<tr class="empty-row"><td colspan="9">No patients found.</td></tr>`;
    return;
  }

  filtered.forEach((patient) => {
    patientTableBody.innerHTML += `
      <tr>
        <td>${patient.patientId}</td>
        <td>${patient.photo ? `<img src="${patient.photo}" class="thumb" alt="Patient">` : "No Photo"}</td>
        <td>${patient.nic}</td>
        <td>${patient.fullName}</td>
        <td>${patient.dob}</td>
        <td>${patient.gender}</td>
        <td>${patient.phone}</td>
        <td>${patient.emergencyContact}</td>
        <td>
          <div class="row-actions">
            <button class="action-btn edit" onclick="editPatient('${patient.patientId}')">Edit</button>
            <button class="action-btn print" onclick="printPatientCardById('${patient.patientId}')">Print ID</button>
            <button class="action-btn delete" onclick="deletePatient('${patient.patientId}')">Delete</button>
          </div>
        </td>
      </tr>
    `;
  });
}

window.editPatient = function (patientId) {
  const patients = getPatients();
  const patient = patients.find((p) => p.patientId === patientId);
  if (!patient) return;

  showSection("section-add-patient");

  document.getElementById("editingPatientId").value = patient.patientId;
  document.getElementById("generatedPatientId").textContent = patient.patientId;
  document.getElementById("nic").value = patient.nic;
  document.getElementById("fullName").value = patient.fullName;
  document.getElementById("emailAddress").value = patient.email;
  document.getElementById("dob").value = patient.dob;
  document.getElementById("gender").value = patient.gender;
  document.getElementById("phone").value = patient.phone;
  document.getElementById("address").value = patient.address;
  document.getElementById("emergencyContact").value = patient.emergencyContact || "";
  document.getElementById("bloodGroup").value = patient.bloodGroup || "";
  document.getElementById("medicalNotes").value = patient.medicalNotes || "";
  currentPatientPhotoData = patient.photo || "";
  if (patientPhotoPreview) patientPhotoPreview.src = patient.photo || "";

  setStatusMessage(messageBox, `Editing patient ${patient.patientId}`, "warning");
};

window.deletePatient = function (patientId) {
  const patient = getPatients().find((p) => p.patientId === patientId);
  if (!patient) return;

  const ok = confirm(`Are you sure you want to delete patient "${patient.fullName}"? This will also remove their appointments.`);
  if (!ok) return;

  let patients = getPatients();
  patients = patients.filter((p) => p.patientId !== patientId);
  savePatients(patients);

  let appointments = getAppointments();
  appointments = appointments.filter((a) => a.patientId !== patientId);
  saveAppointments(appointments);

  // FIX: Also remove from POS queue
  let posQueue = getPOSQueue();
  posQueue = posQueue.filter((q) => q.patientId !== patientId);
  savePOSQueue(posQueue);

  renderPatients();
  renderAppointments();
  populatePatientDropdown();
  populatePatientSearchList();
  setStatusMessage(messageBox, "Patient and related appointments deleted.", "success");
};

function populatePatientDropdown(filteredPatients = null) {
  const patients = filteredPatients || getPatients();
  const patientSelect = document.getElementById("appointmentPatientId");
  if (!patientSelect) return;
  patientSelect.innerHTML = `<option value="">Select patient</option>`;

  patients.forEach((patient) => {
    patientSelect.innerHTML += `
      <option value="${patient.patientId}">
        ${patient.patientId} - ${patient.fullName} (${patient.nic})
      </option>
    `;
  });
}

function populatePatientSearchList() {
  const patients = getPatients();
  const list = document.getElementById("patientSearchList");
  if (!list) return;
  list.innerHTML = "";

  patients.forEach((patient) => {
    list.innerHTML += `<option value="${patient.patientId} - ${patient.fullName} - ${patient.nic}"></option>`;
  });
}

function setupAppointmentEvents() {
  if (appointmentSaveBtn) appointmentSaveBtn.addEventListener("click", handleSaveAppointment);
  if (appointmentClearBtn) appointmentClearBtn.addEventListener("click", clearAppointmentForm);
  if (appointmentSearchInput) appointmentSearchInput.addEventListener("input", renderAppointments);

  document.getElementById("appointmentPatientSearch")?.addEventListener("input", handlePatientSearchForAppointment);
  document.getElementById("appointmentPatientId")?.addEventListener("change", handlePatientSelectionChange);
  document.getElementById("medicalNeed")?.addEventListener("change", filterDoctors);
  document.getElementById("casePriority")?.addEventListener("change", updateConsultationFee);
  document.getElementById("doctorSearch")?.addEventListener("input", filterDoctors);
  document.getElementById("doctorSelect")?.addEventListener("change", updateConsultationFee);
  document.getElementById("appointmentDate")?.addEventListener("change", buildTimeSlots);
  document.getElementById("paymentRoute")?.addEventListener("change", handlePaymentRouteChange);
}

function handlePatientSearchForAppointment() {
  const value = document.getElementById("appointmentPatientSearch").value.trim().toLowerCase();
  const patients = getPatients().filter((patient) => {
    return (
      (patient.patientId || "").toLowerCase().includes(value) ||
      (patient.nic || "").toLowerCase().includes(value) ||
      (patient.fullName || "").toLowerCase().includes(value)
    );
  });

  populatePatientDropdown(patients);

  if (patients.length === 1) {
    document.getElementById("appointmentPatientId").value = patients[0].patientId;
    handlePatientSelectionChange();
  }
}

function handlePatientSelectionChange() {
  const patientId = document.getElementById("appointmentPatientId").value;
  const patient = getPatients().find((p) => p.patientId === patientId);
  if (!patient) return;

  const age = calculateAge(patient.dob);
  const medicalNotes = (patient.medicalNotes || "").toLowerCase();

  if (age <= 12) {
    document.getElementById("medicalNeed").value = "Pediatrics";
  } else if (medicalNotes.includes("skin")) {
    document.getElementById("medicalNeed").value = "Dermatology";
  } else if (medicalNotes.includes("heart") || medicalNotes.includes("chest")) {
    document.getElementById("medicalNeed").value = "Cardiology";
  }

  filterDoctors();
}

function getSuggestedDoctors() {
  const need = document.getElementById("medicalNeed").value;
  const doctorSearch = document.getElementById("doctorSearch").value.trim().toLowerCase();
  const allDoctors = getDoctors();

  if (!need) {
    return allDoctors.filter((doctor) =>
      doctor.name.toLowerCase().includes(doctorSearch) ||
      doctor.specialization.toLowerCase().includes(doctorSearch)
    );
  }

  const allowedSpecs = NEED_TO_SPECIALIZATION[need] || [];

  return allDoctors.filter((doctor) => {
    const matchesNeed = allowedSpecs.includes(doctor.specialization);
    const matchesSearch =
      doctor.name.toLowerCase().includes(doctorSearch) ||
      doctor.specialization.toLowerCase().includes(doctorSearch);
    return matchesNeed && matchesSearch;
  });
}

function filterDoctors() {
  const doctorSelect = document.getElementById("doctorSelect");
  const doctorSearchList = document.getElementById("doctorSearchList");
  const doctors = getSuggestedDoctors();

  if (!doctorSelect) return;
  doctorSelect.innerHTML = `<option value="">Select doctor</option>`;
  if (doctorSearchList) doctorSearchList.innerHTML = "";

  doctors.forEach((doctor) => {
    doctorSelect.innerHTML += `
      <option value="${doctor.doctorId}">
        ${doctor.name} - ${doctor.specialization}
      </option>
    `;
    if (doctorSearchList) {
      doctorSearchList.innerHTML += `<option value="${doctor.name} - ${doctor.specialization}"></option>`;
    }
  });

  updateConsultationFee();
  buildTimeSlots();
}

function getDoctorById(doctorId) {
  return getDoctors().find((d) => d.doctorId === doctorId);
}

function updateConsultationFee() {
  const casePriority = document.getElementById("casePriority").value;
  const doctorId = document.getElementById("doctorSelect").value;
  const doctor = getDoctorById(doctorId);
  const feeInput = document.getElementById("consultationFee");
  if (!feeInput) return;

  let fee = 0;

  if (casePriority === "EMERGENCY") {
    fee = 4000;
  } else if (casePriority === "SPECIALIST") {
    fee = 3000;
  } else if (casePriority === "OPD") {
    fee = 1500;
  }

  if (doctor && doctor.specialization !== "General Medicine" && casePriority !== "EMERGENCY") {
    fee = Math.max(fee, 3000);
  }

  feeInput.value = fee ? fee.toFixed(2) : "";
}

function handlePaymentRouteChange() {
  const paymentRoute = document.getElementById("paymentRoute").value;
  const paymentMethod = document.getElementById("paymentMethod");
  if (!paymentMethod) return;

  if (paymentRoute === "SEND_TO_POS") {
    paymentMethod.value = "";
    paymentMethod.disabled = true;
  } else {
    paymentMethod.disabled = false;
  }
}

function getFreeSlotsForDoctor(doctorId, selectedDate, editingAppointmentId = "") {
  const appointments = getAppointments();
  const today = new Date();
  const selectedIsToday = selectedDate === formatDate(today);

  const usedSlots = appointments
    .filter((appointment) =>
      appointment.doctorId === doctorId &&
      appointment.appointmentDate === selectedDate &&
      appointment.appointmentId !== editingAppointmentId &&
      appointment.appointmentStatus !== "CANCELLED"
    )
    .map((appointment) => appointment.appointmentTime);

  return BASE_SLOTS.filter((slot) => {
    if (usedSlots.includes(slot)) return false;

    if (selectedIsToday) {
      const [hour, minute] = slot.split(":").map(Number);
      const slotDate = new Date();
      slotDate.setHours(hour, minute, 0, 0);
      if (slotDate <= today) return false;
    }

    return true;
  });
}

function buildTimeSlots() {
  const doctorId = document.getElementById("doctorSelect")?.value;
  const selectedDate = document.getElementById("appointmentDate")?.value;
  const editingAppointmentId = document.getElementById("editingAppointmentId")?.value;
  const appointmentTime = document.getElementById("appointmentTime");
  if (!appointmentTime) return;

  appointmentTime.innerHTML = `<option value="">Select time slot</option>`;

  if (!doctorId || !selectedDate) return;

  const freeSlots = getFreeSlotsForDoctor(doctorId, selectedDate, editingAppointmentId);

  if (freeSlots.length === 0) {
    appointmentTime.innerHTML += `<option value="" disabled>No slots available for this doctor on this date</option>`;
    return;
  }

  freeSlots.forEach((slot) => {
    appointmentTime.innerHTML += `<option value="${slot}">${slot}</option>`;
  });
}

function formatDate(dateObj) {
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function createQueuePayloadFromAppointment(appointment, patient, doctor) {
  return {
    queueId: `POS-${appointment.appointmentId}`,
    source: "RECEPTION",
    appointmentId: appointment.appointmentId,
    patientId: appointment.patientId,
    patientName: patient.fullName,
    patientNic: patient.nic,
    patientPhone: patient.phone,
    patientEmail: patient.email,
    doctorId: doctor.doctorId,
    doctorName: doctor.name,
    casePriority: appointment.casePriority,
    medicalNeed: appointment.medicalNeed,
    appointmentReason: appointment.appointmentReason,
    appointmentDate: appointment.appointmentDate,
    appointmentTime: appointment.appointmentTime,
    description: `${appointment.casePriority} appointment - ${appointment.medicalNeed}`,
    consultationFee: Number(appointment.fee || 0),
    amount: Number(appointment.fee || 0),
    consultationItem: {
      itemId: `CONS-${appointment.appointmentId}`,
      name: `${appointment.casePriority} Consultation Fee`,
      type: "CONSULTATION",
      price: Number(appointment.fee || 0),
      qty: 1,
      note: `${doctor.name} - ${appointment.medicalNeed}`
    },
    status: "PENDING",
    createdAt: new Date().toISOString(),
    processed: false
  };
}

function upsertAppointmentInPOSQueue(appointment, patient, doctor) {
  let posQueue = getPOSQueue();
  const payload = createQueuePayloadFromAppointment(appointment, patient, doctor);
  const existingIndex = posQueue.findIndex((item) => item.appointmentId === appointment.appointmentId);

  if (existingIndex >= 0) {
    posQueue[existingIndex] = { ...posQueue[existingIndex], ...payload, processed: false };
  } else {
    posQueue.push(payload);
  }

  savePOSQueue(posQueue);
}

function removeAppointmentFromPOSQueue(appointmentId) {
  let posQueue = getPOSQueue();
  posQueue = posQueue.filter((item) => item.appointmentId !== appointmentId);
  savePOSQueue(posQueue);
}

function handleSaveAppointment() {
  clearFieldErrors([
    "appointmentPatientSearchError", "appointmentPatientError", "casePriorityError",
    "medicalNeedError", "appointmentReasonError", "doctorSearchError", "doctorSelectError",
    "appointmentDateError", "appointmentTimeError", "paymentRouteError", "paymentMethodError"
  ]);

  const editingAppointmentId = document.getElementById("editingAppointmentId").value;
  const patientId = document.getElementById("appointmentPatientId").value;
  const casePriority = document.getElementById("casePriority").value;
  const medicalNeed = document.getElementById("medicalNeed").value;
  const appointmentReason = document.getElementById("appointmentReason").value.trim();
  const doctorId = document.getElementById("doctorSelect").value;
  const appointmentDate = document.getElementById("appointmentDate").value;
  const appointmentTime = document.getElementById("appointmentTime").value;
  const paymentRoute = document.getElementById("paymentRoute").value;
  const paymentMethod = document.getElementById("paymentMethod").value;
  const appointmentStatus = document.getElementById("appointmentStatus").value;
  const fee = parseFloat(document.getElementById("consultationFee").value) || 0;

  let hasError = false;

  if (!patientId) {
    document.getElementById("appointmentPatientError").textContent = "Select patient.";
    hasError = true;
  }

  if (!casePriority) {
    document.getElementById("casePriorityError").textContent = "Select case priority.";
    hasError = true;
  }

  if (!medicalNeed) {
    document.getElementById("medicalNeedError").textContent = "Select medical need.";
    hasError = true;
  }

  if (appointmentReason.length < 3) {
    document.getElementById("appointmentReasonError").textContent = "Enter valid reason or symptoms.";
    hasError = true;
  }

  if (!doctorId) {
    document.getElementById("doctorSelectError").textContent = "Select available doctor.";
    hasError = true;
  }

  if (!appointmentDate) {
    document.getElementById("appointmentDateError").textContent = "Select appointment date.";
    hasError = true;
  }

  const today = formatDate(new Date());
  if (appointmentDate && appointmentDate < today) {
    document.getElementById("appointmentDateError").textContent = "Past dates are not allowed.";
    hasError = true;
  }

  if (!appointmentTime) {
    document.getElementById("appointmentTimeError").textContent = "Select free time slot.";
    hasError = true;
  }

  if (!paymentRoute) {
    document.getElementById("paymentRouteError").textContent = "Select payment route.";
    hasError = true;
  }

  if (paymentRoute === "PAY_HERE" && !paymentMethod) {
    document.getElementById("paymentMethodError").textContent = "Select payment method.";
    hasError = true;
  }

  if (fee <= 0) {
    document.getElementById("doctorSelectError").textContent = "Doctor and appointment type must generate a fee.";
    hasError = true;
  }

  // FIX #16: Re-validate slot availability at save time to prevent duplicates
  if (doctorId && appointmentDate && appointmentTime && !hasError) {
    const freeSlots = getFreeSlotsForDoctor(doctorId, appointmentDate, editingAppointmentId);
    if (!freeSlots.includes(appointmentTime)) {
      document.getElementById("appointmentTimeError").textContent = "This slot is no longer available. Please choose another.";
      hasError = true;
    }
  }

  if (hasError) {
    setStatusMessage(appointmentMessageBox, "Please fix the appointment form errors.", "error");
    return;
  }

  const patient = getPatients().find((p) => p.patientId === patientId);
  const doctor = getDoctorById(doctorId);
  let appointments = getAppointments();

  if (editingAppointmentId) {
    const appointment = appointments.find((a) => a.appointmentId === editingAppointmentId);
    if (!appointment) return;

    appointment.patientId = patientId;
    appointment.appointmentPatient = patient.fullName;
    appointment.casePriority = casePriority;
    appointment.medicalNeed = medicalNeed;
    appointment.appointmentReason = appointmentReason;
    appointment.doctorId = doctorId;
    appointment.doctorName = doctor.name;
    appointment.appointmentDate = appointmentDate;
    appointment.appointmentTime = appointmentTime;
    appointment.paymentRoute = paymentRoute;
    appointment.paymentMethod = paymentMethod || "";
    appointment.appointmentStatus = appointmentStatus;
    appointment.fee = fee;

    saveAppointments(appointments);

    if (paymentRoute === "SEND_TO_POS") {
      upsertAppointmentInPOSQueue(appointment, patient, doctor);
    } else {
      removeAppointmentFromPOSQueue(appointment.appointmentId);
    }

    setStatusMessage(appointmentMessageBox, `Appointment ${editingAppointmentId} updated successfully.`, "success");
  } else {
    const appointmentId = generateAppointmentId();

    const newAppointment = {
      appointmentId,
      patientId,
      appointmentPatient: patient.fullName,
      casePriority,
      medicalNeed,
      appointmentReason,
      doctorId,
      doctorName: doctor.name,
      appointmentDate,
      appointmentTime,
      paymentRoute,
      paymentMethod: paymentMethod || "",
      appointmentStatus,
      fee
    };

    appointments.push(newAppointment);
    saveAppointments(appointments);

    if (paymentRoute === "SEND_TO_POS") {
      upsertAppointmentInPOSQueue(newAppointment, patient, doctor);
    } else {
      const receipts = getReceipts();
      receipts.push({
        receiptId: `RCP-${appointmentId}`,
        appointmentId,
        patientId,
        patientName: patient.fullName,
        doctorName: doctor.name,
        amount: fee,
        method: paymentMethod,
        date: new Date().toLocaleString()
      });
      saveReceipts(receipts);
    }

    setStatusMessage(appointmentMessageBox, `Appointment saved. ID: ${appointmentId}`, "success");
  }

  clearAppointmentForm(false);
  renderAppointments();
}

function clearAppointmentForm(resetMessage = true) {
  if (appointmentForm) appointmentForm.reset();
  document.getElementById("editingAppointmentId").value = "";
  document.getElementById("appointmentStatus").value = "BOOKED";
  document.getElementById("consultationFee").value = "";
  const pm = document.getElementById("paymentMethod");
  if (pm) pm.disabled = false;
  clearFieldErrors([
    "appointmentPatientSearchError", "appointmentPatientError", "casePriorityError",
    "medicalNeedError", "appointmentReasonError", "doctorSearchError", "doctorSelectError",
    "appointmentDateError", "appointmentTimeError", "paymentRouteError", "paymentMethodError"
  ]);
  populatePatientDropdown();
  filterDoctors();
  if (resetMessage) {
    setStatusMessage(appointmentMessageBox, "Appointment form cleared.", "default");
  }
}

function renderAppointments() {
  const appointments = getAppointments();
  const keyword = appointmentSearchInput ? appointmentSearchInput.value.trim().toLowerCase() : "";
  const today = formatDate(new Date());

  const filtered = appointments.filter((appointment) => {
    return (
      (appointment.appointmentPatient || "").toLowerCase().includes(keyword) ||
      (appointment.doctorName || "").toLowerCase().includes(keyword) ||
      (appointment.appointmentId || "").toLowerCase().includes(keyword)
    );
  });

  if (!appointmentTableBody) return;
  appointmentTableBody.innerHTML = "";

  if (filtered.length === 0) {
    appointmentTableBody.innerHTML = `<tr class="empty-row"><td colspan="11">No appointments found.</td></tr>`;
    return;
  }

  filtered.forEach((appointment) => {
    // FIX #17: Visually flag past UPCOMING/BOOKED appointments
    const isPast = appointment.appointmentDate < today && appointment.appointmentStatus === "BOOKED";

    const statusClass =
      appointment.appointmentStatus === "BOOKED"
        ? isPast ? "badge-pending" : "badge-paid"
        : appointment.appointmentStatus === "CANCELLED"
        ? "badge-cancelled"
        : "badge-paid";

    const statusLabel = isPast && appointment.appointmentStatus === "BOOKED"
      ? "OVERDUE"
      : appointment.appointmentStatus;

    appointmentTableBody.innerHTML += `
      <tr${isPast ? ' style="opacity:0.7;"' : ""}>
        <td>${appointment.appointmentId}</td>
        <td>${appointment.appointmentPatient}</td>
        <td>${appointment.doctorName}</td>
        <td>${appointment.casePriority}</td>
        <td>${appointment.medicalNeed}</td>
        <td>${appointment.appointmentDate}</td>
        <td>${appointment.appointmentTime}</td>
        <td>Rs. ${Number(appointment.fee).toFixed(2)}</td>
        <td>${appointment.paymentRoute === "PAY_HERE" ? '<span class="badge badge-paid">Pay Here</span>' : '<span class="badge badge-pending">Send to POS</span>'}</td>
        <td><span class="badge ${statusClass}">${statusLabel}</span></td>
        <td>
          <div class="row-actions">
            ${appointment.appointmentStatus !== "CANCELLED" ? `<button class="action-btn edit" onclick="editAppointment('${appointment.appointmentId}')">Edit</button>` : ""}
            ${appointment.appointmentStatus !== "CANCELLED" ? `<button class="action-btn delete" onclick="cancelAppointment('${appointment.appointmentId}')">Cancel</button>` : ""}
          </div>
        </td>
      </tr>
    `;
  });
}

window.editAppointment = function (appointmentId) {
  const appointment = getAppointments().find((a) => a.appointmentId === appointmentId);
  if (!appointment) return;

  if (appointment.appointmentStatus === "CANCELLED") {
    setStatusMessage(appointmentMessageBox, "Cannot edit a cancelled appointment.", "error");
    return;
  }

  showSection("section-add-appointment");

  document.getElementById("editingAppointmentId").value = appointment.appointmentId;
  document.getElementById("appointmentPatientId").value = appointment.patientId;
  document.getElementById("casePriority").value = appointment.casePriority;
  document.getElementById("medicalNeed").value = appointment.medicalNeed;
  document.getElementById("appointmentReason").value = appointment.appointmentReason;
  filterDoctors();
  document.getElementById("doctorSelect").value = appointment.doctorId;
  document.getElementById("appointmentDate").value = appointment.appointmentDate;
  buildTimeSlots();
  document.getElementById("appointmentTime").value = appointment.appointmentTime;
  document.getElementById("paymentRoute").value = appointment.paymentRoute;
  handlePaymentRouteChange();
  document.getElementById("paymentMethod").value = appointment.paymentMethod || "";
  document.getElementById("appointmentStatus").value = appointment.appointmentStatus;
  updateConsultationFee();
  document.getElementById("consultationFee").value = Number(appointment.fee || 0).toFixed(2);

  setStatusMessage(appointmentMessageBox, `Editing appointment ${appointment.appointmentId}`, "warning");
};

window.cancelAppointment = function (appointmentId) {
  const appointment = getAppointments().find((a) => a.appointmentId === appointmentId);
  if (!appointment) return;

  if (appointment.appointmentStatus === "CANCELLED") {
    setStatusMessage(appointmentMessageBox, "Appointment is already cancelled.", "warning");
    return;
  }

  const ok = confirm(`Cancel appointment ${appointmentId} for ${appointment.appointmentPatient}?`);
  if (!ok) return;

  let appointments = getAppointments();
  const appt = appointments.find((a) => a.appointmentId === appointmentId);
  if (!appt) return;

  appt.appointmentStatus = "CANCELLED";
  saveAppointments(appointments);
  removeAppointmentFromPOSQueue(appointmentId);
  renderAppointments();
  setStatusMessage(appointmentMessageBox, `Appointment ${appointmentId} cancelled.`, "success");
};

function fillPatientCard(patient) {
  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setText("cardPatientId", patient.patientId || "-");
  setText("cardName", patient.fullName || "-");
  setText("cardNic", patient.nic || "-");
  setText("cardDob", patient.dob || "-");
  setText("cardGender", patient.gender || "-");
  setText("cardBlood", patient.bloodGroup || "-");
  setText("cardPhone", patient.phone || "-");
  setText("cardAddress", patient.address || "-");
  setText("cardEmergency", patient.emergencyContact || "-");
  setText("cardIssuedDate", new Date().toISOString().split("T")[0]);
  setText("cardMedicalNotes", patient.medicalNotes || "No special notes");
  setText("cardAccessCode", `WC-${patient.patientId || "PAT-000"}`);
  setText("fakeQrCode", patient.patientId || "PAT-000");

  const photo = document.getElementById("cardPhoto");
  if (photo) photo.src = patient.photo || "";
}

// FIX #5: setTimeout for patient card print too
function printPatientCardById(patientId) {
  const patient = getPatients().find((p) => p.patientId === patientId);
  if (!patient) return;

  fillPatientCard(patient);
  const wrap = document.getElementById("printCardWrap");
  if (wrap) wrap.style.display = "block";
  setTimeout(() => {
    window.print();
    setTimeout(() => { if (wrap) wrap.style.display = "none"; }, 500);
  }, 100);
}

function printCurrentPatientCard() {
  const editingPatientId = document.getElementById("editingPatientId").value;
  if (!editingPatientId) {
    setStatusMessage(messageBox, "Save or edit a patient first before printing the ID card.", "warning");
    return;
  }
  printPatientCardById(editingPatientId);
}
