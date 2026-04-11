const db = require("../config/db");

// Create invoice with items
const createInvoice = (req, res) => {
  const { patient_id, items } = req.body;

  const insertInvoiceSql = `
    INSERT INTO invoices (patient_id)
    VALUES (?)
  `;

  db.query(insertInvoiceSql, [patient_id], (err, invoiceResult) => {
    if (err) {
      return res.status(500).json({
        message: "Invoice error",
        error: err.message
      });
    }

    const invoice_id = invoiceResult.insertId;
    let totalAmount = 0;

    const insertItemPromises = items.map((item) => {
      return new Promise((resolve, reject) => {
        const getItemSql = `
          SELECT unit_price, item_type
          FROM items
          WHERE item_id = ?
        `;

        db.query(getItemSql, [item.item_id], (err, itemData) => {
          if (err) return reject(err);

          if (!itemData || itemData.length === 0) {
            return reject(new Error(`Item with ID ${item.item_id} not found`));
          }

          const price = Number(itemData[0].unit_price);
          const type = itemData[0].item_type;
          const total = price * Number(item.quantity);

          totalAmount += total;

          const insertItemSql = `
            INSERT INTO invoice_items
            (invoice_id, item_id, qty, unit_price, line_total)
            VALUES (?, ?, ?, ?, ?)
          `;

          db.query(
            insertItemSql,
            [
              invoice_id,
              item.item_id,
              item.quantity,
              price,
              total
            ],
            (err2) => {
              if (err2) return reject(err2);

              // Deduct stock only for medicines
              if (type === "MEDICINE") {
                const stockSql = `
                  UPDATE stock
                  SET quantity_available = quantity_available - ?
                  WHERE item_id = ?
                `;

                db.query(stockSql, [item.quantity, item.item_id], (stockErr) => {
                  if (stockErr) return reject(stockErr);
                  resolve();
                });
              } else {
                resolve();
              }
            }
          );
        });
      });
    });

    Promise.all(insertItemPromises)
      .then(() => {
        const updateTotalSql = `
          UPDATE invoices
          SET total_amount = ?
          WHERE invoice_id = ?
        `;

        db.query(updateTotalSql, [totalAmount, invoice_id], (updateErr) => {
          if (updateErr) {
            return res.status(500).json({
              message: "Invoice total update failed",
              error: updateErr.message
            });
          }

          res.json({
            message: "Invoice created successfully",
            invoice_id,
            total: totalAmount
          });
        });
      })
      .catch((error) => {
        res.status(500).json({
          message: "Error creating invoice",
          error: error.message
        });
      });
  });
};

// Get all invoices
const getInvoices = (req, res) => {
  const sql = `
    SELECT *
    FROM invoices
    ORDER BY invoice_id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Error",
        error: err.message
      });
    }

    res.json(results);
  });
};

module.exports = {
  createInvoice,
  getInvoices
};