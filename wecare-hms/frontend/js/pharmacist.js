let navButtons;
let sections;
let logoutBtn;

let cart = [];
let currentInvoiceForPrint = null;
let currentLabReportForPrint = null;

/* ---------- Storage ---------- */
function getPatients() {
  return JSON.parse(localStorage.getItem("wecare_patients")) || [];
}

function getDoctors() {
  return JSON.parse(localStorage.getItem("wecare_doctors")) || [
    { doctorId: "DOC-001", name: "Dr. Silva", specialization: "Cardiology" },
    { doctorId: "DOC-002", name: "Dr. Perera", specialization: "General Medicine" },
    { doctorId: "DOC-003", name: "Dr. Nadeesha", specialization: "Dermatology" }
  ];
}

function getInventory() {
  return JSON.parse(localStorage.getItem("wecare_inventory")) || [
    { itemId: "ITM-001", name: "Paracetamol", type: "MEDICINE", price: 50, stock: 120 },
    { itemId: "ITM-002", name: "Amoxicillin", type: "MEDICINE", price: 120, stock: 8 },
    { itemId: "ITM-003", name: "Bandage", type: "SERVICE", price: 200, stock: 999 }
  ];
}

function saveInventory(data) {
  localStorage.setItem("wecare_inventory", JSON.stringify(data));
}

function getLabTests() {
  return JSON.parse(localStorage.getItem("wecare_lab_tests")) || [
    { testId: "LBT-001", testName: "Blood Test", price: 1500, category: "General Lab", status: "ACTIVE" },
    { testId: "LBT-002", testName: "Urine Test", price: 1000, category: "General Lab", status: "ACTIVE" },
    { testId: "LBT-003", testName: "Cholesterol Test", price: 1800, category: "Special Lab", status: "ACTIVE" },
    { testId: "LBT-004", testName: "Glucose Test", price: 1200, category: "Special Lab", status: "ACTIVE" }
  ];
}

function seedLabTests() {
  if (!localStorage.getItem("wecare_lab_tests")) {
    localStorage.setItem("wecare_lab_tests", JSON.stringify(getLabTests()));
  }
}

function getLabRequests() {
  return JSON.parse(localStorage.getItem("wecare_lab_requests")) || [];
}

function saveLabRequests(data) {
  localStorage.setItem("wecare_lab_requests", JSON.stringify(data));
}

function getLabReports() {
  return JSON.parse(localStorage.getItem("wecare_lab_reports")) || [];
}

function saveLabReports(data) {
  localStorage.setItem("wecare_lab_reports", JSON.stringify(data));
}

function getInvoices() {
  return JSON.parse(localStorage.getItem("wecare_invoices")) || [];
}

function saveInvoices(data) {
  localStorage.setItem("wecare_invoices", JSON.stringify(data));
}

function getPayments() {
  return JSON.parse(localStorage.getItem("wecare_payments")) || [];
}

function savePayments(data) {
  localStorage.setItem("wecare_payments", JSON.stringify(data));
}

function getPOSQueue() {
  return JSON.parse(localStorage.getItem("wecare_pos_queue")) || [];
}

function savePOSQueue(data) {
  localStorage.setItem("wecare_pos_queue", JSON.stringify(data));
}

/* ---------- Utils ---------- */
function setStatusMessage(el, text, type = "default") {
  if (!el) return;
  el.textContent = text;
  if (type === "success") el.style.color = "#16a34a";
  else if (type === "error") el.style.color = "#dc2626";
  else if (type === "warning") el.style.color = "#d97706";
  else el.style.color = "#6b7280";
}

function clearFieldErrors(ids) {
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = "";
  });
}

function money(value) {
  return `Rs. ${Number(value || 0).toFixed(2)}`;
}

function numberFromMoney(value) {
  return Number(String(value || "").replace(/[^\d.]/g, "")) || 0;
}

function formatDateTime() {
  return new Date().toLocaleString();
}

// FIX #3: ID generation uses max existing ID to prevent collisions after deletions
function generateInvoiceId() {
  const invoices = getInvoices();
  if (invoices.length === 0) return "INV-001";
  const maxNum = Math.max(...invoices.map(i => {
    const n = parseInt((i.invoiceId || "0").replace(/\D/g, ""), 10);
    return isNaN(n) ? 0 : n;
  }));
  return `INV-${String(maxNum + 1).padStart(3, "0")}`;
}

function generatePaymentId() {
  const payments = getPayments();
  if (payments.length === 0) return "PAY-001";
  const maxNum = Math.max(...payments.map(p => {
    const n = parseInt((p.paymentId || "0").replace(/\D/g, ""), 10);
    return isNaN(n) ? 0 : n;
  }));
  return `PAY-${String(maxNum + 1).padStart(3, "0")}`;
}

function generateLabRequestId() {
  const requests = getLabRequests();
  if (requests.length === 0) return "LRQ-001";
  const maxNum = Math.max(...requests.map(r => {
    const n = parseInt((r.requestId || "0").replace(/\D/g, ""), 10);
    return isNaN(n) ? 0 : n;
  }));
  return `LRQ-${String(maxNum + 1).padStart(3, "0")}`;
}

function generateLabReportId() {
  const reports = getLabReports();
  if (reports.length === 0) return "LRP-001";
  const maxNum = Math.max(...reports.map(r => {
    const n = parseInt((r.reportId || "0").replace(/\D/g, ""), 10);
    return isNaN(n) ? 0 : n;
  }));
  return `LRP-${String(maxNum + 1).padStart(3, "0")}`;
}

function getPatientById(patientId) {
  return getPatients().find((p) => p.patientId === patientId);
}

function getDoctorById(doctorId) {
  return getDoctors().find((d) => d.doctorId === doctorId);
}

function getItemCatalog() {
  const inventory = getInventory().map((item) => ({
    itemId: item.itemId,
    name: item.name,
    type: item.type,
    price: Number(item.price),
    stock: Number(item.stock)
  }));

  const labCharges = getLabTests()
    .filter((test) => test.status === "ACTIVE")
    .map((test) => ({
      itemId: test.testId,
      name: test.testName,
      type: "LAB_TEST",
      price: Number(test.price),
      stock: 999999
    }));

  return [...inventory, ...labCharges];
}

function consultationFeeByType(type) {
  if (type === "EMERGENCY") return 4000;
  if (type === "SPECIALIST") return 3000;
  if (type === "OPD") return 1500;
  return 0;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", () => {
  seedLabTests();

  navButtons = document.querySelectorAll(".nav-btn[data-target]");
  sections = document.querySelectorAll(".content-section");
  logoutBtn = document.getElementById("logoutBtn");

  navButtons.forEach((button) => {
    button.addEventListener("click", () => showSection(button.dataset.target));
  });

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }

  setupPOS();
  setupLabRequests();
  setupLabReports();
  setupInvoiceSearch();

  populatePatientsEverywhere();
  populateDoctorsEverywhere();
  populateItemsForPOS();
  populateLabTests();
  populateLabReportRequestSelect();
  renderReceptionistQueue();
  renderCart();
  renderLabRequests();
  renderLabReports();
  renderInvoices();
  showSection("section-pos");
});

function showSection(targetId) {
  navButtons.forEach((btn) => btn.classList.remove("active"));
  sections.forEach((section) => section.classList.remove("active-section"));

  document.getElementById(targetId)?.classList.add("active-section");
  document.querySelector(`.nav-btn[data-target="${targetId}"]`)?.classList.add("active");

  if (targetId === "section-receptionist-queue") renderReceptionistQueue();
  if (targetId === "section-invoices") renderInvoices();
  if (targetId === "section-lab-requests") renderLabRequests();
  if (targetId === "section-lab-reports") renderLabReports();
}

/* ---------- POS ---------- */
function setupPOS() {
  document.getElementById("patientSearchInput")?.addEventListener("input", syncPatientSearchToSelect);
  document.getElementById("posPatientSelect")?.addEventListener("change", renderPatientQuickCard);
  document.getElementById("posVisitType")?.addEventListener("change", updateConsultationFee);
  document.getElementById("posDoctorSelect")?.addEventListener("change", updateConsultationFee);
  document.getElementById("itemSearchInput")?.addEventListener("input", syncItemSearchToSelect);
  document.getElementById("addItemBtn")?.addEventListener("click", addItemToCart);
  document.getElementById("clearItemBtn")?.addEventListener("click", clearItemSelection);
  document.getElementById("addConsultationFeeBtn")?.addEventListener("click", addConsultationFeeToCart);
  document.getElementById("paymentMethod")?.addEventListener("change", updateBalanceText);
  document.getElementById("amountPaid")?.addEventListener("input", updateBalanceText);
  document.getElementById("saveInvoiceBtn")?.addEventListener("click", saveInvoiceOnly);
  document.getElementById("payNowBtn")?.addEventListener("click", payNow);
  document.getElementById("printReceiptBtn")?.addEventListener("click", printCurrentReceipt);
  document.getElementById("clearCartBtn")?.addEventListener("click", clearCartAll);
}

function populatePatientsEverywhere() {
  const patients = getPatients();
  const patientSelect = document.getElementById("posPatientSelect");
  const patientSearchList = document.getElementById("patientSearchList");
  const labPatientSelect = document.getElementById("labPatientSelect");

  // Preserve current selections before re-render
  const currentPosVal = patientSelect?.value || "";
  const currentLabVal = labPatientSelect?.value || "";

  if (patientSelect) patientSelect.innerHTML = '<option value="">Select patient</option>';
  if (labPatientSelect) labPatientSelect.innerHTML = '<option value="">Select patient</option>';
  if (patientSearchList) patientSearchList.innerHTML = "";

  patients.forEach((patient) => {
    if (patientSelect) {
      patientSelect.innerHTML += `<option value="${patient.patientId}">${patient.patientId} - ${patient.fullName} (${patient.nic})</option>`;
    }
    if (labPatientSelect) {
      labPatientSelect.innerHTML += `<option value="${patient.patientId}">${patient.patientId} - ${patient.fullName}</option>`;
    }
    if (patientSearchList) {
      patientSearchList.innerHTML += `<option value="${patient.patientId} - ${patient.fullName} - ${patient.nic}"></option>`;
    }
  });

  // Restore selections after re-render FIX #15
  if (patientSelect && currentPosVal) patientSelect.value = currentPosVal;
  if (labPatientSelect && currentLabVal) labPatientSelect.value = currentLabVal;
}

function populateDoctorsEverywhere() {
  const doctors = getDoctors();
  const posDoctorSelect = document.getElementById("posDoctorSelect");
  const labDoctorSelect = document.getElementById("labDoctorSelect");

  const currentPosDoc = posDoctorSelect?.value || "";
  const currentLabDoc = labDoctorSelect?.value || "";

  if (posDoctorSelect) posDoctorSelect.innerHTML = '<option value="">Select doctor</option>';
  if (labDoctorSelect) labDoctorSelect.innerHTML = '<option value="">Select doctor</option>';

  doctors.forEach((doctor) => {
    const label = `${doctor.name} - ${doctor.specialization || "General Medicine"}`;
    if (posDoctorSelect) {
      posDoctorSelect.innerHTML += `<option value="${doctor.doctorId}">${label}</option>`;
    }
    if (labDoctorSelect) {
      labDoctorSelect.innerHTML += `<option value="${doctor.doctorId}">${label}</option>`;
    }
  });

  if (posDoctorSelect && currentPosDoc) posDoctorSelect.value = currentPosDoc;
  if (labDoctorSelect && currentLabDoc) labDoctorSelect.value = currentLabDoc;
}

function populateItemsForPOS() {
  const catalog = getItemCatalog();
  const itemSelect = document.getElementById("itemSelect");
  const itemSearchList = document.getElementById("itemSearchList");

  if (itemSelect) itemSelect.innerHTML = '<option value="">Select item</option>';
  if (itemSearchList) itemSearchList.innerHTML = "";
  catalog.forEach((item) => {
    if (itemSelect) {
      itemSelect.innerHTML += `<option value="${item.itemId}">${item.name} - ${item.type} - ${money(item.price)}</option>`;
    }
    if (itemSearchList) {
      itemSearchList.innerHTML += `<option value="${item.name} - ${item.type}"></option>`;
    }
  });
}

function syncPatientSearchToSelect() {
  const value = document.getElementById("patientSearchInput")?.value.trim().toLowerCase() || "";
  const patients = getPatients();

  const matched = patients.find((patient) =>
    (`${patient.patientId} - ${patient.fullName} - ${patient.nic}`).toLowerCase().includes(value)
  );

  if (matched) {
    setValue("posPatientSelect", matched.patientId);
    renderPatientQuickCard();
  }
}

function syncItemSearchToSelect() {
  const value = document.getElementById("itemSearchInput")?.value.trim().toLowerCase() || "";
  const catalog = getItemCatalog();

  const matched = catalog.find((item) =>
    (`${item.name} - ${item.type}`).toLowerCase().includes(value)
  );

  if (matched) {
    setValue("itemSelect", matched.itemId);
  }
}

function renderPatientQuickCard() {
  const patientId = document.getElementById("posPatientSelect")?.value;
  const card = document.getElementById("patientQuickCard");
  const patient = getPatientById(patientId);

  if (!card) return;

  if (!patient) {
    card.className = "patient-quick-card";
    card.innerHTML = "<p>Select a patient to see quick details.</p>";
    return;
  }

  card.className = "patient-quick-card filled";
  card.innerHTML =
    `<div class="pqc-name">${patient.fullName}</div>` +
    `<div class="pqc-row">` +
    `<div class="pqc-item">ID: <span>${patient.patientId}</span></div>` +
    `<div class="pqc-item">NIC: <span>${patient.nic}</span></div>` +
    `<div class="pqc-item">Phone: <span>${patient.phone}</span></div>` +
    `<div class="pqc-item">Blood: <span>${patient.bloodGroup || "-"}</span></div>` +
    `</div>`;
}

function updateConsultationFee() {
  const visitType = document.getElementById("posVisitType")?.value;
  const doctorId = document.getElementById("posDoctorSelect")?.value;
  const doctor = getDoctorById(doctorId);

  let fee = consultationFeeByType(visitType);

  if (doctor && doctor.specialization && doctor.specialization !== "General Medicine" && visitType !== "EMERGENCY") {
    fee = Math.max(fee, 3000);
  }

  setValue("consultationFee", fee > 0 ? fee.toFixed(2) : "");
}

function clearItemSelection() {
  setValue("itemSelect", "");
  setValue("itemQty", 1);
  setValue("itemDiscount", 0);
  setValue("itemNote", "");
  clearFieldErrors(["itemSelectError", "itemQtyError", "itemDiscountError"]);
}

function calculateLineTotal(price, qty, discount) {
  const subtotal = Number(price) * Number(qty);
  const result = subtotal - Number(discount || 0);
  return result < 0 ? 0 : result;
}

function addItemToCart() {
  clearFieldErrors(["itemSelectError", "itemQtyError", "itemDiscountError"]);

  const itemId = document.getElementById("itemSelect")?.value;
  const qty = Number(document.getElementById("itemQty")?.value);
  const discount = Number(document.getElementById("itemDiscount")?.value || 0);
  const note = document.getElementById("itemNote")?.value.trim() || "";

  let hasError = false;

  if (!itemId) {
    setText("itemSelectError", "Select an item.");
    hasError = true;
  }

  if (!qty || qty < 1) {
    setText("itemQtyError", "Quantity must be at least 1.");
    hasError = true;
  }

  if (discount < 0) {
    setText("itemDiscountError", "Discount cannot be negative.");
    hasError = true;
  }

  const item = getItemCatalog().find((i) => i.itemId === itemId);

  if (!item) {
    setText("itemSelectError", "Item not found in catalog.");
    hasError = true;
  } else if (item.type === "MEDICINE" && qty > Number(item.stock)) {
    setText("itemQtyError", `Only ${item.stock} in stock.`);
    hasError = true;
  }

  // FIX #14: Validate discount doesn't exceed item subtotal
  if (item && !hasError && discount > Number(item.price) * qty) {
    setText("itemDiscountError", `Discount cannot exceed item total of Rs. ${(Number(item.price) * qty).toFixed(2)}.`);
    hasError = true;
  }

  if (hasError) {
    setStatusMessage(document.getElementById("cartMessageBox"), "Please fix cart item errors.", "error");
    return;
  }

  const existing = cart.find((line) => line.itemId === itemId);

  if (existing) {
    const newQty = existing.qty + qty;

    if (item.type === "MEDICINE" && newQty > Number(item.stock)) {
      setText("itemQtyError", `Cannot exceed stock of ${item.stock}.`);
      setStatusMessage(document.getElementById("cartMessageBox"), "Stock limit reached.", "warning");
      return;
    }

    existing.qty = newQty;
    // FIX #2: Replace discount instead of accumulating it
    existing.discount = discount;
    if (note) existing.note = note;
    existing.lineTotal = calculateLineTotal(existing.price, existing.qty, existing.discount);
    setStatusMessage(document.getElementById("cartMessageBox"), "Item quantity updated in cart.", "success");
  } else {
    cart.push({
      itemId: item.itemId,
      name: item.name,
      type: item.type,
      price: Number(item.price),
      qty,
      discount,
      note,
      lineTotal: calculateLineTotal(item.price, qty, discount)
    });
    setStatusMessage(document.getElementById("cartMessageBox"), "Item added to cart.", "success");
  }

  renderCart();
  clearItemSelection();
}

function addOrUpdateConsultationFeeCartItem(feeValue = null, forceNote = "") {
  const consultationFee = feeValue !== null
    ? Number(feeValue)
    : numberFromMoney(document.getElementById("consultationFee")?.value);

  const visitType = document.getElementById("posVisitType")?.value || "";
  const doctorId = document.getElementById("posDoctorSelect")?.value || "";
  const doctor = getDoctorById(doctorId);

  if (consultationFee <= 0) {
    setStatusMessage(document.getElementById("cartMessageBox"), "Consultation fee is not set correctly.", "warning");
    return false;
  }

  const existing = cart.find((line) => line.itemId === "CONSULTATION_FEE");
  const name = `Consultation Fee${visitType ? " (" + visitType + ")" : ""}`;
  const note = forceNote || (doctor ? "Dr. " + doctor.name : "");

  if (existing) {
    existing.name = name;
    existing.type = "CONSULTATION";
    existing.price = consultationFee;
    existing.qty = 1;
    existing.discount = 0;
    existing.note = note;
    existing.lineTotal = consultationFee;
  } else {
    cart.push({
      itemId: "CONSULTATION_FEE",
      name,
      type: "CONSULTATION",
      price: consultationFee,
      qty: 1,
      discount: 0,
      note,
      lineTotal: consultationFee
    });
  }

  renderCart();
  return true;
}

// FIX #6: Replaced alert() with inline status message
function addConsultationFeeToCart() {
  const visitType = document.getElementById("posVisitType")?.value;
  const doctorId = document.getElementById("posDoctorSelect")?.value;

  if (!visitType || !doctorId) {
    setStatusMessage(document.getElementById("cartMessageBox"), "Please select visit type and doctor first.", "warning");
    return;
  }

  const ok = addOrUpdateConsultationFeeCartItem();
  if (ok) {
    setStatusMessage(
      document.getElementById("cartMessageBox"),
      `Consultation fee of ${money(numberFromMoney(document.getElementById("consultationFee")?.value))} added to cart.`,
      "success"
    );
  }
}

function renderCart() {
  const cartTableBody = document.getElementById("cartTableBody");
  if (!cartTableBody) return;

  cartTableBody.innerHTML = "";

  if (cart.length === 0) {
    cartTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#94a3b8;">No items in cart.</td></tr>';
  } else {
    cart.forEach((line) => {
      cartTableBody.innerHTML += `
        <tr>
          <td>${line.name}${line.note ? `<br><small style="color:#94a3b8;">${line.note}</small>` : ""}</td>
          <td>${line.type}</td>
          <td>${line.qty}</td>
          <td>${money(line.price)}</td>
          <td>${money(line.discount)}</td>
          <td>${money(line.lineTotal)}</td>
          <td>
            <div class="row-actions">
              <button class="action-btn edit" onclick="increaseCartQty('${line.itemId}')">+</button>
              <button class="action-btn edit" onclick="decreaseCartQty('${line.itemId}')">-</button>
              <button class="action-btn delete" onclick="removeCartItem('${line.itemId}')">Remove</button>
            </div>
          </td>
        </tr>
      `;
    });
  }

  recalcSummary();
}

// FIX #4: Recalc uses lineTotal to avoid negative grand total from mismatched discount math
function recalcSummary() {
  const subtotal = cart.reduce((sum, line) => sum + (Number(line.price) * Number(line.qty)), 0);
  const totalDiscount = cart.reduce((sum, line) => sum + Number(line.discount || 0), 0);
  // Grand total derived from sum of lineTotals (already discount-adjusted per line)
  const grandTotal = cart.reduce((sum, line) => sum + Number(line.lineTotal || 0), 0);

  setText("subtotalText", money(subtotal));
  setText("discountText", money(totalDiscount));
  setText("grandTotalText", money(grandTotal < 0 ? 0 : grandTotal));

  updateBalanceText();
}

function updateBalanceText() {
  const total = numberFromMoney(document.getElementById("grandTotalText")?.textContent);
  const paid = Number(document.getElementById("amountPaid")?.value || 0);
  const method = document.getElementById("paymentMethod")?.value;

  if (!method) {
    setValue("balanceText", "");
    return;
  }

  const balance = paid - total;

  if (balance >= 0) {
    setValue("balanceText", `Change: ${money(balance)}`);
  } else {
    setValue("balanceText", `Due: ${money(Math.abs(balance))}`);
  }
}

window.increaseCartQty = function (itemId) {
  const item = getItemCatalog().find((i) => i.itemId === itemId);
  const line = cart.find((c) => c.itemId === itemId);
  if (!line) return;

  if (line.itemId === "CONSULTATION_FEE") return;

  if (item && item.type === "MEDICINE" && line.qty + 1 > Number(item.stock)) {
    setStatusMessage(document.getElementById("cartMessageBox"), "Cannot exceed available stock.", "warning");
    return;
  }

  line.qty += 1;
  line.lineTotal = calculateLineTotal(line.price, line.qty, line.discount);
  renderCart();
};

window.decreaseCartQty = function (itemId) {
  const line = cart.find((c) => c.itemId === itemId);
  if (!line) return;

  if (line.itemId === "CONSULTATION_FEE") {
    cart = cart.filter((c) => c.itemId !== itemId);
    renderCart();
    return;
  }

  line.qty -= 1;
  if (line.qty <= 0) {
    cart = cart.filter((c) => c.itemId !== itemId);
  } else {
    line.lineTotal = calculateLineTotal(line.price, line.qty, line.discount);
  }
  renderCart();
};

window.removeCartItem = function (itemId) {
  cart = cart.filter((c) => c.itemId !== itemId);
  renderCart();
  setStatusMessage(document.getElementById("cartMessageBox"), "Item removed from cart.", "success");
};

function validateBillingCore(requirePayment = false) {
  clearFieldErrors([
    "posPatientError",
    "posVisitTypeError",
    "posDoctorError",
    "paymentMethodError",
    "amountPaidError"
  ]);

  let hasError = false;

  if (!document.getElementById("posPatientSelect")?.value) {
    setText("posPatientError", "Select patient.");
    hasError = true;
  }

  if (!document.getElementById("posVisitType")?.value) {
    setText("posVisitTypeError", "Select visit type.");
    hasError = true;
  }

  if (!document.getElementById("posDoctorSelect")?.value) {
    setText("posDoctorError", "Select doctor.");
    hasError = true;
  }

  if (cart.length === 0) {
    setStatusMessage(document.getElementById("billingMessageBox"), "Cart is empty.", "error");
    hasError = true;
  }

  if (requirePayment) {
    const paymentMethod = document.getElementById("paymentMethod")?.value;
    const amountPaid = Number(document.getElementById("amountPaid")?.value || 0);
    const total = numberFromMoney(document.getElementById("grandTotalText")?.textContent);

    if (!paymentMethod) {
      setText("paymentMethodError", "Select payment method.");
      hasError = true;
    }

    if (amountPaid < total) {
      setText("amountPaidError", "Amount paid must cover total.");
      hasError = true;
    }
  }

  return !hasError;
}

function buildInvoiceObject(statusOverride = null, paymentMethodOverride = "", amountPaidOverride = 0) {
  const patientId = document.getElementById("posPatientSelect")?.value;
  const patient = getPatientById(patientId);
  const doctorId = document.getElementById("posDoctorSelect")?.value;
  const doctor = getDoctorById(doctorId);
  const visitType = document.getElementById("posVisitType")?.value;
  const note = document.getElementById("billingNote")?.value.trim() || "";
  const paymentMethod = paymentMethodOverride || document.getElementById("paymentMethod")?.value || "";
  const amountPaid = Number(amountPaidOverride || document.getElementById("amountPaid")?.value || 0);

  // FIX #3: Always read fresh from localStorage to get accurate ID
  const invoiceId = generateInvoiceId();

  const subtotal = numberFromMoney(document.getElementById("subtotalText")?.textContent);
  const discount = numberFromMoney(document.getElementById("discountText")?.textContent);
  const grandTotal = numberFromMoney(document.getElementById("grandTotalText")?.textContent);

  return {
    invoiceId,
    patientId,
    patientName: patient?.fullName || "",
    patientNic: patient?.nic || "",
    patientPhone: patient?.phone || "",
    doctorId,
    doctorName: doctor?.name || "",
    visitType,
    note,
    items: cart.map((line) => ({ ...line })),
    subtotal,
    discount,
    grandTotal,
    date: formatDateTime(),
    paymentMethod,
    amountPaid,
    balance: amountPaid - grandTotal,
    status: statusOverride || "PENDING"
  };
}

function deductMedicineStock(invoice) {
  const inventory = getInventory();

  invoice.items.forEach((line) => {
    if (line.type === "MEDICINE") {
      const item = inventory.find((i) => i.itemId === line.itemId);
      if (item) {
        item.stock = Math.max(0, Number(item.stock) - Number(line.qty));
      }
    }
  });

  saveInventory(inventory);
}

// FIX #9: saveInvoiceOnly no longer deducts stock — only payNow does
function saveInvoiceOnly() {
  if (!validateBillingCore(false)) return;

  const invoice = buildInvoiceObject("PENDING", "", 0);
  const invoices = getInvoices();
  invoices.push(invoice);
  saveInvoices(invoices);

  currentInvoiceForPrint = invoice;
  setStatusMessage(document.getElementById("billingMessageBox"), `Invoice ${invoice.invoiceId} saved as PENDING.`, "success");
  renderInvoices();
}

function payNow() {
  if (!validateBillingCore(true)) {
    setStatusMessage(document.getElementById("billingMessageBox"), "Please fix billing errors before payment.", "error");
    return;
  }

  const invoice = buildInvoiceObject("PAID");
  const invoices = getInvoices();
  invoices.push(invoice);
  saveInvoices(invoices);

  const paymentId = generatePaymentId();
  const payments = getPayments();
  payments.push({
    paymentId,
    invoiceId: invoice.invoiceId,
    amount: invoice.amountPaid,
    method: invoice.paymentMethod,
    date: formatDateTime(),
    status: "SUCCESS"
  });
  savePayments(payments);

  // FIX #9: Stock only deducted on actual payment
  deductMedicineStock(invoice);
  currentInvoiceForPrint = invoice;
  renderInvoices();
  populateItemsForPOS();
  setStatusMessage(document.getElementById("billingMessageBox"), `Payment successful. Invoice: ${invoice.invoiceId}`, "success");
}

// FIX #11: Confirm before clearing cart
function clearCartAll() {
  if (cart.length > 0) {
    const ok = confirm("Are you sure you want to clear the entire cart?");
    if (!ok) return;
  }
  cart = [];
  renderCart();
  setValue("paymentMethod", "");
  setValue("amountPaid", 0);
  setValue("balanceText", "");
  setStatusMessage(document.getElementById("billingMessageBox"), "Cart cleared.", "default");
}

// FIX #8: Balance shows proper change/due label on receipt
function fillReceiptPrint(invoice) {
  setText("printInvoiceId", invoice.invoiceId);
  setText("printPatientName", invoice.patientName);
  setText("printInvoiceDate", invoice.date);
  setText("printGrandTotal", money(invoice.grandTotal));
  setText("printPaymentMethod", invoice.paymentMethod || "Pending");
  setText("printDoctorName", invoice.doctorName || "-");
  setText("printVisitType", invoice.visitType || "-");
  setText("printInvoiceStatus", invoice.status || "PENDING");

  setText("printSubtotal", money(invoice.subtotal));
  setText("printDiscount", `-${money(invoice.discount)}`);
  setText("printAmountPaid", money(invoice.amountPaid || 0));

  // FIX #8: Show meaningful balance label
  const balance = Number(invoice.balance || 0);
  if (balance >= 0) {
    setText("printBalance", `Change: ${money(balance)}`);
  } else {
    setText("printBalance", `Due: ${money(Math.abs(balance))}`);
  }

  const itemsBody = document.getElementById("printReceiptItems");
  if (itemsBody) {
    itemsBody.innerHTML = "";
    (invoice.items || []).forEach((line) => {
      // FIX #1: Ensure all numeric values are coerced — prevents Rs. 0.00 for lab tests
      const price = Number(line.price) || 0;
      const qty = Number(line.qty) || 1;
      const lineTotal = Number(line.lineTotal) || (price * qty);
      itemsBody.innerHTML += `
        <tr>
          <td>${line.name}${line.note ? `<br><small>${line.note}</small>` : ""}</td>
          <td style="text-align: center;">${qty}</td>
          <td style="text-align: right;">${money(price)}</td>
          <td style="text-align: right;">${money(lineTotal)}</td>
        </tr>
      `;
    });
  }
}

// FIX #5: Added setTimeout so browser can repaint before print dialog
function printCurrentReceipt() {
  if (!currentInvoiceForPrint) {
    setStatusMessage(document.getElementById("billingMessageBox"), "Save or pay an invoice first before printing.", "warning");
    return;
  }

  fillReceiptPrint(currentInvoiceForPrint);
  const wrap = document.getElementById("receiptPrintWrap");
  if (wrap) wrap.style.display = "block";
  setTimeout(() => {
    window.print();
    setTimeout(() => { if (wrap) wrap.style.display = "none"; }, 500);
  }, 100);
}

window.printInvoiceById = function (invoiceId) {
  const invoice = getInvoices().find((i) => i.invoiceId === invoiceId);
  if (!invoice) return;
  currentInvoiceForPrint = invoice;
  fillReceiptPrint(invoice);
  const wrap = document.getElementById("receiptPrintWrap");
  if (wrap) wrap.style.display = "block";
  // FIX #5: setTimeout for print
  setTimeout(() => {
    window.print();
    setTimeout(() => { if (wrap) wrap.style.display = "none"; }, 500);
  }, 100);
};

function renderInvoices() {
  const invoices = getInvoices();
  const keyword = document.getElementById("invoiceSearchInput")?.value.trim().toLowerCase() || "";
  const tbody = document.getElementById("invoiceTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const filtered = invoices.filter((invoice) =>
    (invoice.invoiceId || "").toLowerCase().includes(keyword) ||
    (invoice.patientName || "").toLowerCase().includes(keyword)
  );

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#94a3b8;">No invoices found.</td></tr>';
    return;
  }

  filtered.forEach((invoice) => {
    const badgeClass = invoice.status === "PAID" ? "badge-paid" : "badge-pending";
    tbody.innerHTML += `
      <tr>
        <td>${invoice.invoiceId}</td>
        <td>${invoice.patientName}</td>
        <td>${invoice.date}</td>
        <td>${money(invoice.grandTotal)}</td>
        <td>${money(invoice.amountPaid || 0)}</td>
        <td>${invoice.paymentMethod || "-"}</td>
        <td><span class="badge ${badgeClass}">${invoice.status}</span></td>
        <td>
          <div class="row-actions">
            <button class="action-btn print" onclick="printInvoiceById('${invoice.invoiceId}')">Print</button>
          </div>
        </td>
      </tr>
    `;
  });
}

function setupInvoiceSearch() {
  document.getElementById("invoiceSearchInput")?.addEventListener("input", renderInvoices);
}

/* ---------- Receptionist Queue ---------- */
function renderReceptionistQueue() {
  const queue = getPOSQueue().filter((item) => !item.processed && item.status !== "CANCELLED");
  const container = document.getElementById("receptionist-queue-container");
  if (!container) return;

  if (queue.length === 0) {
    container.innerHTML = '<p style="color:#6b7280;text-align:center;padding:20px;">No pending appointments from reception.</p>';
    return;
  }

  container.innerHTML = queue.map((item) =>
    `<div class="queue-card">
      <div class="queue-card-info">
        <div class="queue-card-name">${item.patientName}</div>
        <div class="queue-card-meta">ID: ${item.patientId} | NIC: ${item.patientNic || "-"} | Tel: ${item.patientPhone || "-"}</div>
        <div class="queue-card-meta">Doctor: ${item.doctorName} | Type: ${item.casePriority || "-"} | Need: ${item.medicalNeed || "-"}</div>
      </div>
      <div style="text-align:right;">
        <div style="background:var(--primary-light);padding:8px 12px;border-radius:var(--radius);margin-bottom:8px;">
          <div style="font-size:11px;color:var(--text-3);">Consultation Fee</div>
          <div style="font-size:18px;font-weight:700;color:var(--primary);">${money(item.consultationFee)}</div>
        </div>
        <button onclick="loadAppointmentToInvoice('${item.queueId}')" class="btn btn-primary btn-sm">Load to Invoice</button>
      </div>
    </div>`
  ).join("");
}

window.loadAppointmentToInvoice = function (queueId) {
  const queue = getPOSQueue();
  const entry = queue.find((q) => q.queueId === queueId);
  if (!entry) return;

  setValue("posPatientSelect", entry.patientId || "");
  setValue("posVisitType", entry.casePriority || "");
  setValue("posDoctorSelect", entry.doctorId || "");
  setValue("billingNote", entry.description || "");
  setValue("consultationFee", Number(entry.consultationFee || 0).toFixed(2));

  renderPatientQuickCard();

  const feeAdded = addOrUpdateConsultationFeeCartItem(
    Number(entry.consultationFee || 0),
    entry.doctorName ? `Dr. ${entry.doctorName}` : ""
  );

  if (feeAdded) {
    setStatusMessage(
      document.getElementById("cartMessageBox"),
      `Appointment loaded. Patient: ${entry.patientName} | Doctor: ${entry.doctorName} | Fee: ${money(entry.consultationFee)}`,
      "success"
    );
  }

  showSection("section-pos");
};

/* ---------- Lab Requests ---------- */
function setupLabRequests() {
  document.getElementById("saveLabRequestBtn")?.addEventListener("click", saveLabRequest);
  document.getElementById("clearLabRequestBtn")?.addEventListener("click", clearLabRequestForm);
  document.getElementById("labRequestSearchInput")?.addEventListener("input", renderLabRequests);
}

function populateLabTests() {
  const tests = getLabTests();
  const select = document.getElementById("labTestSelect");
  if (!select) return;

  select.innerHTML = '<option value="">Select lab test</option>';
  tests.forEach((test) => {
    select.innerHTML += `<option value="${test.testId}">${test.testName} - ${money(test.price)}</option>`;
  });
}

function saveLabRequest() {
  clearFieldErrors(["labPatientError", "labDoctorError", "labTestError"]);

  const editingId = document.getElementById("editingLabRequestId")?.value;
  const patientId = document.getElementById("labPatientSelect")?.value;
  const doctorId = document.getElementById("labDoctorSelect")?.value;
  const testId = document.getElementById("labTestSelect")?.value;
  const status = document.getElementById("labRequestStatus")?.value;
  const clinicalNote = document.getElementById("labClinicalNote")?.value.trim() || "";

  let hasError = false;
  if (!patientId) { setText("labPatientError", "Select patient."); hasError = true; }
  if (!doctorId) { setText("labDoctorError", "Select doctor."); hasError = true; }
  if (!testId) { setText("labTestError", "Select lab test."); hasError = true; }

  if (hasError) {
    setStatusMessage(document.getElementById("labRequestMessageBox"), "Please fix lab request errors.", "error");
    return;
  }

  const patient = getPatientById(patientId);
  const doctor = getDoctorById(doctorId);
  const test = getLabTests().find((t) => t.testId === testId);
  let requests = getLabRequests();

  if (editingId) {
    const req = requests.find((r) => r.requestId === editingId);
    if (!req) return;

    req.patientId = patientId;
    req.patientName = patient.fullName;
    req.doctorId = doctorId;
    req.doctorName = doctor.name;
    req.testId = testId;
    req.testName = test.testName;
    req.price = Number(test.price);
    req.status = status;
    req.clinicalNote = clinicalNote;

    saveLabRequests(requests);
    setStatusMessage(document.getElementById("labRequestMessageBox"), "Lab request updated.", "success");
  } else {
    const requestId = generateLabRequestId();
    requests.push({
      requestId,
      patientId,
      patientName: patient.fullName,
      doctorId,
      doctorName: doctor.name,
      testId,
      testName: test.testName,
      price: Number(test.price),
      status,
      clinicalNote,
      sentToPOS: false,
      requestedDate: formatDateTime()
    });
    saveLabRequests(requests);
    setStatusMessage(document.getElementById("labRequestMessageBox"), `Lab request ${requestId} created.`, "success");
  }

  clearLabRequestForm(false);
  renderLabRequests();
  populateLabReportRequestSelect();
}

function clearLabRequestForm(resetMessage = true) {
  document.getElementById("labRequestForm")?.reset();
  setValue("editingLabRequestId", "");
  if (resetMessage) {
    setStatusMessage(document.getElementById("labRequestMessageBox"), "Lab request form cleared.", "default");
  }
}

window.editLabRequest = function (requestId) {
  const req = getLabRequests().find((r) => r.requestId === requestId);
  if (!req) return;

  setValue("editingLabRequestId", req.requestId);
  setValue("labPatientSelect", req.patientId);
  setValue("labDoctorSelect", req.doctorId);
  setValue("labTestSelect", req.testId);
  setValue("labRequestStatus", req.status);
  setValue("labClinicalNote", req.clinicalNote || "");
  setStatusMessage(document.getElementById("labRequestMessageBox"), `Editing ${req.requestId}`, "warning");
};

window.deleteLabRequest = function (requestId) {
  const ok = confirm("Delete this lab request?");
  if (!ok) return;

  let requests = getLabRequests();
  requests = requests.filter((r) => r.requestId !== requestId);
  saveLabRequests(requests);
  renderLabRequests();
  populateLabReportRequestSelect();
  setStatusMessage(document.getElementById("labRequestMessageBox"), "Lab request deleted.", "success");
};

// FIX #7: Cancelled lab requests cannot be sent to POS
// FIX #1: Number(req.price) ensures lab test price renders correctly on receipt
window.sendLabRequestToPOS = function (requestId) {
  const requests = getLabRequests();
  const req = requests.find((r) => r.requestId === requestId);
  if (!req) return;

  if (req.sentToPOS) {
    setStatusMessage(document.getElementById("labRequestMessageBox"), "Lab charge already sent to POS.", "warning");
    return;
  }

  // FIX #7: Block cancelled lab requests
  if (req.status === "CANCELLED") {
    setStatusMessage(document.getElementById("labRequestMessageBox"), "Cannot send a cancelled lab request to POS.", "error");
    return;
  }

  setValue("posPatientSelect", req.patientId);
  renderPatientQuickCard();

  const price = Number(req.price); // FIX #1: Force to Number
  const existing = cart.find((line) => line.itemId === req.testId);

  if (existing) {
    existing.qty += 1;
    existing.lineTotal = calculateLineTotal(existing.price, existing.qty, existing.discount);
  } else {
    cart.push({
      itemId: req.testId,
      name: req.testName,
      type: "LAB_TEST",
      price: price,
      qty: 1,
      discount: 0,
      note: `Linked from lab request ${req.requestId}`,
      lineTotal: calculateLineTotal(price, 1, 0) // FIX #1: use Number price
    });
  }

  req.sentToPOS = true;
  saveLabRequests(requests);
  renderCart();
  renderLabRequests();
  showSection("section-pos");
  setStatusMessage(document.getElementById("cartMessageBox"), `Lab test charge from ${req.requestId} added to cart.`, "success");
};

function renderLabRequests() {
  const requests = getLabRequests();
  const keyword = document.getElementById("labRequestSearchInput")?.value.trim().toLowerCase() || "";
  const tbody = document.getElementById("labRequestTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const filtered = requests.filter((req) =>
    (req.requestId || "").toLowerCase().includes(keyword) ||
    (req.patientName || "").toLowerCase().includes(keyword) ||
    (req.testName || "").toLowerCase().includes(keyword)
  );

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#94a3b8;">No lab requests found.</td></tr>';
    return;
  }

  filtered.forEach((req) => {
    const badgeClass =
      req.status === "COMPLETED" ? "badge-completed" :
      req.status === "CANCELLED" ? "badge-cancelled" :
      req.status === "IN_PROGRESS" ? "badge-progress" : "badge-pending";

    const sentLabel = req.sentToPOS
      ? '<span class="badge badge-completed" style="font-size:10px;">Sent</span>'
      : "";

    tbody.innerHTML += `
      <tr>
        <td>${req.requestId}</td>
        <td>${req.patientName}</td>
        <td>${req.doctorName}</td>
        <td>${req.testName}</td>
        <td>${money(req.price)}</td>
        <td><span class="badge ${badgeClass}">${req.status}</span></td>
        <td>${req.clinicalNote || "-"}</td>
        <td>
          <div class="row-actions">
            <button class="action-btn edit" onclick="editLabRequest('${req.requestId}')">Edit</button>
            ${req.status !== "CANCELLED" && !req.sentToPOS ? `<button class="action-btn send" onclick="sendLabRequestToPOS('${req.requestId}')">Send to POS</button>` : sentLabel}
            <button class="action-btn delete" onclick="deleteLabRequest('${req.requestId}')">Delete</button>
          </div>
        </td>
      </tr>
    `;
  });
}

/* ---------- Lab Reports ---------- */
function setupLabReports() {
  document.getElementById("saveLabReportBtn")?.addEventListener("click", saveLabReport);
  document.getElementById("clearLabReportBtn")?.addEventListener("click", clearLabReportForm);
  document.getElementById("printLabReportBtn")?.addEventListener("click", printCurrentLabReport);
  document.getElementById("labReportSearchInput")?.addEventListener("input", renderLabReports);
}

function populateLabReportRequestSelect() {
  const requests = getLabRequests().filter((r) => r.status === "COMPLETED" || r.status === "IN_PROGRESS");
  const select = document.getElementById("labReportRequestSelect");
  if (!select) return;

  select.innerHTML = '<option value="">Select completed or in-progress request</option>';
  requests.forEach((req) => {
    select.innerHTML += `<option value="${req.requestId}">${req.requestId} - ${req.patientName} - ${req.testName}</option>`;
  });
}

function saveLabReport() {
  clearFieldErrors(["labReportRequestError", "labTechnicianError", "labResultTextError", "labNormalRangeError"]);

  const editingId = document.getElementById("editingLabReportId")?.value;
  const requestId = document.getElementById("labReportRequestSelect")?.value;
  const technician = document.getElementById("labTechnicianName")?.value.trim() || "";
  const resultText = document.getElementById("labResultText")?.value.trim() || "";
  const normalRange = document.getElementById("labNormalRange")?.value.trim() || "";
  const remarks = document.getElementById("labRemarks")?.value.trim() || "";

  let hasError = false;
  if (!requestId) { setText("labReportRequestError", "Select request."); hasError = true; }
  if (technician.length < 3) { setText("labTechnicianError", "Enter technician name (min 3 chars)."); hasError = true; }
  if (resultText.length < 3) { setText("labResultTextError", "Enter result summary (min 3 chars)."); hasError = true; }
  if (normalRange.length < 2) { setText("labNormalRangeError", "Enter normal range or unit."); hasError = true; }

  if (hasError) {
    setStatusMessage(document.getElementById("labReportMessageBox"), "Please fix lab report errors.", "error");
    return;
  }

  const req = getLabRequests().find((r) => r.requestId === requestId);
  if (!req) return;

  let reports = getLabReports();

  if (editingId) {
    const report = reports.find((r) => r.reportId === editingId);
    if (!report) return;

    report.requestId = requestId;
    report.patientName = req.patientName;
    report.testName = req.testName;
    report.technician = technician;
    report.resultText = resultText;
    report.normalRange = normalRange;
    report.remarks = remarks;
    report.status = "COMPLETED";
    report.updatedDate = formatDateTime();

    saveLabReports(reports);
    currentLabReportForPrint = report;
    setStatusMessage(document.getElementById("labReportMessageBox"), "Lab report updated.", "success");
  } else {
    const reportId = generateLabReportId();
    const report = {
      reportId,
      requestId,
      patientName: req.patientName,
      testName: req.testName,
      technician,
      resultText,
      normalRange,
      remarks,
      status: "COMPLETED",
      date: formatDateTime()
    };
    reports.push(report);
    saveLabReports(reports);
    currentLabReportForPrint = report;
    setStatusMessage(document.getElementById("labReportMessageBox"), `Lab report ${reportId} created.`, "success");
  }

  const requests = getLabRequests();
  const index = requests.findIndex((r) => r.requestId === requestId);
  if (index !== -1) {
    requests[index].status = "COMPLETED";
    saveLabRequests(requests);
  }

  clearLabReportForm(false);
  renderLabReports();
  renderLabRequests();
  populateLabReportRequestSelect();
}

function clearLabReportForm(resetMessage = true) {
  document.getElementById("labReportForm")?.reset();
  setValue("editingLabReportId", "");
  if (resetMessage) {
    setStatusMessage(document.getElementById("labReportMessageBox"), "Lab report form cleared.", "default");
  }
}

window.editLabReport = function (reportId) {
  const report = getLabReports().find((r) => r.reportId === reportId);
  if (!report) return;

  setValue("editingLabReportId", report.reportId);
  setValue("labReportRequestSelect", report.requestId);
  setValue("labTechnicianName", report.technician);
  setValue("labResultText", report.resultText);
  setValue("labNormalRange", report.normalRange);
  setValue("labRemarks", report.remarks || "");
  currentLabReportForPrint = report;
  setStatusMessage(document.getElementById("labReportMessageBox"), `Editing ${report.reportId}`, "warning");
};

window.deleteLabReport = function (reportId) {
  const ok = confirm("Delete this lab report?");
  if (!ok) return;

  let reports = getLabReports();
  reports = reports.filter((r) => r.reportId !== reportId);
  saveLabReports(reports);
  renderLabReports();
  setStatusMessage(document.getElementById("labReportMessageBox"), "Lab report deleted.", "success");
};

function renderLabReports() {
  const reports = getLabReports();
  const keyword = document.getElementById("labReportSearchInput")?.value.trim().toLowerCase() || "";
  const tbody = document.getElementById("labReportTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const filtered = reports.filter((report) =>
    (report.reportId || "").toLowerCase().includes(keyword) ||
    (report.requestId || "").toLowerCase().includes(keyword) ||
    (report.patientName || "").toLowerCase().includes(keyword)
  );

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#94a3b8;">No lab reports found.</td></tr>';
    return;
  }

  filtered.forEach((report) => {
    tbody.innerHTML += `
      <tr>
        <td>${report.reportId}</td>
        <td>${report.requestId}</td>
        <td>${report.patientName}</td>
        <td>${report.testName}</td>
        <td>${report.technician}</td>
        <td><span class="badge badge-completed">${report.status}</span></td>
        <td>
          <div class="row-actions">
            <button class="action-btn edit" onclick="editLabReport('${report.reportId}')">Edit</button>
            <button class="action-btn print" onclick="printLabReportById('${report.reportId}')">Print</button>
            <button class="action-btn delete" onclick="deleteLabReport('${report.reportId}')">Delete</button>
          </div>
        </td>
      </tr>
    `;
  });
}

function fillLabPrint(report) {
  setText("printLabReportId", report.reportId);
  setText("printLabRequestId", report.requestId);
  setText("printLabPatient", report.patientName);
  setText("printLabTest", report.testName);
  setText("printLabTechnician", report.technician);
  setText("printLabRemarks", report.remarks || "-");

  const tbody = document.getElementById("printLabResultBody");
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td>${report.resultText}</td>
        <td>${report.normalRange}</td>
      </tr>
    `;
  }
}

// FIX #5: setTimeout for lab report print too
window.printLabReportById = function (reportId) {
  const report = getLabReports().find((r) => r.reportId === reportId);
  if (!report) return;
  currentLabReportForPrint = report;
  fillLabPrint(report);
  const wrap = document.getElementById("labPrintWrap");
  if (wrap) wrap.style.display = "block";
  setTimeout(() => {
    window.print();
    setTimeout(() => { if (wrap) wrap.style.display = "none"; }, 500);
  }, 100);
};

function printCurrentLabReport() {
  if (!currentLabReportForPrint) {
    setStatusMessage(document.getElementById("labReportMessageBox"), "Save or edit a report first before printing.", "warning");
    return;
  }
  fillLabPrint(currentLabReportForPrint);
  const wrap = document.getElementById("labPrintWrap");
  if (wrap) wrap.style.display = "block";
  setTimeout(() => {
    window.print();
    setTimeout(() => { if (wrap) wrap.style.display = "none"; }, 500);
  }, 100);
}
