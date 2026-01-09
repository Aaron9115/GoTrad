const Dress = require("../models/Dress");

// Add new dress (Owner Only)
const addDress = async (req, res) => {
  try {
    const { name, size, color, category, price, image } = req.body;

    if (!name || !size || !color || !category || !price) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const dress = await Dress.create({
      owner: req.user._id, // from authMiddleware
      name,
      size,
      color,
      category,
      price,
      image
    });

    res.status(201).json(dress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all dresses 
const getDresses = async (req, res) => {
  try {
    const dresses = await Dress.find().populate("owner", "name email");
    res.json(dresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addDress, getDresses };
