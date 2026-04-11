const express = require("express");
const router = express.Router();

const {
  getItems,
  getItemsByType,
  createItem,
  stockIn
} = require("../controllers/itemController");

router.get("/", getItems);
router.get("/type/:type", getItemsByType);
router.post("/", createItem);
router.post("/stock-in", stockIn);

module.exports = router;