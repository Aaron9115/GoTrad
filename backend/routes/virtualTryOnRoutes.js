const express = require("express");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");

const router = express.Router();

// Configure multer for file uploads (store in memory for processing)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

// Virtual try-on endpoint
router.post("/", upload.fields([
  { name: "person_image", maxCount: 1 },
  { name: "dress_image", maxCount: 1 }
]), async (req, res) => {
  try {
    // Check if both images are provided
    if (!req.files || !req.files.person_image || !req.files.dress_image) {
      return res.status(400).json({ 
        error: "Both person image and dress image are required" 
      });
    }

    const personImage = req.files.person_image[0];
    const dressImage = req.files.dress_image[0];

    console.log("Received images:");
    console.log("- Person image:", personImage.originalname, personImage.size, "bytes");
    console.log("- Dress image:", dressImage.originalname, dressImage.size, "bytes");

    // Create form data to send to Flask ML service
    const formData = new FormData();
    
    formData.append("person_image", personImage.buffer, {
      filename: personImage.originalname,
      contentType: personImage.mimetype
    });

    formData.append("dress_image", dressImage.buffer, {
      filename: dressImage.originalname,
      contentType: dressImage.mimetype
    });

    console.log("Sending to Flask ML service at http://localhost:5001/virtual-tryon");

    // Send to Flask ML service
    const mlResponse = await axios.post(
      "http://localhost:5001/virtual-tryon",
      formData,
      { 
        headers: formData.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 30000 // 30 second timeout
      }
    );

    console.log("Flask response received successfully");

    // Return the result from ML service
    res.json({
      success: true,
      result_image: mlResponse.data.result_image
    });

  } catch (error) {
    console.error("Virtual try-on error:", error);
    
    // Handle specific error cases
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: "ML service is not available. Please make sure the Flask server is running on port 5001." 
      });
    }
    
    if (error.response) {
      return res.status(error.response.status).json({ 
        error: error.response.data.error || "ML processing failed" 
      });
    }
    
    res.status(500).json({ 
      error: "Failed to process virtual try-on",
      details: error.message 
    });
  }
});

// Check service status
router.get("/status", async (req, res) => {
  try {
    const response = await axios.get("http://localhost:5001/health", { timeout: 2000 });
    res.json({
      status: "available",
      ml_service: response.data
    });
  } catch (error) {
    res.json({
      status: "unavailable",
      message: "ML service is not running"
    });
  }
});

module.exports = router;