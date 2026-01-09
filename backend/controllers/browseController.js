const Dress = require("../models/Dress");

// Get all available dresses
const getAllDresses = async (req, res) => {
  try {
    const dresses = await Dress.find({ available: true }).populate(
      "owner",
      "name email"
    );
    res.json(dresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get dresses by filter: size, color, category
const getFilteredDresses = async (req, res) => {
  try {
    const { size, color, category } = req.query; // coming from URL query

    let filter = { available: true };

    if (size) filter.size = size;
    if (color) filter.color = color;
    if (category) filter.category = category;

    const dresses = await Dress.find(filter).populate("owner", "name email");
    res.json(dresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAllDresses, getFilteredDresses };
