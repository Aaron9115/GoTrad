const express = require("express");
const {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  getUserStats,
  getUserActivity
} = require("../controllers/profileController");
const protect = require("../middleware/authMiddleware");
const { 
  uploadProfilePicture: uploadProfile, 
  handleProfileUploadError 
} = require("../middleware/profileMiddleware");

const router = express.Router();

// All profile routes are protected
router.use(protect);

// Get and update profile
router.route("/")
  .get(getProfile)
  .put(updateProfile);

// Upload profile picture
router.post(
  "/upload-picture", 
  uploadProfile.single("profileImage"), 
  handleProfileUploadError,
  uploadProfilePicture
);

// Get user statistics
router.get("/stats", getUserStats);

// Get user activity
router.get("/activity", getUserActivity);

module.exports = router;