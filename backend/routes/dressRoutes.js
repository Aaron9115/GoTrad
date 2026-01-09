const express = require("express");
const { addDress, getDresses } = require("../controllers/dressController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Only logged-in users can add dress
router.post("/add", protect, addDress);

// Get all dresses
router.get("/", getDresses);

module.exports = router;
