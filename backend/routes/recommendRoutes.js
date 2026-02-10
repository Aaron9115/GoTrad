const express = require("express");
const upload = require("../middleware/upload");
const { recommendBySkinTone } = require("../controllers/recommendController");

const router = express.Router();

router.post("/recommend", upload.single("image"), recommendBySkinTone);

module.exports = router;
