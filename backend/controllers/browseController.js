const Dress = require("../models/Dress");

// Get all available dresses (no filters)
const getAllDresses = async (req, res) => {
  try {
    const dresses = await Dress.find({ available: true }).populate(
      "owner",
      "name email"
    );
    res.json(dresses);
  } catch (error) {
    console.error("Get all dresses error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get dresses by filter: size, color, category (supports query params)
const getFilteredDresses = async (req, res) => {
  try {
    // Get filter parameters from URL query
    const { size, color, category } = req.query;
    
    // Build filter object - only show available dresses
    let filter = { available: true };
    
    // Add filters if they exist (case-insensitive)
    if (size && size !== "") {
      filter.size = { $regex: new RegExp(`^${size}$`, 'i') };
    }
    
    if (color && color !== "") {
      filter.color = { $regex: new RegExp(`^${color}$`, 'i') };
    }
    
    if (category && category !== "" && category !== "all") {
      filter.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }
    
    console.log("Applied filters:", filter); // Debug log
    
    // Find dresses with filters
    const dresses = await Dress.find(filter)
      .populate("owner", "name email")
      .sort("-createdAt"); // Newest first
    
    res.json(dresses);
    
  } catch (error) {
    console.error("Filter dresses error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAllDresses, getFilteredDresses };