/* ================================================================
   WE CARE — Doctor Dashboard JS
   Interconnected with: receptionist (appointments, patients)
                        pharmacist (prescription queue, lab queue)
   ================================================================ */

/* ─── GLOBALS ───────────────────────────────────── */
let navButtons, sections, logoutBtn;
let currentApptFilter = "all";
let rxCart = [];
let currentDoctorId = null; // set from URL param or localStorage

/* ─── STORAGE HELPERS ───────────────────────────── */
const ls = {
  get: (k, fb = []) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v))
};

function getAppointments()  { return ls.get("wecare_appointments"); }
function getPatients()       { return ls.get("wecare_patients"); }
function getDoctors()        { return ls.get("wecare_doctors"); }
function getConsultations()  { return ls.get("wecare_consultations"); }
function saveConsultations(d){ ls.set("wecare_consultations", d); }
function getInventory()      { return ls.get("wecare_inventory"); }
function getLabTests()       { return ls.get("wecare_lab_tests", [
  { testId:"LBT-001", testName:"Blood Test",       price:1500, status:"ACTIVE" },
  { testId:"LBT-002", testName:"Urine Test",       price:1000, status:"ACTIVE" },
  { testId:"LBT-003", testName:"Cholesterol Test", price:1800, status:"ACTIVE" },
  { testId:"LBT-004", testName:"Glucose Test",     price:1200, status:"ACTIVE" }
]); }
function getLabRequests()    { return ls.get("wecare_lab_requests"); }
function saveLabRequests(d)  { ls.set("wecare_lab_requests", d); }
function getPOSQueue()       { return ls.get("wecare_pos_queue"); }
function savePOSQueue(d)     { ls.set("wecare_pos_queue", d); }
function getDrRxQueue()      { return ls.get("wecare_doctor_rx_queue"); }
function saveDrRxQueue(d)    { ls.set("wecare_doctor_rx_queue", d); }
function getLeaves()         { return ls.get("wecare_doctor_leaves"); }
function saveLeaves(d)       { ls.set("wecare_doctor_leaves", d); }

/* ─── ID GENERATORS ─────────────────────────────── */
function genId(prefix, list, field) {
  if (!list.length) return `${prefix}-001`;
  const max = Math.max(...list.map(i => parseInt((i[field]||"0").replace(/\D/g,""),10)||0));
  return `${prefix}-${String(max+1).padStart(3,"0")}`;
}

/* ─── UTILS ─────────────────────────────────────── */
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function money(v) { return `Rs. ${Number(v||0).toFixed(2)}`; }

function setMsg(id, text, type="default") {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.style.color = type==="success"?"#10b981":type==="error"?"#f04040":type==="warning"?"#f59e0b":"#94a3b8";
}

function clearErrors(ids) { ids.forEach(id => { const e=document.getElementById(id); if(e) e.textContent=""; }); }

function getPatientById(id)  { return getPatients().find(p=>p.patientId===id); }
function getApptById(id)     { return getAppointments().find(a=>a.appointmentId===id); }

/* Detect which doctor is logged in — reads from login session */
function detectCurrentDoctor() {
  const doctors = getDoctors();
  if (!doctors.length) return null;

  // Primary: use wecare_current_doctor_id set by login
  const storedId = localStorage.getItem("wecare_current_doctor_id");
  if (storedId) {
    const byId = doctors.find(d => d.doctorId === storedId);
    if (byId) return byId;
  }

  // Fallback: check session for name match
  try {
    const session = JSON.parse(localStorage.getItem("wecare_session") || "{}");
    if (session.role === "DOCTOR") {
      const byName = doctors.find(d => d.name.toLowerCase() === (session.name||"").toLowerCase());
      if (byName) return byName;
      // Last fallback: staffId matches doctorId
      const byStaff = doctors.find(d => d.doctorId === session.staffId);
      if (byStaff) return byStaff;
    }
  } catch(e) {}

  // Demo fallback: first doctor
  return doctors[0];
}

/* ─── APPOINTMENTS FOR THIS DOCTOR ──────────────── */
function getMyAppointments() {
  if (!currentDoctorId) return getAppointments(); // fallback: show all
  return getAppointments().filter(a => a.doctorId === currentDoctorId);
}

/* ─── SECTION NAV ───────────────────────────────── */
function showSection(targetId) {
  navButtons.forEach(b=>b.classList.remove("active"));
  sections.forEach(s=>s.classList.remove("active-section"));
  const sec = document.getElementById(targetId);
  if (!sec) return;
  sec.classList.add("active-section");
  document.querySelector(`.nav-btn[data-target="${targetId}"]`)?.classList.add("active");

  if (targetId==="section-appointments") renderAppointments();
  if (targetId==="section-consultation") { populateConsultApptSelect(); }
  if (targetId==="section-prescriptions") { populateRxApptSelect(); populateRxMedSelect(); renderSentRx(); }
  if (targetId==="section-lab-orders") { populateLabApptSelect(); populateLabTestSelect(); renderLabOrders(); }
  if (targetId==="section-history") renderHistory();
  if (targetId==="section-leave") { renderLeaveTable(); }
  if (targetId==="section-profile") renderProfile();
}

/* ─── RENDER APPOINTMENTS ───────────────────────── */
function renderAppointments() {
  const tbody = document.getElementById("doctorAppointmentTableBody");
  if (!tbody) return;
  const keyword = (document.getElementById("appointmentSearchInput")?.value||"").trim().toLowerCase();
  const tod = today();
  let appts = getMyAppointments();

  // filter tab
  if (currentApptFilter==="today")     appts = appts.filter(a=>a.appointmentDate===tod);
  if (currentApptFilter==="upcoming")  appts = appts.filter(a=>a.appointmentDate>tod && a.appointmentStatus!=="CANCELLED");
  if (currentApptFilter==="completed") appts = appts.filter(a=>a.appointmentStatus==="COMPLETED");

  if (keyword) appts = appts.filter(a =>
    (a.appointmentPatient||"").toLowerCase().includes(keyword) ||
    (a.appointmentId||"").toLowerCase().includes(keyword)
  );

  // stats (always from all my appointments)
  const all = getMyAppointments();
  document.getElementById("statToday").textContent    = all.filter(a=>a.appointmentDate===tod).length;
  document.getElementById("statUpcoming").textContent = all.filter(a=>a.appointmentDate>tod&&a.appointmentStatus!=="CANCELLED").length;
  document.getElementById("statCompleted").textContent= all.filter(a=>a.appointmentStatus==="COMPLETED").length;
  document.getElementById("statCancelled").textContent= all.filter(a=>a.appointmentStatus==="CANCELLED").length;

  tbody.innerHTML = "";
  if (!appts.length) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:#94a3b8;padding:24px;">No appointments found.</td></tr>`;
    return;
  }

  appts.forEach(a => {
    const isToday = a.appointmentDate === tod;
    const bCls = a.appointmentStatus==="COMPLETED"?"badge-completed":
                 a.appointmentStatus==="CANCELLED"?"badge-cancelled":
                 isToday?"badge-progress":"badge-booked";
    tbody.innerHTML += `
      <tr${isToday&&a.appointmentStatus==="BOOKED"?' style="background:#f0f9ff;"':""}>
        <td>${a.appointmentId}</td>
        <td><strong>${a.appointmentPatient}</strong></td>
        <td style="max-width:180px;">${a.appointmentReason||"—"}</td>
        <td><span class="badge badge-${a.casePriority==="EMERGENCY"?"cancelled":a.casePriority==="SPECIALIST"?"progress":"booked"}">${a.casePriority||"OPD"}</span></td>
        <td>${a.appointmentDate}</td>
        <td>${a.appointmentTime||"—"}</td>
        <td>${money(a.fee)}</td>
        <td><span class="badge ${bCls}">${a.appointmentStatus}</span></td>
        <td>
          <div class="row-actions">
            <button class="action-btn edit" onclick="openApptDetail('${a.appointmentId}')">View</button>
            ${a.appointmentStatus==="BOOKED"?`<button class="action-btn print" onclick="goConsult('${a.appointmentId}')">Consult</button>`:""}
          </div>
        </td>
      </tr>`;
  });
}

window.openApptDetail = function(apptId) {
  const a = getApptById(apptId);
  if (!a) return;
  const patient = getPatientById(a.patientId);
  const body = document.getElementById("apptDetailBody");
  body.innerHTML = `
    <div class="detail-grid">
      <div class="dg-item"><span class="dg-label">Appointment ID</span><span class="dg-val">${a.appointmentId}</span></div>
      <div class="dg-item"><span class="dg-label">Status</span><span class="dg-val"><span class="badge badge-booked">${a.appointmentStatus}</span></span></div>
      <div class="dg-item"><span class="dg-label">Patient Name</span><span class="dg-val">${a.appointmentPatient}</span></div>
      <div class="dg-item"><span class="dg-label">Patient ID</span><span class="dg-val">${a.patientId||"—"}</span></div>
      ${patient?`
      <div class="dg-item"><span class="dg-label">NIC</span><span class="dg-val">${patient.nic}</span></div>
      <div class="dg-item"><span class="dg-label">DOB</span><span class="dg-val">${patient.dob}</span></div>
      <div class="dg-item"><span class="dg-label">Gender</span><span class="dg-val">${patient.gender}</span></div>
      <div class="dg-item"><span class="dg-label">Blood Group</span><span class="dg-val">${patient.bloodGroup||"—"}</span></div>
      <div class="dg-item"><span class="dg-label">Phone</span><span class="dg-val">${patient.phone}</span></div>
      <div class="dg-item"><span class="dg-label">Emergency Contact</span><span class="dg-val">${patient.emergencyContact||"—"}</span></div>
      <div class="dg-item" style="grid-column:1/-1;"><span class="dg-label">Medical Notes</span><span class="dg-val">${patient.medicalNotes||"None"}</span></div>
      `:""}
      <div class="dg-item"><span class="dg-label">Medical Need</span><span class="dg-val">${a.medicalNeed||"—"}</span></div>
      <div class="dg-item"><span class="dg-label">Priority</span><span class="dg-val">${a.casePriority||"—"}</span></div>
      <div class="dg-item" style="grid-column:1/-1;"><span class="dg-label">Reason / Symptoms</span><span class="dg-val">${a.appointmentReason||"—"}</span></div>
      <div class="dg-item"><span class="dg-label">Date</span><span class="dg-val">${a.appointmentDate}</span></div>
      <div class="dg-item"><span class="dg-label">Time</span><span class="dg-val">${a.appointmentTime||"—"}</span></div>
      <div class="dg-item"><span class="dg-label">Consultation Fee</span><span class="dg-val">${money(a.fee)}</span></div>
      <div class="dg-item"><span class="dg-label">Payment Route</span><span class="dg-val">${a.paymentRoute||"—"}</span></div>
    </div>`;

  document.getElementById("startConsultFromModal").dataset.apptId = apptId;
  document.getElementById("apptDetailModal").classList.add("show");
};

window.goConsult = function(apptId) {
  showSection("section-consultation");
  populateConsultApptSelect();
  document.getElementById("consultApptSelect").value = apptId;
  handleConsultApptChange();
};

/* ─── CONSULTATION ──────────────────────────────── */
function populateConsultApptSelect() {
  const sel = document.getElementById("consultApptSelect");
  if (!sel) return;
  const appts = getMyAppointments().filter(a=>a.appointmentStatus==="BOOKED");
  sel.innerHTML = `<option value="">— choose appointment —</option>`;
  appts.forEach(a => {
    sel.innerHTML += `<option value="${a.appointmentId}">${a.appointmentId} – ${a.appointmentPatient} (${a.appointmentDate})</option>`;
  });
}

function handleConsultApptChange() {
  const apptId = document.getElementById("consultApptSelect").value;
  const chip = document.getElementById("consultPatientChip");
  if (!apptId) { chip.textContent = "Select an appointment above"; return; }
  const a = getApptById(apptId);
  if (!a) return;
  const p = getPatientById(a.patientId);
  chip.textContent = p
    ? `${p.fullName} | ${p.gender} | DOB: ${p.dob} | Blood: ${p.bloodGroup||"?"} | ${p.phone}`
    : a.appointmentPatient;
  document.getElementById("consultApptId").value = apptId;
}

function saveConsultation() {
  clearErrors(["consultApptError","consultDiagnosisError","consultNotesError"]);
  const editId = document.getElementById("editingConsultId").value;
  const apptId = document.getElementById("consultApptSelect").value;
  const diagnosis = document.getElementById("consultDiagnosis").value.trim();
  const notes = document.getElementById("consultNotes").value.trim();
  const followUp = document.getElementById("consultFollowUp").value;
  const bp = document.getElementById("consultBP").value.trim();
  const temp = document.getElementById("consultTemp").value.trim();
  const weight = document.getElementById("consultWeight").value.trim();
  const pulse = document.getElementById("consultPulse").value.trim();

  let err = false;
  if (!apptId) { document.getElementById("consultApptError").textContent="Select an appointment."; err=true; }
  if (diagnosis.length<3) { document.getElementById("consultDiagnosisError").textContent="Enter a diagnosis."; err=true; }
  if (notes.length<5) { document.getElementById("consultNotesError").textContent="Enter clinical notes (min 5 chars)."; err=true; }
  if (err) { setMsg("consultationMessageBox","Please fix the errors.","error"); return; }

  const a = getApptById(apptId);
  const p = a ? getPatientById(a.patientId) : null;
  const consultations = getConsultations();

  if (editId) {
    const c = consultations.find(c=>c.consultId===editId);
    if (!c) return;
    Object.assign(c, { apptId, diagnosis, notes, followUp, bp, temp, weight, pulse, updatedAt: new Date().toISOString() });
    saveConsultations(consultations);
    setMsg("consultationMessageBox","Consultation updated.","success");
  } else {
    const consultId = genId("CON", consultations, "consultId");
    consultations.push({
      consultId,
      apptId,
      doctorId: currentDoctorId,
      patientId: a?.patientId||"",
      patientName: a?.appointmentPatient||"",
      diagnosis, notes, followUp, bp, temp, weight, pulse,
      date: new Date().toISOString()
    });
    saveConsultations(consultations);

    // Mark appointment as COMPLETED
    const appointments = getAppointments();
    const appt = appointments.find(x=>x.appointmentId===apptId);
    if (appt) { appt.appointmentStatus = "COMPLETED"; ls.set("wecare_appointments", appointments); }

    setMsg("consultationMessageBox",`Consultation ${consultId} saved. Appointment marked COMPLETED.`,"success");
  }

  document.getElementById("consultationForm").reset();
  document.getElementById("editingConsultId").value = "";
  populateConsultApptSelect();
}

/* ─── PRESCRIPTIONS → POS ──────────────────────── */
function populateRxApptSelect() {
  const sel = document.getElementById("rxApptSelect");
  if (!sel) return;
  const appts = getMyAppointments().filter(a=>a.appointmentStatus!=="CANCELLED");
  sel.innerHTML = `<option value="">— choose appointment —</option>`;
  appts.forEach(a => {
    sel.innerHTML += `<option value="${a.appointmentId}">${a.appointmentId} – ${a.appointmentPatient} (${a.appointmentDate})</option>`;
  });
}

function populateRxMedSelect() {
  const sel = document.getElementById("rxMedSelect");
  if (!sel) return;
  const items = getInventory().filter(i=>i.type==="MEDICINE"&&Number(i.stock)>0);
  sel.innerHTML = `<option value="">— select item —</option>`;
  items.forEach(i => {
    sel.innerHTML += `<option value="${i.itemId}" data-price="${i.price}" data-name="${i.name}">${i.name} — Rs.${i.price} (${i.stock} in stock)</option>`;
  });
}

function handleRxApptChange() {
  const apptId = document.getElementById("rxApptSelect").value;
  const chip = document.getElementById("rxPatientChip");
  if (!apptId) { chip.textContent="—"; return; }
  const a = getApptById(apptId);
  const p = a ? getPatientById(a.patientId) : null;
  chip.textContent = p ? `${p.fullName} | ${p.phone}` : (a?.appointmentPatient||"—");
}

function addRxItem() {
  const sel = document.getElementById("rxMedSelect");
  const qty = parseInt(document.getElementById("rxQty").value)||1;
  const dosage = document.getElementById("rxDosage").value.trim();
  if (!sel.value) { setMsg("rxMessageBox","Select a medicine first.","warning"); return; }

  const opt = sel.options[sel.selectedIndex];
  const price = parseFloat(opt.dataset.price)||0;
  const existing = rxCart.find(c=>c.itemId===sel.value);
  if (existing) { existing.qty += qty; existing.subtotal = existing.qty * existing.price; }
  else {
    rxCart.push({ itemId:sel.value, name:opt.dataset.name||opt.text.split("—")[0].trim(), qty, price, dosage, subtotal: qty*price });
  }
  renderRxCart();
  document.getElementById("rxQty").value=1;
  document.getElementById("rxDosage").value="";
}

function renderRxCart() {
  const tbody = document.getElementById("rxCartBody");
  if (!tbody) return;
  tbody.innerHTML = "";
  let total = 0;
  rxCart.forEach((item, i) => {
    total += item.subtotal;
    tbody.innerHTML += `
      <tr>
        <td>${i+1}</td>
        <td>${item.name}</td>
        <td>${item.qty}</td>
        <td>${money(item.price)}</td>
        <td>${item.dosage||"—"}</td>
        <td>${money(item.subtotal)}</td>
        <td><button class="action-btn delete" onclick="removeRxItem(${i})">✕</button></td>
      </tr>`;
  });
  const el = document.getElementById("rxTotalAmt");
  if (el) el.textContent = money(total);
}

window.removeRxItem = function(i) { rxCart.splice(i,1); renderRxCart(); };

function sendRxToPOS() {
  const apptId = document.getElementById("rxApptSelect").value;
  if (!apptId) { setMsg("rxMessageBox","Select an appointment.","warning"); return; }
  if (!rxCart.length) { setMsg("rxMessageBox","Add at least one medicine.","warning"); return; }

  const a = getApptById(apptId);
  const p = a ? getPatientById(a.patientId) : null;
  const rxQueue = getDrRxQueue();
  const rxId = genId("DRX", rxQueue, "rxId");
  const total = rxCart.reduce((s,c)=>s+c.subtotal,0);

  const rxEntry = {
    rxId, apptId, source:"DOCTOR",
    doctorId: currentDoctorId,
    patientId: a?.patientId||"",
    patientName: a?.appointmentPatient||"",
    patientPhone: p?.phone||"",
    items: [...rxCart],
    total,
    status: "PENDING",
    createdAt: new Date().toISOString()
  };

  rxQueue.push(rxEntry);
  saveDrRxQueue(rxQueue);

  // Also push into the main POS queue so pharmacist sees it
  const posQueue = getPOSQueue();
  posQueue.push({
    queueId: `POS-${rxId}`,
    source: "DOCTOR_RX",
    rxId,
    appointmentId: apptId,
    patientId: a?.patientId||"",
    patientName: a?.appointmentPatient||"",
    doctorId: currentDoctorId,
    items: rxCart.map(c=>({ itemId:c.itemId, name:c.name, type:"MEDICINE", price:c.price, qty:c.qty, note:c.dosage })),
    amount: total,
    status: "PENDING",
    createdAt: new Date().toISOString(),
    processed: false
  });
  savePOSQueue(posQueue);

  setMsg("rxMessageBox",`Prescription ${rxId} sent to POS successfully.`,"success");
  rxCart = [];
  renderRxCart();
  renderSentRx();
  document.getElementById("rxApptSelect").value="";
  document.getElementById("rxPatientChip").textContent="—";
}

function renderSentRx() {
  const tbody = document.getElementById("rxSentTableBody");
  if (!tbody) return;
  const queue = getDrRxQueue().filter(r=>!currentDoctorId||r.doctorId===currentDoctorId);
  tbody.innerHTML = "";
  if (!queue.length) {
    tbody.innerHTML=`<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:20px;">No prescriptions sent yet.</td></tr>`;
    return;
  }
  [...queue].reverse().forEach(r => {
    // Check POS queue status
    const posEntry = getPOSQueue().find(p=>p.rxId===r.rxId);
    const status = posEntry?.processed ? "Processed" : "Pending";
    tbody.innerHTML += `
      <tr>
        <td>${r.rxId}</td>
        <td>${r.patientName}</td>
        <td>${r.items.length} item(s)</td>
        <td>${money(r.total)}</td>
        <td style="font-size:11px;">${new Date(r.createdAt).toLocaleString()}</td>
        <td><span class="badge ${posEntry?.processed?"badge-completed":"badge-pending"}">${status}</span></td>
      </tr>`;
  });
}

/* ─── LAB ORDERS → POS ──────────────────────────── */
function populateLabApptSelect() {
  const sel = document.getElementById("labApptSelect");
  if (!sel) return;
  const appts = getMyAppointments().filter(a=>a.appointmentStatus!=="CANCELLED");
  sel.innerHTML = `<option value="">— choose appointment —</option>`;
  appts.forEach(a => {
    sel.innerHTML += `<option value="${a.appointmentId}">${a.appointmentId} – ${a.appointmentPatient} (${a.appointmentDate})</option>`;
  });
}

function populateLabTestSelect() {
  const sel = document.getElementById("labTestSelect");
  if (!sel) return;
  const tests = getLabTests().filter(t=>t.status==="ACTIVE");
  sel.innerHTML = `<option value="">— select test —</option>`;
  tests.forEach(t => {
    sel.innerHTML += `<option value="${t.testId}" data-name="${t.testName}" data-price="${t.price}">${t.testName} — Rs.${t.price}</option>`;
  });
}

function handleLabApptChange() {
  const apptId = document.getElementById("labApptSelect").value;
  const chip = document.getElementById("labPatientChip");
  if (!apptId) { chip.textContent="—"; return; }
  const a = getApptById(apptId);
  const p = a ? getPatientById(a.patientId) : null;
  chip.textContent = p ? `${p.fullName} | ${p.phone}` : (a?.appointmentPatient||"—");
}

function saveLabOrder() {
  clearErrors(["labApptError","labTestError"]);
  const apptId = document.getElementById("labApptSelect").value;
  const testSel = document.getElementById("labTestSelect");
  const urgency = document.getElementById("labUrgency").value;
  const notes = document.getElementById("labClinicalNotes").value.trim();
  let err=false;
  if (!apptId) { document.getElementById("labApptError").textContent="Select an appointment."; err=true; }
  if (!testSel.value) { document.getElementById("labTestError").textContent="Select a lab test."; err=true; }
  if (err) { setMsg("labOrderMessageBox","Please fix the errors.","error"); return; }

  const a = getApptById(apptId);
  const p = a ? getPatientById(a.patientId) : null;
  const opt = testSel.options[testSel.selectedIndex];
  const requests = getLabRequests();
  const requestId = genId("LRQ", requests, "requestId");

  requests.push({
    requestId,
    source: "DOCTOR",
    doctorId: currentDoctorId,
    appointmentId: apptId,
    patientId: a?.patientId||"",
    patientName: a?.appointmentPatient||"",
    patientPhone: p?.phone||"",
    testId: testSel.value,
    testName: opt.dataset.name||testSel.options[testSel.selectedIndex].text.split("—")[0].trim(),
    price: parseFloat(opt.dataset.price)||0,
    urgency,
    clinicalNotes: notes,
    status: "PENDING",
    requestedAt: new Date().toISOString()
  });
  saveLabRequests(requests);

  setMsg("labOrderMessageBox",`Lab order ${requestId} sent to pharmacist.`,"success");
  document.getElementById("leaveForm")?.reset();
  document.getElementById("labApptSelect").value="";
  document.getElementById("labTestSelect").value="";
  document.getElementById("labClinicalNotes").value="";
  document.getElementById("labPatientChip").textContent="—";
  renderLabOrders();
}

function renderLabOrders() {
  const tbody = document.getElementById("labOrderTableBody");
  if (!tbody) return;
  const orders = getLabRequests().filter(r=>r.source==="DOCTOR"&&(!currentDoctorId||r.doctorId===currentDoctorId));
  tbody.innerHTML = "";
  if (!orders.length) {
    tbody.innerHTML=`<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:20px;">No lab orders sent yet.</td></tr>`;
    return;
  }
  [...orders].reverse().forEach(r => {
    const urgCls = r.urgency==="STAT"?"badge-cancelled":r.urgency==="URGENT"?"badge-pending":"badge-booked";
    tbody.innerHTML += `
      <tr>
        <td>${r.requestId}</td>
        <td>${r.patientName}</td>
        <td>${r.testName}</td>
        <td><span class="badge ${urgCls}">${r.urgency}</span></td>
        <td style="font-size:11px;">${new Date(r.requestedAt).toLocaleString()}</td>
        <td><span class="badge ${r.status==="COMPLETED"?"badge-completed":"badge-pending"}">${r.status}</span></td>
      </tr>`;
  });
}

/* ─── PATIENT HISTORY ───────────────────────────── */
function renderHistory() {
  const tbody = document.getElementById("historyTableBody");
  if (!tbody) return;
  const keyword = (document.getElementById("historySearchInput")?.value||"").toLowerCase();
  let records = getConsultations().filter(c=>!currentDoctorId||c.doctorId===currentDoctorId);
  if (keyword) records = records.filter(c =>
    (c.patientName||"").toLowerCase().includes(keyword) ||
    (c.diagnosis||"").toLowerCase().includes(keyword)
  );
  tbody.innerHTML = "";
  if (!records.length) {
    tbody.innerHTML=`<tr><td colspan="8" style="text-align:center;color:#94a3b8;padding:20px;">No consultation history found.</td></tr>`;
    return;
  }
  [...records].reverse().forEach(c => {
    tbody.innerHTML += `
      <tr>
        <td>${c.consultId}</td>
        <td>${c.patientName}</td>
        <td>${c.diagnosis}</td>
        <td>${c.bp||"—"}</td>
        <td>${c.temp||"—"}</td>
        <td>${c.followUp||"—"}</td>
        <td style="font-size:11px;">${new Date(c.date).toLocaleDateString()}</td>
        <td>
          <div class="row-actions">
            <button class="action-btn edit" onclick="viewConsult('${c.consultId}')">View</button>
            <button class="action-btn delete" onclick="deleteConsult('${c.consultId}')">Delete</button>
          </div>
        </td>
      </tr>`;
  });
}

window.viewConsult = function(id) {
  const c = getConsultations().find(x=>x.consultId===id);
  if (!c) return;
  document.getElementById("consultViewBody").innerHTML = `
    <div class="detail-grid">
      <div class="dg-item"><span class="dg-label">Consult ID</span><span class="dg-val">${c.consultId}</span></div>
      <div class="dg-item"><span class="dg-label">Patient</span><span class="dg-val">${c.patientName}</span></div>
      <div class="dg-item"><span class="dg-label">Diagnosis</span><span class="dg-val">${c.diagnosis}</span></div>
      <div class="dg-item"><span class="dg-label">Follow-up</span><span class="dg-val">${c.followUp||"None"}</span></div>
      <div class="dg-item"><span class="dg-label">Blood Pressure</span><span class="dg-val">${c.bp||"—"}</span></div>
      <div class="dg-item"><span class="dg-label">Temperature</span><span class="dg-val">${c.temp||"—"}</span></div>
      <div class="dg-item"><span class="dg-label">Weight</span><span class="dg-val">${c.weight||"—"}</span></div>
      <div class="dg-item"><span class="dg-label">Pulse</span><span class="dg-val">${c.pulse||"—"}</span></div>
      <div class="dg-item" style="grid-column:1/-1;"><span class="dg-label">Clinical Notes</span><span class="dg-val" style="white-space:pre-wrap;">${c.notes}</span></div>
      <div class="dg-item"><span class="dg-label">Recorded On</span><span class="dg-val">${new Date(c.date).toLocaleString()}</span></div>
    </div>`;
  document.getElementById("consultViewModal").classList.add("show");
};

window.deleteConsult = function(id) {
  if (!confirm("Delete this consultation record?")) return;
  const records = getConsultations().filter(c=>c.consultId!==id);
  saveConsultations(records);
  renderHistory();
};

/* ─── LEAVE MANAGEMENT ──────────────────────────── */
function saveLeave() {
  clearErrors(["leaveFromError","leaveToError","leaveTypeError","leaveReasonError"]);
  const editId = document.getElementById("editingLeaveId").value;
  const from   = document.getElementById("leaveFrom").value;
  const to     = document.getElementById("leaveTo").value;
  const type   = document.getElementById("leaveType").value;
  const reason = document.getElementById("leaveReason").value.trim();
  const conflictBox = document.getElementById("leaveConflictBox");

  let err = false;
  const tod = today();
  if (!from) { document.getElementById("leaveFromError").textContent="Select from date."; err=true; }
  if (!to)   { document.getElementById("leaveToError").textContent="Select to date."; err=true; }
  if (from && to && from > to) { document.getElementById("leaveToError").textContent="To date must be after from date."; err=true; }
  if (from && from < tod)     { document.getElementById("leaveFromError").textContent="Cannot apply leave for a past date."; err=true; }
  if (!type) { document.getElementById("leaveTypeError").textContent="Select leave type."; err=true; }
  if (reason.length < 5) { document.getElementById("leaveReasonError").textContent="Enter a reason (min 5 chars)."; err=true; }
  if (err) { conflictBox.style.display="none"; setMsg("leaveMessageBox","Please fix the errors.","error"); return; }

  // Check appointment conflicts
  const conflicts = getMyAppointments().filter(a => {
    if (a.appointmentStatus==="CANCELLED"||a.appointmentStatus==="COMPLETED") return false;
    return a.appointmentDate >= from && a.appointmentDate <= to;
  });

  if (conflicts.length) {
    conflictBox.style.display = "block";
    conflictBox.innerHTML = `
      <div class="conflict-title">⚠️ You have ${conflicts.length} appointment(s) during this leave period:</div>
      <ul class="conflict-list">
        ${conflicts.map(a=>`<li>${a.appointmentId} — ${a.appointmentPatient} on ${a.appointmentDate} at ${a.appointmentTime}</li>`).join("")}
      </ul>
      <p style="margin-top:8px;font-size:12px;color:#94a3b8;">Leave has been saved as PENDING. Please reschedule or cancel those appointments.</p>`;
  } else {
    conflictBox.style.display = "none";
  }

  const days = Math.ceil((new Date(to)-new Date(from))/(1000*60*60*24))+1;
  const leaves = getLeaves();

  if (editId) {
    const l = leaves.find(x=>x.leaveId===editId);
    if (l) { Object.assign(l, { from, to, type, reason, days }); }
    saveLeaves(leaves);
    setMsg("leaveMessageBox","Leave updated.","success");
  } else {
    const leaveId = genId("LV", leaves, "leaveId");
    leaves.push({
      leaveId, doctorId: currentDoctorId, from, to, type, reason, days,
      status: "PENDING",
      hasConflicts: conflicts.length > 0,
      appliedAt: new Date().toISOString()
    });
    saveLeaves(leaves);
    setMsg("leaveMessageBox", conflicts.length
      ? `Leave ${leaveId} saved as PENDING — ${conflicts.length} conflict(s) detected.`
      : `Leave ${leaveId} applied successfully.`,
      conflicts.length ? "warning" : "success");
  }

  document.getElementById("leaveForm").reset();
  document.getElementById("editingLeaveId").value = "";
  renderLeaveTable();
}

function renderLeaveTable() {
  const tbody = document.getElementById("leaveTableBody");
  if (!tbody) return;
  const leaves = getLeaves().filter(l=>!currentDoctorId||l.doctorId===currentDoctorId);
  tbody.innerHTML = "";
  if (!leaves.length) {
    tbody.innerHTML=`<tr><td colspan="8" style="text-align:center;color:#94a3b8;padding:20px;">No leave records found.</td></tr>`;
    return;
  }
  [...leaves].reverse().forEach(l => {
    const sCls = l.status==="APPROVED"?"badge-completed":l.status==="REJECTED"?"badge-cancelled":"badge-pending";
    tbody.innerHTML += `
      <tr>
        <td>${l.leaveId}</td>
        <td>${l.type}</td>
        <td>${l.from}</td>
        <td>${l.to}</td>
        <td>${l.days}</td>
        <td style="max-width:200px;font-size:12px;">${l.reason}</td>
        <td><span class="badge ${sCls}">${l.status}</span>${l.hasConflicts?` <span class="badge badge-cancelled" style="font-size:9px;">⚠ Conflicts</span>`:""}</td>
        <td>
          <div class="row-actions">
            ${l.status==="PENDING"?`<button class="action-btn edit" onclick="editLeave('${l.leaveId}')">Edit</button>`:""}
            <button class="action-btn delete" onclick="deleteLeave('${l.leaveId}')">Delete</button>
          </div>
        </td>
      </tr>`;
  });
}

window.editLeave = function(id) {
  const l = getLeaves().find(x=>x.leaveId===id);
  if (!l) return;
  document.getElementById("editingLeaveId").value = l.leaveId;
  document.getElementById("leaveFrom").value = l.from;
  document.getElementById("leaveTo").value = l.to;
  document.getElementById("leaveType").value = l.type;
  document.getElementById("leaveReason").value = l.reason;
  setMsg("leaveMessageBox",`Editing leave ${l.leaveId}`,"warning");
};

window.deleteLeave = function(id) {
  if (!confirm("Delete this leave record?")) return;
  saveLeaves(getLeaves().filter(l=>l.leaveId!==id));
  renderLeaveTable();
};

/* ─── PROFILE ───────────────────────────────────── */
function renderProfile() {
  const doctors = getDoctors();
  const doctor = currentDoctorId ? doctors.find(d=>d.doctorId===currentDoctorId) : doctors[0];
  if (!doctor) return;

  const initials = doctor.name.split(" ").filter(Boolean).map(w=>w[0]).join("").slice(0,2).toUpperCase();
  document.getElementById("profileAvatarCircle").textContent = initials;
  document.getElementById("topbarAvatar").textContent = initials;
  document.getElementById("topbarDoctorName").textContent = doctor.name;
  document.getElementById("heroDoctorGreeting").textContent = `Welcome, ${doctor.name}`;
  document.getElementById("heroDoctorSub").textContent = `${doctor.specialization} · Room ${doctor.room||"—"} · ${doctor.schedule||""}`;

  document.getElementById("profileName").textContent = doctor.name;
  document.getElementById("profileSpec").textContent = doctor.specialization;
  document.getElementById("profileLicense").textContent = `License: ${doctor.license||"—"}`;
  document.getElementById("profileEmail").textContent = doctor.email||"—";
  document.getElementById("profilePhone").textContent = doctor.phone||"—";
  document.getElementById("profileRoom").textContent  = doctor.room||"—";
  document.getElementById("profileExp").textContent   = doctor.experience ? `${doctor.experience} years` : "—";
  document.getElementById("profileSchedule").textContent = doctor.schedule||"—";

  const status = document.getElementById("profileStatus");
  status.textContent = "Active";
  status.className = "profile-status-pill";

  // stats
  const myConsults = getConsultations().filter(c=>!currentDoctorId||c.doctorId===currentDoctorId);
  const myRx = getDrRxQueue().filter(r=>!currentDoctorId||r.doctorId===currentDoctorId);
  const myLab = getLabRequests().filter(r=>r.source==="DOCTOR"&&(!currentDoctorId||r.doctorId===currentDoctorId));
  document.getElementById("profileTotalConsults").textContent = myConsults.length;
  document.getElementById("profileTotalRx").textContent = myRx.length;
  document.getElementById("profileTotalLab").textContent = myLab.length;

  // upcoming leave
  const upLeave = getLeaves().filter(l=>l.from>=today()&&l.status!=="REJECTED"&&(!currentDoctorId||l.doctorId===currentDoctorId));
  const leaveEl = document.getElementById("profileUpcomingLeave");
  if (upLeave.length) {
    leaveEl.innerHTML = upLeave.map(l=>`<div style="margin-bottom:6px;"><span class="badge badge-pending">${l.type}</span> ${l.from} → ${l.to} (${l.days} day${l.days>1?"s":""})</div>`).join("");
  } else {
    leaveEl.textContent = "No upcoming leave.";
  }
}

/* ─── CHANGE PASSWORD ───────────────────────────── */
function changePassword() {
  const cur = document.getElementById("pwdCurrent").value;
  const nw  = document.getElementById("pwdNew").value;
  if (!cur || !nw) { setMsg("pwdMessageBox","Fill both fields.","warning"); return; }
  if (nw.length < 6) { setMsg("pwdMessageBox","New password must be at least 6 characters.","warning"); return; }
  // Symbolic — localStorage doesn't actually have passwords for doctors in this demo
  setMsg("pwdMessageBox","Password updated successfully.","success");
  document.getElementById("pwdCurrent").value = "";
  document.getElementById("pwdNew").value = "";
}

/* ─── DOMContentLoaded ──────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  navButtons = document.querySelectorAll(".nav-btn[data-target]");
  sections   = document.querySelectorAll(".content-section");
  logoutBtn  = document.getElementById("logoutBtn");

  const doctor = detectCurrentDoctor();
  if (doctor) currentDoctorId = doctor.doctorId;

  // Update header with doctor name on load
  if (doctor) {
    const initials = doctor.name.split(" ").filter(Boolean).map(w=>w[0]).join("").slice(0,2).toUpperCase();
    document.getElementById("topbarAvatar").textContent = initials;
    document.getElementById("topbarDoctorName").textContent = doctor.name;
    document.getElementById("heroDoctorGreeting").textContent = `Welcome, ${doctor.name}`;
    document.getElementById("heroDoctorSub").textContent = `${doctor.specialization} · ${doctor.schedule||""}`;
  }

  // Nav
  navButtons.forEach(b => b.addEventListener("click", () => showSection(b.dataset.target)));
  logoutBtn?.addEventListener("click", () => window.location.href = "index.html");

  // Appointment section
  document.getElementById("appointmentSearchInput")?.addEventListener("input", renderAppointments);
  document.getElementById("apptFilterTabs")?.addEventListener("click", e => {
    if (!e.target.dataset.filter) return;
    document.querySelectorAll(".filter-tab").forEach(t=>t.classList.remove("active"));
    e.target.classList.add("active");
    currentApptFilter = e.target.dataset.filter;
    renderAppointments();
  });

  // Consultation
  document.getElementById("consultApptSelect")?.addEventListener("change", handleConsultApptChange);
  document.getElementById("saveConsultationBtn")?.addEventListener("click", saveConsultation);
  document.getElementById("clearConsultationBtn")?.addEventListener("click", () => {
    document.getElementById("consultationForm").reset();
    document.getElementById("editingConsultId").value="";
    document.getElementById("consultPatientChip").textContent="Select an appointment above";
    setMsg("consultationMessageBox","Form cleared.","default");
  });

  // Prescription
  document.getElementById("rxApptSelect")?.addEventListener("change", handleRxApptChange);
  document.getElementById("rxAddItemBtn")?.addEventListener("click", addRxItem);
  document.getElementById("rxSendPOSBtn")?.addEventListener("click", sendRxToPOS);
  document.getElementById("rxClearBtn")?.addEventListener("click", () => {
    rxCart=[];
    renderRxCart();
    document.getElementById("rxApptSelect").value="";
    document.getElementById("rxPatientChip").textContent="—";
    setMsg("rxMessageBox","Cleared.","default");
  });

  // Lab
  document.getElementById("labApptSelect")?.addEventListener("change", handleLabApptChange);
  document.getElementById("saveLabOrderBtn")?.addEventListener("click", saveLabOrder);
  document.getElementById("clearLabOrderBtn")?.addEventListener("click", () => {
    document.getElementById("labApptSelect").value="";
    document.getElementById("labTestSelect").value="";
    document.getElementById("labClinicalNotes").value="";
    document.getElementById("labPatientChip").textContent="—";
    document.getElementById("editingLabOrderId").value="";
    setMsg("labOrderMessageBox","Cleared.","default");
  });

  // History
  document.getElementById("historySearchInput")?.addEventListener("input", renderHistory);

  // Leave
  document.getElementById("saveLeaveBtn")?.addEventListener("click", saveLeave);
  document.getElementById("clearLeaveBtn")?.addEventListener("click", () => {
    document.getElementById("leaveForm").reset();
    document.getElementById("editingLeaveId").value="";
    document.getElementById("leaveConflictBox").style.display="none";
    setMsg("leaveMessageBox","Form cleared.","default");
  });

  // Profile
  document.getElementById("changePwdBtn")?.addEventListener("click", changePassword);

  // Modals
  const closeAppt = () => document.getElementById("apptDetailModal").classList.remove("show");
  document.getElementById("closeApptModal")?.addEventListener("click", closeAppt);
  document.getElementById("closeApptModalBtn")?.addEventListener("click", closeAppt);
  document.getElementById("apptDetailModal")?.addEventListener("click", e => { if(e.target===e.currentTarget) closeAppt(); });
  document.getElementById("startConsultFromModal")?.addEventListener("click", e => {
    const apptId = e.currentTarget.dataset.apptId;
    closeAppt();
    goConsult(apptId);
  });

  const closeConsult = () => document.getElementById("consultViewModal").classList.remove("show");
  document.getElementById("closeConsultModal")?.addEventListener("click", closeConsult);
  document.getElementById("closeConsultModalBtn")?.addEventListener("click", closeConsult);
  document.getElementById("consultViewModal")?.addEventListener("click", e => { if(e.target===e.currentTarget) closeConsult(); });

  // Set min date for leave
  const tod = today();
  document.getElementById("leaveFrom").min = tod;
  document.getElementById("leaveTo").min = tod;

  // Initial render
  renderAppointments();
});
