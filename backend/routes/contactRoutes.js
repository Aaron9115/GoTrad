const express = require("express");
const {
  submitContact,
  getContactSubmissions,
  updateContactStatus
} = require("../controllers/contactController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Public route - submit contact form
router.post("/", submitContact);

// Admin routes - protected
router.get("/admin", protect, getContactSubmissions);
router.put("/admin/:id", protect, updateContactStatus);

module.exports = router;