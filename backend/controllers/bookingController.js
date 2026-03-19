const Booking = require("../models/Booking");
const Dress = require("../models/Dress");
const User = require("../models/user");

// Create a new booking (pending approval)
const createBooking = async (req, res) => {
  try {
    const { dressId, startDate, endDate, address, city, phone, totalAmount, securityDeposit } = req.body;

    if (!dressId || !startDate || !endDate || !address || !city || !phone) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const dress = await Dress.findById(dressId);

    if (!dress || !dress.available) {
      return res.status(400).json({ message: "Dress not available" });
    }

    // Create booking with PENDING status
    const booking = await Booking.create({
      renter: req.user._id,
      dress: dressId,
      startDate,
      endDate,
      deliveryAddress: {
        address,
        city,
        phone
      },
      totalAmount: totalAmount || 0,
      securityDeposit: securityDeposit || 1000,
      status: "pending",
      paymentStatus: "pending"
    });

    res.status(201).json({
      message: "Booking request sent to owner. Awaiting confirmation.",
      booking
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all bookings of logged-in user (renter)
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ renter: req.user._id })
      .populate("dress")
      .populate({
        path: "renter",
        select: "name email phone address city bankDetails digitalWallet preferredRefundMethod"
      });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Owner: get all bookings of their dresses
const getOwnerBookings = async (req, res) => {
  try {
    // Find dresses of this owner
    const dresses = await Dress.find({ owner: req.user._id });
    const dressIds = dresses.map(d => d._id);

    const bookings = await Booking.find({ dress: { $in: dressIds } })
      .populate("dress")
      .populate({
        path: "renter",
        select: "name email phone address city bankDetails digitalWallet preferredRefundMethod"
      })
      .sort("-createdAt");

    res.json(bookings);
  } catch (error) {
    console.error("Error fetching owner bookings:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get pending bookings for owner (for the dashboard tab)
const getOwnerPendingBookings = async (req, res) => {
  try {
    // Find dresses of this owner
    const dresses = await Dress.find({ owner: req.user._id });
    const dressIds = dresses.map(d => d._id);

    const bookings = await Booking.find({ 
      dress: { $in: dressIds },
      status: "pending"
    })
      .populate("dress")
      .populate({
        path: "renter",
        select: "name email phone address city bankDetails digitalWallet preferredRefundMethod"
      })
      .sort("-createdAt");
    
    res.json(bookings);
  } catch (error) {
    console.error("Error fetching pending bookings:", error);
    res.status(500).json({ message: error.message });
  }
};

// Owner confirms booking
const confirmBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("dress");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if the logged-in user owns this dress
    if (booking.dress.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Update booking status
    booking.status = "confirmed";
    await booking.save();

    // Mark dress as unavailable
    const dress = await Dress.findById(booking.dress._id);
    if (dress) {
      dress.available = false;
      await dress.save();
    }

    res.json({ message: "Booking confirmed successfully", booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Owner rejects booking
const rejectBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("dress");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if the logged-in user owns this dress
    if (booking.dress.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Update booking status
    booking.status = "rejected";
    await booking.save();

    res.json({ message: "Booking rejected", booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cancel booking (renter only)
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Only renter can cancel
    if (booking.renter.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Check if booking is already cancelled
    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "Booking is already cancelled" });
    }

    // Check if booking can be cancelled
    if (!booking.canBeCancelled()) {
      return res.status(400).json({ message: "Booking cannot be cancelled at this stage" });
    }

    // Store the previous status BEFORE changing it
    const wasConfirmed = booking.status === "confirmed";

    // Update booking status
    booking.status = "cancelled";
    await booking.save();

    // If it was confirmed, make dress available again
    if (wasConfirmed) {
      const dress = await Dress.findById(booking.dress);
      if (dress) {
        dress.available = true;
        await dress.save();
      }
    }

    res.json({ message: "Booking cancelled successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete booking (renter only) - for cancelled or completed bookings
const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Only renter can delete their own bookings
    if (booking.renter.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Only allow deletion of cancelled or returned bookings
    if (booking.status !== "cancelled" && booking.status !== "returned") {
      return res.status(400).json({ 
        message: "Only cancelled or returned bookings can be deleted" 
      });
    }

    // Delete the booking
    await booking.deleteOne();

    res.json({ message: "Booking deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getOwnerBookings,
  getOwnerPendingBookings,
  confirmBooking,
  rejectBooking,
  cancelBooking,
  deleteBooking
};