const express = require("express");
const { 
  createBooking, 
  getMyBookings, 
  getOwnerBookings, 
  getOwnerPendingBookings,
  confirmBooking,
  rejectBooking,
  cancelBooking 
} = require("../controllers/bookingController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Renter creates booking
router.post("/create", protect, createBooking);

// Renter views own bookings
router.get("/my", protect, getMyBookings);

// Owner views all bookings of their dresses
router.get("/owner", protect, getOwnerBookings);

// Owner views pending bookings only
router.get("/owner/pending", protect, getOwnerPendingBookings);

// Owner confirms booking
router.put("/confirm/:id", protect, confirmBooking);

// Owner rejects booking
router.put("/reject/:id", protect, rejectBooking);

// Renter cancels booking
router.put("/cancel/:id", protect, cancelBooking);

module.exports = router;