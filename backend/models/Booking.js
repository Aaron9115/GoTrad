const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    renter: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    dress: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Dress", 
      required: true 
    },
    startDate: { 
      type: Date, 
      required: true 
    },
    endDate: { 
      type: Date, 
      required: true 
    },
    deliveryAddress: {
      address: { type: String },
      city: { type: String },
      phone: { type: String }
    },
    deliveryMethod: {
      type: String,
      enum: ["pickup", "delivery"],
      default: "pickup"
    },
    deliveryFee: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      default: 0
    },
    securityDeposit: {
      type: Number,
      default: 1000
    },
    refundDetails: {
      preferredMethod: {
        type: String,
        enum: ["bank", "digital_wallet"],
        default: "bank"
      },
      bankDetails: {
        accountHolder: { type: String, default: "" },
        bankName: { type: String, default: "" },
        accountNumber: { type: String, default: "" },
        ifscCode: { type: String, default: "" }
      },
      digitalWallet: {
        provider: { type: String, default: "" },
        phoneNumber: { type: String, default: "" },
        qrCode: { type: String, default: "" }
      }
    },
    status: { 
      type: String, 
      enum: [
        "pending",
        "confirmed",
        "booked",
        "returning",
        "returned",
        "rejected",
        "cancelled"
      ], 
      default: "pending" 
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending"
    },
    returnInfo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Return"
    },
    refundStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending"
    },
    refundAmount: {
      type: Number,
      default: 0
    },
    refundProcessedAt: {
      type: Date
    },
    agreedToTerms: {
      type: Boolean,
      default: false
    },
    agreedToDigitalAgreement: {
      type: Boolean,
      default: false
    },
    agreementAcceptedAt: {
      type: Date
    }
  },
  { 
    timestamps: true
  }
);

// 
bookingSchema.methods.canBeCancelled = function() {
  // Only pending bookings can be cancelled - NO DATE CHECK
  return this.status === "pending";
};

module.exports = mongoose.model("Booking", bookingSchema);