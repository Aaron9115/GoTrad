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
      required: true,
      trim: true,
    },
    helpful: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// One user can review one dress only once
reviewSchema.index({ user: 1, dress: 1 }, { unique: true });

// Update dress average rating after saving review
reviewSchema.post('save', async function() {
  const Review = mongoose.model('Review');
  const Dress = mongoose.model('Dress');
  
  const stats = await Review.aggregate([
    { $match: { dress: this.dress } },
    { $group: {
      _id: "$dress",
      avgRating: { $avg: "$rating" },
      totalReviews: { $sum: 1 }
    }}
  ]);
  
  if (stats.length > 0) {
    await Dress.findByIdAndUpdate(this.dress, {
      averageRating: stats[0].avgRating.toFixed(1),
      totalReviews: stats[0].totalReviews
    });
  }
});

module.exports = mongoose.model("Review", reviewSchema);