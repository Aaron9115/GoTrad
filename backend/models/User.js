const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["owner", "renter", "admin"],
      default: "renter"
    },
    phone: {
      type: String,
      default: ""
    },
    address: {
      type: String,
      default: ""
    },
    city: {
      type: String,
      default: ""
    },
    bio: {
      type: String,
      default: ""
    },
    profileImage: {
      type: String,
      default: "https://via.placeholder.com/150"
    },
    // Bank Details for Refunds
    bankDetails: {
      accountHolder: { type: String, default: "" },
      bankName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      ifscCode: { type: String, default: "" }
    },
    // Digital Wallet Details (eSewa/Fonepay/Khalti)
    digitalWallet: {
      provider: { 
        type: String, 
        enum: ["esewa", "fonepay", "khalti", ""], 
        default: "" 
      },
      phoneNumber: { type: String, default: "" },
      qrCode: { type: String, default: "" } // URL to uploaded QR code image
    },
    // Preferred refund method
    preferredRefundMethod: {
      type: String,
      enum: ["bank", "digital_wallet", "cash"],
      default: "bank"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);