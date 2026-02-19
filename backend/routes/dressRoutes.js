const express = require("express");
const { 
  addDress, 
  getDresses,
  getMyDresses,
  getDressById,
  updateDress,
  deleteDress,
  toggleAvailability 
} = require("../controllers/dressController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes - anyone can access
router.get("/", getDresses);


router.get("/my-dresses", protect, getMyDresses);  // ← MOVE THIS BEFORE /:id

router.get("/:id", getDressById);  

// Protected routes - require login
router.post("/add", protect, addDress);
router.put("/:id", protect, updateDress);
router.delete("/:id", protect, deleteDress);
router.patch("/:id/toggle", protect, toggleAvailability);

module.exports = router;