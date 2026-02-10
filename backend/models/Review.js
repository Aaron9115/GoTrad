const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dress",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// One user can review one dress only once
reviewSchema.index({ user: 1, dress: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
