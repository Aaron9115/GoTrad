const axios = require("axios");
const FormData = require("form-data");
const Dress = require("../models/Dress");

exports.recommendBySkinTone = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image required" });
    }

    console.log("Processing skin tone recommendation...");
    
    const formData = new FormData();
    formData.append("image", req.file.buffer, {
      filename: "face.jpg",
      contentType: "image/jpeg",
    });

    // Call Flask API for skin tone detection
    console.log("Calling Flask API for skin tone detection...");
    const mlRes = await axios.post(
      "http://127.0.0.1:5001/predict-skin-tone",
      formData,
      { headers: formData.getHeaders() }
    );

    const skinTone = mlRes.data.skin_tone;
    console.log("Detected skin tone:", skinTone);

    // color recommendations for traditional dresses
    const colorMap = {
      "Light": ["Red", "Maroon", "Pink", "Purple", "Blue", "Green", "Gold"],
      "Medium": ["Red", "Maroon", "Orange", "Yellow", "Green", "Blue", "Gold"],
      "Dark": ["Red", "Maroon", "Purple", "Blue", "Green", "Gold", "Silver"]
    };
    
    const recommendedColors = colorMap[skinTone] || ["Red", "Maroon", "Green", "Blue", "Gold"];
    console.log("Recommended colors:", recommendedColors);

    // Find dresses with colors that match recommendations
    const dresses = await Dress.find({
      color: { $in: recommendedColors },
      available: true
    }).limit(12);

    console.log(`Found ${dresses.length} matching dresses`);

    res.json({
      skinTone,
      recommendedColors,
      dresses
    });

  } catch (err) {
    console.error("Recommendation error:", err);
    res.status(500).json({ message: "Recommendation failed" });
  }
};