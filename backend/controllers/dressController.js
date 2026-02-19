const Dress = require("../models/Dress");

// ============================================
// ADD NEW DRESS - FOR OWNERS ONLY
// ============================================
const addDress = async (req, res) => {
  try {
    // Get dress details from the form
    const { name, size, color, category, price, image, description } = req.body;

    // Check if required fields are filled
    if (!name || !size || !color || !category || !price) {
      return res.status(400).json({ 
        message: "Please provide name, size, color, category and price" 
      });
    }

    // Create new dress in database
    const dress = await Dress.create({
      owner: req.user._id,
      name,
      size,
      color,
      category,
      price,
      image: image || "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80",
      description: description || `${category} - ${color} traditional dress`,
      available: true
    });

    // Send success response
    res.status(201).json({
      message: "Dress added successfully",
      dress
    });

  } catch (error) {
    console.error("Add dress error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// GET ALL DRESSES - PUBLIC
// ============================================
const getDresses = async (req, res) => {
  try {
    // Get all dresses from database, newest first
    const dresses = await Dress.find()
      .populate("owner", "name email")
      .sort("-createdAt");

    res.json(dresses);

  } catch (error) {
    console.error("Get dresses error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// GET MY DRESSES - OWNER ONLY
// ============================================
const getMyDresses = async (req, res) => {
  try {
    // Check if user exists
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Find dresses where owner ID matches logged in user
    const dresses = await Dress.find({ owner: req.user._id })
      .sort("-createdAt");

    res.json(dresses);

  } catch (error) {
    console.error("Get my dresses error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// GET SINGLE DRESS BY ID - PUBLIC
// ============================================
const getDressById = async (req, res) => {
  try {
    // Find dress by ID from URL
    const dress = await Dress.findById(req.params.id)
      .populate("owner", "name email phone");

    // If dress not found
    if (!dress) {
      return res.status(404).json({ message: "Dress not found" });
    }

    res.json(dress);

  } catch (error) {
    console.error("Get dress by ID error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// UPDATE DRESS - OWNER ONLY
// ============================================
const updateDress = async (req, res) => {
  try {
    // Find the dress to update
    const dress = await Dress.findById(req.params.id);

    // Check if dress exists
    if (!dress) {
      return res.status(404).json({ message: "Dress not found" });
    }

    // Check if user owns this dress
    if (dress.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ 
        message: "Not authorized to update this dress" 
      });
    }

    // Get updated details from frontend
    const { name, size, color, category, price, image, description, available } = req.body;

    // Update only the fields that were sent
    dress.name = name || dress.name;
    dress.size = size || dress.size;
    dress.color = color || dress.color;
    dress.category = category || dress.category;
    dress.price = price || dress.price;
    dress.image = image || dress.image;
    dress.description = description || dress.description;
    
    if (available !== undefined) {
      dress.available = available;
    }

    // Save changes
    const updatedDress = await dress.save();

    res.json({
      message: "Dress updated successfully",
      dress: updatedDress
    });

  } catch (error) {
    console.error("Update dress error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// DELETE DRESS - OWNER ONLY
// ============================================
const deleteDress = async (req, res) => {
  try {
    // Find the dress to delete
    const dress = await Dress.findById(req.params.id);

    // Check if dress exists
    if (!dress) {
      return res.status(404).json({ message: "Dress not found" });
    }

    // Check if user owns this dress
    if (dress.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ 
        message: "Not authorized to delete this dress" 
      });
    }

    // Delete from database
    await dress.deleteOne();

    res.json({ message: "Dress deleted successfully" });

  } catch (error) {
    console.error("Delete dress error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// TOGGLE AVAILABILITY - OWNER ONLY
// ============================================
const toggleAvailability = async (req, res) => {
  try {
    // Find the dress
    const dress = await Dress.findById(req.params.id);

    if (!dress) {
      return res.status(404).json({ message: "Dress not found" });
    }

    // Check if user owns this dress
    if (dress.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ 
        message: "Not authorized to toggle this dress" 
      });
    }

    // Flip the available status
    dress.available = !dress.available;
    await dress.save();

    res.json({
      message: `Dress is now ${dress.available ? 'available' : 'rented'}`,
      available: dress.available
    });

  } catch (error) {
    console.error("Toggle availability error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================
module.exports = {
  addDress,
  getDresses,
  getMyDresses,
  getDressById,
  updateDress,
  deleteDress,
  toggleAvailability
};