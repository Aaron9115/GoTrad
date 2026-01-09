const Booking = require("../models/Booking");
const Dress = require("../models/Dress");

// Create a new booking
const createBooking = async (req, res) => {
  try {
    const { dressId, startDate, endDate } = req.body;

    if (!dressId || !startDate || !endDate) {
      return res.status(400).json({ message: "All fields are required" });
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
      status: "booked",
    });

    // Mark dress as unavailable
    dress.available = false;
    await dress.save();

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all bookings of logged-in user (renter)
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ renter: req.user._id })
      .populate("dress")
      .populate("renter", "name email");
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
      .populate("renter", "name email");
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Cancel booking 
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

    booking.status = "cancelled";
    await booking.save();

    // Make dress available again
    const dress = await Dress.findById(booking.dress);
    if (dress) {
      dress.available = true;
      await dress.save();
    }

    res.json({ message: "Booking cancelled successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {createBooking,getMyBookings,getOwnerBookings,cancelBooking
};
