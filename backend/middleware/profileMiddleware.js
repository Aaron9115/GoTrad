const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create uploads/profiles directory if it doesn't exist
const profilesDir = path.join(__dirname, "../uploads/profiles");
if (!fs.existsSync(profilesDir)) {
  fs.mkdirSync(profilesDir, { recursive: true });
  console.log("✅ Created uploads/profiles directory");
}

// Configure storage for profile pictures
const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/profiles/");
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const filename = "profile-" + uniqueSuffix + ext;
    console.log("📸 Saving profile image as:", filename);
    cb(null, filename);
  },
});

// File filter to only allow images
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  
  // Check file extension
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  // Check mime type
  const mimetype = allowedTypes.test(file.mimetype);

  console.log("📁 Uploading file:", {
    originalname: file.originalname,
    mimetype: file.mimetype,
    extname: path.extname(file.originalname),
    isValid: mimetype && extname
  });

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
  }
};

// Configure multer for profile picture uploads
const uploadProfilePicture = multer({
  storage: profileStorage,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: imageFilter,
});

// Error handling middleware for multer
const handleProfileUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ 
        message: "File too large. Maximum size is 5MB." 
      });
    }
    return res.status(400).json({ 
      message: `Upload error: ${err.message}` 
    });
  } else if (err) {
    // An unknown error occurred
    return res.status(400).json({ 
      message: err.message || "File upload failed" 
    });
  }
  next();
};

module.exports = {
  uploadProfilePicture,
  handleProfileUploadError
};