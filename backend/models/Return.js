const mongoose = require("mongoose");

const returnSchema = new mongoose.Schema(
  {
    booking: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Booking", 
      required: true 
    },
    dress: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Dress", 
      required: true 
    },
    renter: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    owner: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    photos: [{
      url: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now },
      description: { type: String }
    }],
    renterAssessment: {
      condition: { 
        type: String, 
        enum: ["excellent", "good", "fair", "damaged"],
        required: true 
      },
      comments: { type: String },
      submittedAt: { type: Date, default: Date.now }
    },
    ownerInspection: {
      inspectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      inspectedAt: { type: Date },
      condition: { type: String },
      comments: { type: String },
      damageReport: {
        hasDamage: { type: Boolean, default: false },
        damageDetails: { type: String },
        damagePhotos: [{ url: String }],
        estimatedRepairCost: { type: Number }
      }
    },
    status: {
      type: String,
      enum: ["pending", "under_review", "approved", "disputed", "resolved"],
      default: "pending"
    },
    resolution: {
      resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      resolvedAt: { type: Date },
      resolution: { type: String },
      refundAmount: { type: Number },
      notes: { type: String }
    },
    returnInitiatedAt: { type: Date, default: Date.now },
    returnCompletedAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Return", returnSchema);