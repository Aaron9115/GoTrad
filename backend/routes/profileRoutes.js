const express = require("express");
const {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  uploadQRCode,
  getUserStats,
  getUserActivity
} = require("../controllers/profileController");
const protect = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Create upload directories if they don't exist
const profilesDir = path.join(__dirname, "../uploads/profiles");
const qrCodesDir = path.join(__dirname, "../uploads/qrcodes");

if (!fs.existsSync(profilesDir)) {
  fs.mkdirSync(profilesDir, { recursive: true });
  console.log("Created profiles directory");
}

if (!fs.existsSync(qrCodesDir)) {
  fs.mkdirSync(qrCodesDir, { recursive: true });
  console.log("Created QR codes directory");
}

// Configure storage for profile pictures
const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, profilesDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "profile-" + uniqueSuffix + ext);
  }
});

// Configure storage for QR codes
const qrStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, qrCodesDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "qr-" + uniqueSuffix + ext);
  }
});

// File filter for images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (JPEG, PNG, GIF, WEBP)"));
  }
};

// Create multer upload instances
const uploadProfilePicture = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

const uploadQRCode = multer({
  storage: qrStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: fileFilter
});

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File too large. Maximum size is 5MB." });
    }
    return res.status(400).json({ message: err.message });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

// All profile routes are protected
router.use(protect);

// Get and update profile
router.route("/")
  .get(getProfile)
  .put(updateProfile);

// Upload profile picture
router.post(
  "/upload-picture", 
  uploadProfilePicture.single("profileImage"), 
  handleUploadError,
  uploadProfilePicture
);

// Upload QR code for digital wallet
router.post(
  "/upload-qr", 
  uploadQRCode.single("qrCode"), 
  handleUploadError,
  uploadQRCode
);

// Get user statistics
router.get("/stats", getUserStats);

// Get user activity
router.get("/activity", getUserActivity);

module.exports = router;