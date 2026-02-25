const axios = require("axios");
const FormData = require("form-data");

// @desc    Process virtual try-on
// @route   POST /api/virtual-tryon
// @access  Public
const processVirtualTryOn = async (req, res) => {
  try {
    // Check if both images are provided
    if (!req.files || !req.files.person_image || !req.files.dress_image) {
      return res.status(400).json({ 
        message: "Both person image and dress image are required" 
      });
    }

    const personImage = req.files.person_image[0]; // Get first file from array
    const dressImage = req.files.dress_image[0];

    // Create form data to send to Flask ML service
    const formData = new FormData();
    
    // Append person image
    formData.append("person_image", personImage.buffer, {
      filename: personImage.originalname,
      contentType: personImage.mimetype
    });

    // Append dress image
    formData.append("dress_image", dressImage.buffer, {
      filename: dressImage.originalname,
      contentType: dressImage.mimetype
    });

    // Send to Flask ML service
    const mlResponse = await axios.post(
      "http://localhost:5001/virtual-tryon",
      formData,
      { 
        headers: {
          ...formData.getHeaders(),
          'Content-Length': formData.getLengthSync()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 30000 // 30 second timeout for ML processing
      }
    );

    // Return the result from ML service
    res.json({
      message: "Virtual try-on processed successfully",
      result: mlResponse.data
    });

  } catch (error) {
    console.error("Virtual try-on error:", error);
    
    // Handle specific error cases
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        message: "ML service is not available. Please make sure the Flask server is running on port 5001." 
      });
    }
    
    if (error.response) {
      // The request was made and the server responded with a status code
      return res.status(error.response.status).json({ 
        message: error.response.data.error || "ML processing failed",
        details: error.response.data
      });
    }
    
    res.status(500).json({ 
      message: "Failed to process virtual try-on",
      error: error.message 
    });
  }
};

// @desc    Check virtual try-on service status
// @route   GET /api/virtual-tryon/status
// @access  Public
const checkServiceStatus = async (req, res) => {
  try {
    const response = await axios.get("http://localhost:5001/health", { timeout: 2000 });
    
    res.json({
      status: "available",
      ml_service: response.data
    });
  } catch (error) {
    res.json({
      status: "unavailable",
      message: "ML service is not running",
      details: error.message
    });
  }
};

module.exports = {
  processVirtualTryOn,
  checkServiceStatus
};