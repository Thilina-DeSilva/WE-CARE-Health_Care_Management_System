const db = require("../config/db");

// Get all active items (medicines + lab tests + services)
const getItems = (req, res) => {
  const sql = `
    SELECT 
      i.item_id,
      i.item_name,
      i.item_type,
      i.unit_price,
      i.status,
      s.quantity_available,
      s.reorder_level
    FROM items i
    LEFT JOIN stock s ON i.item_id = s.item_id
    WHERE i.status = 'ACTIVE'
    ORDER BY i.item_type, i.item_name
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Database error",
        error: err.message
      });
    }

    res.json(results);
  });
};

// Optional: get items by type
const getItemsByType = (req, res) => {
  const { type } = req.params;

  const sql = `
    SELECT 
      i.item_id,
      i.item_name,
      i.item_type,
      i.unit_price,
      i.status,
      s.quantity_available,
      s.reorder_level
    FROM items i
    LEFT JOIN stock s ON i.item_id = s.item_id
    WHERE i.status = 'ACTIVE' AND i.item_type = ?
    ORDER BY i.item_name
  `;

  db.query(sql, [type], (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Database error",
        error: err.message
      });
    }

    res.json(results);
  });
};

// Add new item (medicine / lab test / service)
const createItem = (req, res) => {
  const { item_name, item_type, unit_price } = req.body;

  const sql = `
    INSERT INTO items (item_name, item_type, unit_price, status)
    VALUES (?, ?, ?, 'ACTIVE')
  `;

  db.query(sql, [item_name, item_type, unit_price], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Database error",
        error: err.message
      });
    }

    // if medicine, create stock row automatically
    if (item_type === "MEDICINE") {
      const stockSql = `
        INSERT INTO stock (item_id, quantity_available, reorder_level)
        VALUES (?, 0, 10)
      `;

      db.query(stockSql, [result.insertId], (stockErr) => {
        if (stockErr) {
          return res.status(500).json({
            message: "Item created but stock row failed",
            error: stockErr.message
          });
        }

        return res.status(201).json({
          message: "Medicine item created successfully",
          item_id: result.insertId
        });
      });
    } else {
      return res.status(201).json({
        message: "Item created successfully",
        item_id: result.insertId
      });
    }
  });
};

// Stock in for medicines
const stockIn = (req, res) => {
  const { item_id, qty } = req.body;

  const sql = `
    UPDATE stock
    SET quantity_available = quantity_available + ?
    WHERE item_id = ?
  `;

  db.query(sql, [qty, item_id], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Database error",
        error: err.message
      });
    }

    res.json({
      message: "Stock updated successfully"
    });
  });
};

module.exports = {
  getItems,
  getItemsByType,
  createItem,
  stockIn
};