const express = require("express");
const {
  initiateReturn,
  getReturnByBooking,
  getReturnById,
  getOwnerReturns,
  getMyReturns,
  reviewReturn,
  resolveDispute,
  uploadReturnPhotos: uploadAdditionalPhotos  
} = require("../controllers/returnController");
const protect = require("../middleware/authMiddleware");
const uploadReturnPhotos = require("../middleware/uploadReturn");

const router = express.Router();


router.use(protect);


router.post("/initiate", uploadReturnPhotos.array("photos", 5), initiateReturn);


router.get("/owner", getOwnerReturns);


router.get("/my", getMyReturns);


router.get("/booking/:bookingId", getReturnByBooking);


router.get("/:returnId", getReturnById);


router.post("/:returnId/review", uploadReturnPhotos.array("damagePhotos", 5), reviewReturn);


router.post("/:returnId/resolve", resolveDispute);


router.post("/:returnId/photos", uploadReturnPhotos.array("photos", 5), uploadAdditionalPhotos);

module.exports = router;