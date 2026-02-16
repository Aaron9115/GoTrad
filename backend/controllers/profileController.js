const User = require("../models/user");
const Booking = require("../models/Booking");
const Dress = require("../models/Dress");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    user.address = req.body.address || user.address;
    user.bio = req.body.bio || user.bio;
    user.profileImage = req.body.profileImage || user.profileImage;

    // If password is being updated
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }

    const updatedUser = await user.save();
    
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      phone: updatedUser.phone,
      address: updatedUser.address,
      bio: updatedUser.bio,
      profileImage: updatedUser.profileImage,
      createdAt: updatedUser.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload profile picture
// @route   POST /api/profile/upload-picture
// @access  Private
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete old profile picture if it exists and is not the default
    if (user.profileImage && 
        !user.profileImage.includes("placeholder") && 
        !user.profileImage.includes("via.placeholder.com")) {
      const oldImagePath = path.join(__dirname, "..", user.profileImage);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
        console.log("🗑️ Deleted old profile image:", user.profileImage);
      }
    }

    // Update user with new profile image path
    const imageUrl = `/uploads/profiles/${req.file.filename}`;
    user.profileImage = imageUrl;
    await user.save();

    console.log("✅ Profile picture uploaded for user:", user.email);
    console.log("📸 Image URL:", imageUrl);

    res.json({ 
      message: "Profile picture uploaded successfully",
      profileImage: imageUrl 
    });
  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user statistics
// @route   GET /api/profile/stats
// @access  Private
const getUserStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let stats = {};

    if (userRole === "renter") {
      const totalBookings = await Booking.countDocuments({ renter: userId });
      const activeBookings = await Booking.countDocuments({ 
        renter: userId, 
        status: "booked" 
      });
      const completedBookings = await Booking.countDocuments({ 
        renter: userId, 
        status: "returned" 
      });
      const cancelledBookings = await Booking.countDocuments({ 
        renter: userId, 
        status: "cancelled" 
      });

      stats = {
        totalBookings,
        activeBookings,
        completedBookings,
        cancelledBookings
      };
    } else if (userRole === "owner") {
      const totalDresses = await Dress.countDocuments({ owner: userId });
      const availableDresses = await Dress.countDocuments({ 
        owner: userId, 
        available: true 
      });
      const rentedDresses = await Dress.countDocuments({ 
        owner: userId, 
        available: false 
      });
      
      const userDresses = await Dress.find({ owner: userId }).select("_id");
      const dressIds = userDresses.map(d => d._id);
      
      const totalBookings = await Booking.countDocuments({ 
        dress: { $in: dressIds } 
      });
      const activeBookings = await Booking.countDocuments({ 
        dress: { $in: dressIds },
        status: "booked" 
      });

      stats = {
        totalDresses,
        availableDresses,
        rentedDresses,
        totalBookings,
        activeBookings
      };
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's recent activity
// @route   GET /api/profile/activity
// @access  Private
const getUserActivity = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let activity = [];

    if (userRole === "renter") {
      const recentBookings = await Booking.find({ renter: userId })
        .populate("dress", "name image category")
        .sort("-createdAt")
        .limit(5);

      activity = recentBookings.map(booking => ({
        type: "booking",
        action: `Booked ${booking.dress?.name || "a dress"}`,
        date: booking.createdAt,
        status: booking.status
      }));
    } else if (userRole === "owner") {
      const recentDresses = await Dress.find({ owner: userId })
        .sort("-createdAt")
        .limit(5);

      const recentBookings = await Booking.find({ dress: { $in: recentDresses.map(d => d._id) } })
        .populate("renter", "name")
        .populate("dress", "name")
        .sort("-createdAt")
        .limit(5);

      activity = [
        ...recentDresses.map(dress => ({
          type: "dress",
          action: `Added new dress: ${dress.name}`,
          date: dress.createdAt
        })),
        ...recentBookings.map(booking => ({
          type: "booking",
          action: `${booking.renter?.name || "Someone"} booked ${booking.dress?.name || "your dress"}`,
          date: booking.createdAt,
          status: booking.status
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    }

    res.json(activity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//EXPORT ALL FUNCTIONS - INCLUDING THE NEW ONE
module.exports = {
  getProfile,
  updateProfile,
  uploadProfilePicture, 
  getUserStats,
  getUserActivity
};