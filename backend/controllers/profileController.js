const User = require("../models/user");
const Booking = require("../models/Booking");
const Dress = require("../models/Dress");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

// Helper function to validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

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

    // EMAIL VALIDATION - ONLY FROM BACKEND
    if (req.body.email && req.body.email !== user.email) {
      // Validate email format
      if (!isValidEmail(req.body.email)) {
        return res.status(400).json({ 
          message: "Please enter a valid email address (e.g., name@example.com)" 
        });
      }
      
      // Check if email already exists in database
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({ 
          message: "Email already exists. Please use a different email address." 
        });
      }
      
      user.email = req.body.email;
    }

    // Update basic fields
    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;
    user.address = req.body.address || user.address;
    user.city = req.body.city || user.city;
    user.bio = req.body.bio || user.bio;
    user.profileImage = req.body.profileImage || user.profileImage;

    // Update bank details if provided
    if (req.body.bankDetails) {
      if (typeof req.body.bankDetails === 'string') {
        try {
          user.bankDetails = JSON.parse(req.body.bankDetails);
        } catch (e) {
          console.error("Error parsing bank details:", e);
        }
      } else {
        user.bankDetails = {
          accountHolder: req.body.bankDetails.accountHolder || user.bankDetails?.accountHolder || "",
          bankName: req.body.bankDetails.bankName || user.bankDetails?.bankName || "",
          accountNumber: req.body.bankDetails.accountNumber || user.bankDetails?.accountNumber || "",
          ifscCode: req.body.bankDetails.ifscCode || user.bankDetails?.ifscCode || ""
        };
      }
    }

    // Update digital wallet details if provided
    if (req.body.digitalWallet) {
      if (typeof req.body.digitalWallet === 'string') {
        try {
          user.digitalWallet = JSON.parse(req.body.digitalWallet);
        } catch (e) {
          console.error("Error parsing digital wallet:", e);
        }
      } else {
        user.digitalWallet = {
          provider: req.body.digitalWallet.provider || user.digitalWallet?.provider || "",
          phoneNumber: req.body.digitalWallet.phoneNumber || user.digitalWallet?.phoneNumber || "",
          qrCode: req.body.digitalWallet.qrCode || user.digitalWallet?.qrCode || ""
        };
      }
    }

    // Update preferred refund method
    if (req.body.preferredRefundMethod) {
      user.preferredRefundMethod = req.body.preferredRefundMethod;
    }

    // If password is being updated
    if (req.body.password) {
      if (req.body.password.length < 6) {
        return res.status(400).json({ 
          message: "Password must be at least 6 characters long" 
        });
      }
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
      city: updatedUser.city,
      bio: updatedUser.bio,
      profileImage: updatedUser.profileImage,
      bankDetails: updatedUser.bankDetails,
      digitalWallet: updatedUser.digitalWallet,
      preferredRefundMethod: updatedUser.preferredRefundMethod,
      createdAt: updatedUser.createdAt
    });
  } catch (error) {
    console.error("Update profile error:", error);
    if (error.code === 11000 && error.keyPattern?.email) {
      return res.status(400).json({ 
        message: "Email already exists. Please use a different email address." 
      });
    }
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

    if (user.profileImage && 
        !user.profileImage.includes("placeholder") && 
        !user.profileImage.includes("via.placeholder.com")) {
      const oldImagePath = path.join(__dirname, "..", user.profileImage);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
        console.log("Deleted old profile image:", user.profileImage);
      }
    }

    const imageUrl = `/uploads/profiles/${req.file.filename}`;
    user.profileImage = imageUrl;
    await user.save();

    console.log("Profile picture uploaded for user:", user.email);

    res.json({ 
      message: "Profile picture uploaded successfully",
      profileImage: imageUrl 
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload QR code for digital wallet
// @route   POST /api/profile/upload-qr
// @access  Private
const uploadQRCode = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.digitalWallet?.qrCode) {
      const oldQrPath = path.join(__dirname, "..", user.digitalWallet.qrCode);
      if (fs.existsSync(oldQrPath)) {
        fs.unlinkSync(oldQrPath);
        console.log("Deleted old QR code:", user.digitalWallet.qrCode);
      }
    }

    const qrUrl = `/uploads/qrcodes/${req.file.filename}`;
    
    if (!user.digitalWallet) {
      user.digitalWallet = {};
    }
    user.digitalWallet.qrCode = qrUrl;
    await user.save();

    console.log("QR code uploaded for user:", user.email);

    res.json({ 
      message: "QR code uploaded successfully",
      qrCode: qrUrl 
    });
  } catch (error) {
    console.error("QR upload error:", error);
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

module.exports = {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  uploadQRCode,
  getUserStats,
  getUserActivity
};