const express = require("express");
const {
  addReview,
  getDressReviews,
  getDressRatingSummary,
} = require("../controllers/reviewController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, addReview);


router.get("/summary/:dressId", getDressRatingSummary);
router.get("/:dressId", getDressReviews);

module.exports = router;
