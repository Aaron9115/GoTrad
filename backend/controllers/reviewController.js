const Review = require("../models/Review");
const Booking = require("../models/Booking");

// Add review (Renter only)
const addReview = async (req, res) => {
  try {
    const { dressId, rating, comment } = req.body;

    if (!dressId || !rating) {
      return res.status(400).json({ message: "Dress and rating are required" });
    }

    // Check if user booked this dress
    const booking = await Booking.findOne({
      renter: req.user._id,
      dress: dressId,
      status: "booked",
    });

    if (!booking) {
      return res.status(403).json({
        message: "You can only review dresses you booked",
      });
    }

    const review = await Review.create({
      user: req.user._id,
      dress: dressId,
      rating,
      comment,
    });

    res.status(201).json(review);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "You have already reviewed this dress",
      });
    }
    res.status(500).json({ message: error.message });
  }
};

// Get reviews for a dress
const getDressReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ dress: req.params.dressId })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Rating summary (average + count)
const getDressRatingSummary = async (req, res) => {
  try {
    const reviews = await Review.find({ dress: req.params.dressId });

    const totalReviews = reviews.length;

    if (totalReviews === 0) {
      return res.json({
        averageRating: 0,
        totalReviews: 0,
      });
    }

    const averageRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

    res.json({
      averageRating: Number(averageRating.toFixed(1)),
      totalReviews,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//  EXPORT EVERYTHING
module.exports = {
  addReview,
  getDressReviews,
  getDressRatingSummary,
};
