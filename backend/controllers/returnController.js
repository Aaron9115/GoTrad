const Return = require("../models/Return");
const Booking = require("../models/Booking");
const Dress = require("../models/Dress");
const User = require("../models/user");
const fs = require("fs");
const path = require("path");

// INITIATE RETURN - RENTER STARTS RETURN PROCESS
const initiateReturn = async (req, res) => {
  try {
    console.log("=== INITIATE RETURN DEBUG ===");
    console.log("Request body:", req.body);
    console.log("Request files:", req.files);
    console.log("User ID:", req.user?._id);
    
    const { bookingId, condition, comments } = req.body;

    if (!bookingId) {
      return res.status(400).json({ message: "bookingId is required" });
    }

    const booking = await Booking.findById(bookingId)
      .populate("dress")
      .populate("renter");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (!booking.renter || booking.renter._id.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized to return this dress" });
    }

    if (!booking.dress) {
      return res.status(400).json({ message: "Booking has no dress information" });
    }

    if (booking.status !== "booked" && booking.status !== "confirmed") {
      return res.status(400).json({ message: "This booking is not active" });
    }

    const existingReturn = await Return.findOne({ booking: bookingId });
    if (existingReturn) {
      return res.status(400).json({ message: "Return already initiated for this booking" });
    }

    const photos = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        photos.push({
          url: `/uploads/returns/${file.filename}`,
          description: `Return photo - ${file.originalname}`
        });
      });
    } else {
      return res.status(400).json({ message: "Please upload at least one photo" });
    }

    const returnRecord = await Return.create({
      booking: bookingId,
      dress: booking.dress._id,
      renter: req.user._id,
      owner: booking.dress.owner,
      photos: photos,
      renterAssessment: {
        condition: condition || "good",
        comments: comments || "",
        submittedAt: new Date()
      },
      status: "pending"
    });

    booking.status = "returning";
    await booking.save();

    res.status(201).json({
      message: "Return initiated successfully. Owner will review the photos.",
      returnRecord
    });

  } catch (error) {
    console.error("Initiate return error:", error);
    res.status(500).json({ message: error.message });
  }
};

// GET RETURN BY BOOKING ID
const getReturnByBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const returnRecord = await Return.findOne({ booking: bookingId })
      .populate("booking")
      .populate("dress")
      .populate("renter", "name email")
      .populate("owner", "name email");

    if (!returnRecord) {
      return res.status(404).json({ message: "Return not found for this booking" });
    }

    if (returnRecord.renter._id.toString() !== req.user._id.toString() &&
        returnRecord.owner._id.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    res.json(returnRecord);

  } catch (error) {
    console.error("Get return by booking error:", error);
    res.status(500).json({ message: error.message });
  }
};

// GET RETURN BY ID
const getReturnById = async (req, res) => {
  try {
    const { returnId } = req.params;
    
    if (!returnId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid return ID format" });
    }

    const returnRecord = await Return.findById(returnId)
      .populate("booking")
      .populate("dress")
      .populate("renter", "name email")
      .populate("owner", "name email");

    if (!returnRecord) {
      return res.status(404).json({ message: "Return not found" });
    }

    if (returnRecord.renter._id.toString() !== req.user._id.toString() &&
        returnRecord.owner._id.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    res.json(returnRecord);

  } catch (error) {
    console.error("Get return by ID error:", error);
    res.status(500).json({ message: error.message });
  }
};

// GET ALL RETURNS FOR OWNER
const getOwnerReturns = async (req, res) => {
  try {
    const returns = await Return.find({ owner: req.user._id })
      .populate({
        path: "booking",
        populate: { path: "dress" }
      })
      .populate("dress")
      .populate("renter", "name email")
      .sort("-createdAt");

    res.json(returns);

  } catch (error) {
    console.error("Get owner returns error:", error);
    res.status(200).json([]);
  }
};

// GET ALL RETURNS FOR RENTER
const getMyReturns = async (req, res) => {
  try {
    const returns = await Return.find({ renter: req.user._id })
      .populate("booking")
      .populate("dress")
      .populate("owner", "name email")
      .sort("-createdAt");

    res.json(returns);

  } catch (error) {
    console.error("Get my returns error:", error);
    res.status(200).json([]);
  }
};

// FIXED: OWNER REVIEWS RETURN - Makes dress available when approved
const reviewReturn = async (req, res) => {
  try {
    const { 
      condition, 
      comments, 
      hasDamage, 
      damageDetails, 
      estimatedRepairCost,
      deductAmount,
      resolution,
      ownerAddress,
      returnMethod,
      additionalNotes
    } = req.body;

    console.log("========== REVIEW RETURN ==========");
    console.log("Return ID:", req.params.returnId);
    console.log("Has Damage:", hasDamage);
    console.log("Condition:", condition);

    const returnRecord = await Return.findById(req.params.returnId);

    if (!returnRecord) {
      return res.status(404).json({ message: "Return not found" });
    }

    if (returnRecord.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized to review this return" });
    }

    // Handle damage photos if any
    const damagePhotos = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        damagePhotos.push({
          url: `/uploads/returns/${file.filename}`,
          description: `Damage photo - ${file.originalname}`
        });
      });
    }

    // Update owner inspection
    returnRecord.ownerInspection = {
      inspectedBy: req.user._id,
      inspectedAt: new Date(),
      condition: condition || returnRecord.renterAssessment.condition,
      comments: comments || "",
      damageReport: {
        hasDamage: hasDamage === true || hasDamage === "true",
        damageDetails: damageDetails || "",
        damagePhotos: damagePhotos,
        estimatedRepairCost: estimatedRepairCost || 0
      }
    };

    // Get the booking and dress
    const booking = await Booking.findById(returnRecord.booking);
    const dress = await Dress.findById(returnRecord.dress);

    if (!booking || !dress) {
      return res.status(404).json({ message: "Booking or Dress not found" });
    }

    const hasDamageValue = hasDamage === true || hasDamage === "true";

    if (hasDamageValue) {
      // Case 1: Dress has damage - mark as disputed
      returnRecord.status = "disputed";
      console.log("Return marked as disputed (damage found)");
    } else {
      // Case 2: No damage - APPROVE RETURN
      returnRecord.status = "approved";
      returnRecord.returnCompletedAt = new Date();
      console.log("Return approved (no damage)");
      
      // Update booking status to "returned"
      booking.status = "returned";
      await booking.save();
      console.log("Booking status updated to 'returned'");
      
      // Make dress available again
      dress.available = true;
      await dress.save();
      console.log(`Dress marked as AVAILABLE: ${dress.name} (ID: ${dress._id})`);
    }

    // Save resolution info if provided
    if (resolution || ownerAddress || returnMethod) {
      returnRecord.resolution = {
        ...returnRecord.resolution,
        resolution: resolution || "pending",
        refundAmount: deductAmount ? 1000 - deductAmount : 1000,
        notes: additionalNotes || "",
        ownerAddress: ownerAddress || "",
        returnMethod: returnMethod || "pickup"
      };
    }

    await returnRecord.save();
    console.log("Return review saved successfully");

    res.json({
      message: hasDamageValue 
        ? "Return marked as disputed. Awaiting admin resolution." 
        : "Return approved successfully. Dress is now available for rent.",
      returnRecord,
      dressStatus: {
        id: dress._id,
        name: dress.name,
        available: dress.available
      }
    });

  } catch (error) {
    console.error("Review return error:", error);
    res.status(500).json({ message: error.message });
  }
};

// RESOLVE DISPUTE (Admin only)
const resolveDispute = async (req, res) => {
  try {
    const { resolution, refundAmount, notes } = req.body;

    const returnRecord = await Return.findById(req.params.returnId);

    if (!returnRecord) {
      return res.status(404).json({ message: "Return not found" });
    }

    if (returnRecord.status !== "disputed") {
      return res.status(400).json({ message: "This return is not disputed" });
    }

    const booking = await Booking.findById(returnRecord.booking);
    const dress = await Dress.findById(returnRecord.dress);

    if (!booking || !dress) {
      return res.status(404).json({ message: "Booking or Dress not found" });
    }

    returnRecord.status = "resolved";
    returnRecord.resolution = {
      resolvedBy: req.user._id,
      resolvedAt: new Date(),
      resolution: resolution || "renter_pays",
      refundAmount: refundAmount || 0,
      notes: notes || ""
    };
    returnRecord.returnCompletedAt = new Date();

    await returnRecord.save();

    // Update booking and dress after dispute resolution
    booking.status = "returned";
    await booking.save();

    dress.available = true;
    await dress.save();

    res.json({
      message: "Dispute resolved successfully",
      returnRecord,
      dressStatus: {
        id: dress._id,
        name: dress.name,
        available: dress.available
      }
    });

  } catch (error) {
    console.error("Resolve dispute error:", error);
    res.status(500).json({ message: error.message });
  }
};

// UPLOAD ADDITIONAL PHOTOS
const uploadReturnPhotos = async (req, res) => {
  try {
    const returnRecord = await Return.findById(req.params.returnId);

    if (!returnRecord) {
      return res.status(404).json({ message: "Return not found" });
    }

    if (returnRecord.renter.toString() !== req.user._id.toString() &&
        returnRecord.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No photos uploaded" });
    }

    const newPhotos = [];
    req.files.forEach(file => {
      newPhotos.push({
        url: `/uploads/returns/${file.filename}`,
        uploadedAt: new Date(),
        description: `Additional photo - ${file.originalname}`
      });
    });

    returnRecord.photos = [...returnRecord.photos, ...newPhotos];
    await returnRecord.save();

    res.json({
      message: "Photos uploaded successfully",
      photos: returnRecord.photos
    });

  } catch (error) {
    console.error("Upload photos error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  initiateReturn,
  getReturnByBooking,
  getReturnById,
  getOwnerReturns,
  getMyReturns,
  reviewReturn,
  resolveDispute,
  uploadReturnPhotos
};