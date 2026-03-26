const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    // Who is renting the dress
    renter: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    
    // Which dress is being rented
    dress: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Dress", 
      required: true 
    },
    
    // When the rental starts
    startDate: { 
      type: Date, 
      required: true 
    },
    
    // When the rental ends
    endDate: { 
      type: Date, 
      required: true 
    },
    
    // Delivery address
    deliveryAddress: {
      address: { type: String },
      city: { type: String },
      phone: { type: String }
    },
    
    // Total amount paid
    totalAmount: {
      type: Number,
      default: 0
    },
    
    // Security deposit
    securityDeposit: {
      type: Number,
      default: 1000
    },
    
    // Refund details for the renter
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
    
    // Current status of the booking
    status: { 
      type: String, 
      enum: [
        "pending",    // Waiting for owner approval
        "confirmed",  // Owner approved
        "booked",     // Dress is rented and currently with renter (backward compatibility)
        "returning",  // Return process has been initiated (photos submitted)
        "returned",   // Dress has been returned and verified
        "rejected",   // Owner rejected the booking
        "cancelled"   // Booking was cancelled
      ], 
      default: "pending" 
    },
    
    // Payment status
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending"
    },
    
    // Return information
    returnInfo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Return"
    },
    
    // Refund status
    refundStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending"
    },
    
    // Refund amount
    refundAmount: {
      type: Number,
      default: 0
    },
    
    // Refund processed date
    refundProcessedAt: {
      type: Date
    }
  },
  { 
    timestamps: true // Automatically adds createdAt and updatedAt
  }
);

bookingSchema.methods.isActive = function() {
  return this.status === "confirmed" || this.status === "booked" || this.status === "returning";
};

bookingSchema.methods.canBeCancelled = function() {
  const today = new Date();
  return (this.status === "pending" || this.status === "confirmed") && this.startDate > today;
};

module.exports = mongoose.model("Booking", bookingSchema);