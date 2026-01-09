const express = require("express");
const { createBooking, getMyBookings, getOwnerBookings, cancelBooking } = require("../controllers/bookingController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Renter creates booking
router.post("/create", protect, createBooking);

// Renter views own bookings
router.get("/my", protect, getMyBookings);

// Owner views bookings of their dresses
router.get("/owner", protect, getOwnerBookings);

// Renter cancels booking
router.put("/cancel/:id", protect, cancelBooking);

module.exports = router;
