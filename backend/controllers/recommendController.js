const axios = require("axios");
const FormData = require("form-data");
const Dress = require("../models/Dress");

exports.recommendBySkinTone = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image required" });
    }

    const formData = new FormData();
    formData.append("image", req.file.buffer, {
      filename: "face.jpg",
      contentType: "image/jpeg",
    });

    const mlRes = await axios.post(
      "http://127.0.0.1:5001/predict-skin-tone",
      formData,
      { headers: formData.getHeaders() }
    );

    const skinTone = mlRes.data.skin_tone;

    const dresses = await Dress.find({
      recommendedFor: skinTone,
    });

    res.json({
      skinTone,
      dresses,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Recommendation failed" });
  }
};

