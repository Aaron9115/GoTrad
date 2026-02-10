const express = require("express");
const { getAllDresses, getFilteredDresses } = require("../controllers/browseController");
const router = express.Router();

// Anyone (logged in or not) can view available dresses
router.get("/", getAllDresses);

// Filtered search using query params
router.get("/filter", getFilteredDresses);

module.exports = router;
