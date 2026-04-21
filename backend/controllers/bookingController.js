const Booking = require("../models/Booking");
const Dress = require("../models/Dress");
const User = require("../models/user");

// Create a new booking (pending approval)
const createBooking = async (req, res) => {
  try {
    const { 
      dressId, 
      startDate, 
      endDate, 
      address, 
      city, 
      phone, 
      totalAmount, 
      securityDeposit,
      refundDetails,
      deliveryMethod,
      deliveryFee,
      agreedToTerms,
      agreedToDigitalAgreement
    } = req.body;

    if (!dressId || !startDate || !endDate || !address || !city || !phone) {
      return res.status(400).json({ message: "All fields are required" });
    }

    let finalDeliveryMethod = deliveryMethod || "pickup";
    if (finalDeliveryMethod !== "pickup" && finalDeliveryMethod !== "delivery") {
      return res.status(400).json({ message: "Delivery method must be 'pickup' or 'delivery'" });
    }

    if (!agreedToTerms) {
      return res.status(400).json({ message: "You must agree to the terms and conditions" });
    }

    if (!agreedToDigitalAgreement) {
      return res.status(400).json({ message: "You must agree to the digital rental agreement" });
    }

    const dress = await Dress.findById(dressId);

    if (!dress || !dress.available) {
      return res.status(400).json({ message: "Dress not available" });
    }

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
      deliveryMethod: finalDeliveryMethod,
      deliveryFee: deliveryFee || 0,
      totalAmount: totalAmount || 0,
      securityDeposit: securityDeposit || 1000,
      refundDetails: refundDetails || {
        preferredMethod: "bank",
        bankDetails: {
          accountHolder: "",
          bankName: "",
          accountNumber: "",
          ifscCode: ""
        },
        digitalWallet: {
          provider: "",
          phoneNumber: "",
          qrCode: ""
        }
      },
      agreedToTerms: agreedToTerms,
      agreedToDigitalAgreement: agreedToDigitalAgreement,
      agreementAcceptedAt: new Date(),
      status: "pending",
      paymentStatus: "pending",
      refundStatus: "pending"
    });

    res.status(201).json({
      message: "Booking request sent to owner. Awaiting confirmation.",
      booking
    });
  } catch (error) {
    console.error("Create booking error:", error);
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
        select: "name email phone address city"
      })
      .sort("-createdAt");
    res.json(bookings);
  } catch (error) {
    console.error("Get my bookings error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Owner: get all bookings of their dresses
const getOwnerBookings = async (req, res) => {
  try {
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

// Get completed bookings for refund processing
const getCompletedBookingsForRefund = async (req, res) => {
  try {
    const dresses = await Dress.find({ owner: req.user._id });
    const dressIds = dresses.map(d => d._id);

    const bookings = await Booking.find({ 
      dress: { $in: dressIds },
      status: "returned",
      refundStatus: "pending"
    })
      .populate("dress")
      .populate({
        path: "renter",
        select: "name email phone address city bankDetails digitalWallet preferredRefundMethod"
      })
      .sort("-createdAt");
    
    res.json(bookings);
  } catch (error) {
    console.error("Error fetching completed bookings:", error);
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

    if (booking.dress.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    booking.status = "confirmed";
    await booking.save();

    const dress = await Dress.findById(booking.dress._id);
    if (dress) {
      dress.available = false;
      await dress.save();
    }

    res.json({ message: "Booking confirmed successfully", booking });
  } catch (error) {
    console.error("Confirm booking error:", error);
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

    if (booking.dress.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    booking.status = "rejected";
    await booking.save();

    res.json({ message: "Booking rejected", booking });
  } catch (error) {
    console.error("Reject booking error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Cancel booking - only pending bookings can be cancelled
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.renter.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized to cancel this booking" });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "Booking is already cancelled" });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({ 
        message: `Cannot cancel booking with status: "${booking.status}". Only pending bookings can be cancelled.`
      });
    }

    booking.status = "cancelled";
    await booking.save();

    res.json({ 
      message: "Booking cancelled successfully",
      booking: {
        _id: booking._id,
        status: booking.status
      }
    });
    
  } catch (error) {
    console.error("Cancel booking error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Process refund for returned booking
const processRefund = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("renter");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const dress = await Dress.findById(booking.dress);
    
    if (dress.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (booking.status !== "returned") {
      return res.status(400).json({ message: "Booking must be returned to process refund" });
    }

    if (booking.refundStatus === "completed") {
      return res.status(400).json({ message: "Refund already processed" });
    }

    booking.refundStatus = "processing";
    await booking.save();

    booking.refundStatus = "completed";
    booking.refundAmount = booking.securityDeposit;
    booking.refundProcessedAt = new Date();
    await booking.save();

    res.json({ 
      message: "Refund processed successfully", 
      booking,
      refundDetails: {
        amount: booking.securityDeposit,
        method: booking.refundDetails.preferredMethod,
        processedAt: booking.refundProcessedAt
      }
    });
  } catch (error) {
    console.error("Process refund error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get refund details for a specific booking
const getRefundDetails = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("renter", "name email phone");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const dress = await Dress.findById(booking.dress);
    
    const isRenter = booking.renter._id.toString() === req.user._id.toString();
    const isOwner = dress && dress.owner.toString() === req.user._id.toString();
    
    if (!isRenter && !isOwner) {
      return res.status(401).json({ message: "Not authorized" });
    }

    res.json({
      refundDetails: booking.refundDetails,
      refundStatus: booking.refundStatus,
      refundAmount: booking.refundAmount,
      refundProcessedAt: booking.refundProcessedAt,
      securityDeposit: booking.securityDeposit
    });
  } catch (error) {
    console.error("Get refund details error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete booking for cancelled or returned bookings
const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.renter.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (booking.status !== "cancelled" && booking.status !== "returned") {
      return res.status(400).json({ 
        message: "Only cancelled or returned bookings can be deleted" 
      });
    }

    await booking.deleteOne();

    res.json({ message: "Booking deleted successfully" });
  } catch (error) {
    console.error("Delete booking error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getOwnerBookings,
  getOwnerPendingBookings,
  getCompletedBookingsForRefund,
  confirmBooking,
  rejectBooking,
  cancelBooking,
  deleteBooking,
  processRefund,
  getRefundDetails
};