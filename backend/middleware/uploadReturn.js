const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create uploads/returns directory if it doesn't exist
const returnsDir = path.join(__dirname, "../uploads/returns");
if (!fs.existsSync(returnsDir)) {
  fs.mkdirSync(returnsDir, { recursive: true });
  console.log("✅ Created uploads/returns directory");
}

// Configure storage for return photos (saves to disk)
const returnStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/returns/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "return-" + uniqueSuffix + ext);
  },
});

// File filter for images only
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
  }
};

// Multer config for return photos (multiple files, up to 10MB each)
const uploadReturnPhotos = multer({
  storage: returnStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit per file
  fileFilter: imageFilter,
});

module.exports = uploadReturnPhotos;