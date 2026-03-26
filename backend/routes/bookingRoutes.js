const express = require("express");
const { 
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

// Owner views completed bookings for refund processing
router.get("/owner/completed-refund", protect, getCompletedBookingsForRefund);

// Owner processes refund for returned booking
router.put("/process-refund/:id", protect, processRefund);

// Get refund details for a booking
router.get("/refund-details/:id", protect, getRefundDetails);

// Owner confirms booking
router.put("/confirm/:id", protect, confirmBooking);

// Owner rejects booking
router.put("/reject/:id", protect, rejectBooking);

// Renter cancels booking
router.put("/cancel/:id", protect, cancelBooking);

// Renter deletes booking 
router.delete("/delete/:id", protect, deleteBooking);

module.exports = router;