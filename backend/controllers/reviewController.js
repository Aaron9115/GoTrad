const Review = require("../models/Review");
const Dress = require("../models/Dress");

// Add review - ANY LOGGED IN USER CAN REVIEW ANY DRESS
const addReview = async (req, res) => {
  try {
    console.log("=== ADD REVIEW REQUEST ===");
    console.log("User ID:", req.user?._id);
    
    const { dressId, rating, comment } = req.body;
    console.log("Review data:", { dressId, rating, comment });

    if (!dressId || !rating) {
      return res.status(400).json({ message: "Dress and rating are required" });
    }

    if (!comment || comment.trim() === "") {
      return res.status(400).json({ message: "Please write a review" });
    }

    // Check if dress exists
    const dress = await Dress.findById(dressId);
    if (!dress) {
      return res.status(404).json({ message: "Dress not found" });
    }

    // Check if user already reviewed this dress
    const existingReview = await Review.findOne({
      user: req.user._id,
      dress: dressId
    });

    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this dress" });
    }

    // CREATE REVIEW - NO BOOKING CHECK HERE!
    const review = await Review.create({
      user: req.user._id,
      dress: dressId,
      rating,
      comment
    });

    // Populate user info
    const populatedReview = await Review.findById(review._id)
      .populate("user", "name");

    console.log("Review created successfully");
    
    res.status(201).json(populatedReview);

  } catch (error) {
    console.error("Add review error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "You have already reviewed this dress" });
    }
    res.status(500).json({ message: error.message });
  }
};

// Get reviews for a dress
const getDressReviews = async (req, res) => {
  try {
    const { dressId } = req.params;
    
    const reviews = await Review.find({ dress: dressId })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    console.error("Get reviews error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get rating summary for a dress
const getDressRatingSummary = async (req, res) => {
  try {
    const { dressId } = req.params;
    
    const reviews = await Review.find({ dress: dressId });
    
    const totalReviews = reviews.length;
    let averageRating = 0;
    
    if (totalReviews > 0) {
      const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
      averageRating = sum / totalReviews;
    }

    res.json({
      averageRating: Number(averageRating.toFixed(1)),
      totalReviews
    });
  } catch (error) {
    console.error("Get rating summary error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete review
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own reviews" });
    }

    await review.deleteOne();

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addReview,
  getDressReviews,
  getDressRatingSummary,
  deleteReview
};