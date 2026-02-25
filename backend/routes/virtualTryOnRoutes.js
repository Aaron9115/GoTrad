const express = require("express");
const {
  processVirtualTryOn,
  checkServiceStatus
} = require("../controllers/virtualTryOnController");
const upload = require("../middleware/upload"); // Using your existing upload middleware

const router = express.Router();

// ============================================
// VIRTUAL TRY-ON ROUTES
// ============================================

// @route   POST /api/virtual-tryon
// @desc    Process virtual try-on with person and dress images
// @access  Public
router.post(
  "/",
  upload.fields([
    { name: "person_image", maxCount: 1 },
    { name: "dress_image", maxCount: 1 }
  ]),
  processVirtualTryOn
);

// @route   GET /api/virtual-tryon/status
// @desc    Check if ML service is available
// @access  Public
router.get("/status", checkServiceStatus);

module.exports = router;