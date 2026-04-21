const axios = require("axios");
const FormData = require("form-data");
const Dress = require("../models/Dress");

exports.recommendBySkinTone = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image required" });
    }

    console.log("=" .repeat(50));
    console.log("Processing skin tone recommendation...");
    
    const formData = new FormData();
    formData.append("image", req.file.buffer, {
      filename: "face.jpg",
      contentType: "image/jpeg",
    });

    console.log("Calling Flask API for skin tone detection...");
    const mlRes = await axios.post(
      "http://127.0.0.1:5001/predict-skin-tone",
      formData,
      { headers: formData.getHeaders() }
    );

    const skinTone = mlRes.data.skin_tone;
    console.log("Detected skin tone:", skinTone);

    const colorMap = {
      "Light": ["Red", "Maroon", "Pink", "Purple", "Blue", "Green", "Gold"],
      "Medium": ["Red", "Maroon", "Orange", "Yellow", "Green", "Blue", "Gold"],
      "Dark": ["Red", "Maroon", "Purple", "Blue", "Green", "Gold", "Silver"]
    };
    
    const recommendedColors = colorMap[skinTone] || ["Red", "Maroon", "Green", "Blue", "Gold"];
    console.log("Recommended colors:", recommendedColors);

    const categoryFilter = req.query.category;
    console.log("Category filter received:", categoryFilter || "No filter");

    // Build query with CASE-INSENSITIVE color matching
    
    let query = {
      available: true,
      $or: recommendedColors.map(color => ({
        color: { $regex: new RegExp(`^${color}$`, 'i') }
      }))
    };

    // Add category filter if provided (also case-insensitive)
    if (categoryFilter && categoryFilter !== 'all' && categoryFilter !== '') {
      query.category = { $regex: new RegExp(`^${categoryFilter}$`, 'i') };
      console.log("Applying category filter:", categoryFilter);
    }

    console.log("Final MongoDB query:", JSON.stringify(query, null, 2));

    const dresses = await Dress.find(query).limit(12);
    console.log(`Found ${dresses.length} matching dresses`);

    res.json({
      skinTone,
      recommendedColors,
      dresses
    });

  } catch (err) {
    console.error("Recommendation error:", err);
    
    if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        message: "Flask AI server is not running. Please start it on port 5001." 
      });
    }
    
    res.status(500).json({ message: "Recommendation failed: " + err.message });
  }
};