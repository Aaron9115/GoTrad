const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
  addReview,
  getDressReviews,
  getDressRatingSummary,
  deleteReview
} = require("../controllers/reviewController");

const router = express.Router();

// Public routes
router.get("/dress/:dressId", getDressReviews);
router.get("/summary/:dressId", getDressRatingSummary);

// Test route to check auth
router.get("/test", protect, (req, res) => {
  res.json({ 
    success: true, 
    message: "Auth working!", 
    user: { id: req.user._id, name: req.user.name, email: req.user.email } 
  });
});

// Protected routes
router.post("/", protect, addReview);
router.delete("/:id", protect, deleteReview);

module.exports = router;