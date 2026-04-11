const db = require("../config/db");

const createPayment = (req, res) => {
  const { invoice_id, method, amount } = req.body;

  // Check invoice exists
  const getInvoiceSql = `SELECT * FROM invoices WHERE invoice_id = ?`;

  db.query(getInvoiceSql, [invoice_id], (err, invoiceResults) => {
    if (err) {
      return res.status(500).json({ message: "Database error", error: err.message });
    }

    if (invoiceResults.length === 0) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const invoice = invoiceResults[0];

    // Insert payment
    const insertSql = `
      INSERT INTO payments (invoice_id, amount, method, status)
      VALUES (?, ?, ?, 'SUCCESS')
    `;

    db.query(insertSql, [invoice_id, amount, method], (err2, result) => {
      if (err2) {
        return res.status(500).json({ message: "Payment error", error: err2.message });
      }

      // Calculate total paid
      const sumSql = `
        SELECT SUM(amount) AS paid FROM payments WHERE invoice_id = ?
      `;

      db.query(sumSql, [invoice_id], (err3, sumResult) => {
        if (err3) {
          return res.status(500).json({ message: "Sum error", error: err3.message });
        }

        const paid = Number(sumResult[0].paid || 0);
        const total = Number(invoice.total_amount);

        let status = "PENDING";

        if (paid >= total) status = "PAID";
        else if (paid > 0) status = "PARTIAL";

        const updateSql = `
          UPDATE invoices SET status = ? WHERE invoice_id = ?
        `;

        db.query(updateSql, [status, invoice_id], (err4) => {
          if (err4) {
            return res.status(500).json({ message: "Update error", error: err4.message });
          }

          res.json({
            message: "Payment successful",
            invoice_id,
            paid,
            invoice_status: status
          });
        });
      });
    });
  });
};

const getPayments = (req, res) => {
  db.query("SELECT * FROM payments ORDER BY payment_id DESC", (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Error", error: err.message });
    }

    res.json(results);
  });
};

module.exports = {
  createPayment,
  getPayments
};