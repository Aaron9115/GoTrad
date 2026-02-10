const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    renter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    dress: { type: mongoose.Schema.Types.ObjectId, ref: "Dress", required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ["booked", "returned", "cancelled"], default: "booked" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
