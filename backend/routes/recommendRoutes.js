const express = require("express");
const upload = require("../middleware/upload");
const { recommendBySkinTone } = require("../controllers/recommendController");

const router = express.Router();

// POST endpoint for skin tone recommendation
// The frontend sends category as query param: /api/recommend?category=traditional
router.post("/recommend", upload.single("image"), recommendBySkinTone);

module.exports = router;