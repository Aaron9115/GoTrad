const Return = require("../models/Return");
const Booking = require("../models/Booking");
const Dress = require("../models/Dress");
const User = require("../models/user");
const fs = require("fs");
const path = require("path");


// INITIATE RETURN - RENTER STARTS RETURN PROCESS

const initiateReturn = async (req, res) => {
  try {
    const { bookingId, condition, comments } = req.body;

    // Check if booking exists
    const booking = await Booking.findById(bookingId)
      .populate("dress")
      .populate("renter");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if user is the renter
    if (booking.renter._id.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized to return this dress" });
    }

    // Check if booking is still active
    if (booking.status !== "booked") {
      return res.status(400).json({ message: "This booking is not active" });
    }

    // Check if return already exists
    const existingReturn = await Return.findOne({ booking: bookingId });
    if (existingReturn) {
      return res.status(400).json({ message: "Return already initiated for this booking" });
    }

    // Handle uploaded photos from multer
    const photos = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        photos.push({
          url: `/uploads/returns/${file.filename}`,
          description: `Return photo - ${file.originalname}`
        });
      });
    }

    // Create return record in database
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

    // Update booking status to "returning"
    booking.status = "returning";
    await booking.save();

    res.status(201).json({
      message: "Return initiated successfully. Owner will review the photos.",
      returnRecord
    });

  } catch (error) {
    console.error("❌ Initiate return error:", error);
    res.status(500).json({ message: error.message });
  }
};


// GET RETURN BY BOOKING ID

const getReturnByBooking = async (req, res) => {
  try {
    const returnRecord = await Return.findOne({ booking: req.params.bookingId })
      .populate("booking")
      .populate("dress")
      .populate("renter", "name email")
      .populate("owner", "name email");

    if (!returnRecord) {
      return res.status(404).json({ message: "Return not found for this booking" });
    }

    // Check if user is either renter or owner
    if (returnRecord.renter._id.toString() !== req.user._id.toString() &&
        returnRecord.owner._id.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    res.json(returnRecord);

  } catch (error) {
    console.error("❌ Get return by booking error:", error);
    res.status(500).json({ message: error.message });
  }
};


// GET RETURN BY ID - FIXED VERSION

const getReturnById = async (req, res) => {
  try {
    const { returnId } = req.params;
    
    console.log("🔍 Looking for return with ID:", returnId);
    
    // Check if the ID is a valid MongoDB ObjectId
    if (!returnId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log("❌ Invalid ID format:", returnId);
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

    // Check if user is either renter or owner
    if (returnRecord.renter._id.toString() !== req.user._id.toString() &&
        returnRecord.owner._id.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    res.json(returnRecord);

  } catch (error) {
    console.error("❌ Get return by ID error:", error);
    res.status(500).json({ message: error.message });
  }
};


// GET ALL RETURNS FOR OWNER - FIXED VERSION

const getOwnerReturns = async (req, res) => {
  try {
    console.log("🔍 Fetching returns for owner:", req.user?._id);
    
    if (!req.user || !req.user._id) {
      console.log("❌ No user ID found");
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Find returns for this owner with proper population
    const returns = await Return.find({ owner: req.user._id })
      .populate({
        path: "booking",
        populate: { path: "dress" }
      })
      .populate("dress")
      .populate("renter", "name email")
      .sort("-createdAt");

    console.log(`✅ Found ${returns.length} returns`);
    res.json(returns);

  } catch (error) {
    console.error("❌ Get owner returns error:", error);
    // Return empty array instead of crashing
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
    console.error("❌ Get my returns error:", error);
    res.status(200).json([]);
  }
};


// OWNER REVIEWS RETURN
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

    const returnRecord = await Return.findById(req.params.returnId);

    if (!returnRecord) {
      return res.status(404).json({ message: "Return not found" });
    }

    // Check if user is the owner
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
        hasDamage: hasDamage || false,
        damageDetails: damageDetails || "",
        damagePhotos: damagePhotos,
        estimatedRepairCost: estimatedRepairCost || 0
      }
    };

    // Update status based on condition
    if (hasDamage) {
      returnRecord.status = "disputed";
    } else {
      returnRecord.status = "approved";
      
      // If approved, update booking and dress
      const booking = await Booking.findById(returnRecord.booking);
      if (booking) {
        booking.status = "returned";
        await booking.save();
      }

      const dress = await Dress.findById(returnRecord.dress);
      if (dress) {
        dress.available = true;
        await dress.save();
      }

      returnRecord.returnCompletedAt = new Date();
    }

    // Save resolution info if provided
    if (resolution || ownerAddress || returnMethod) {
      returnRecord.resolution = {
        ...returnRecord.resolution,
        resolution: resolution || "pending",
        refundAmount: deductAmount ? 1000 - deductAmount : 1000,
        notes: additionalNotes || ""
      };
    }

    await returnRecord.save();

    res.json({
      message: hasDamage ? "Return marked as disputed" : "Return approved successfully",
      returnRecord
    });

  } catch (error) {
    console.error("❌ Review return error:", error);
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

    // Update booking and dress
    const booking = await Booking.findById(returnRecord.booking);
    if (booking) {
      booking.status = "returned";
      await booking.save();
    }

    const dress = await Dress.findById(returnRecord.dress);
    if (dress) {
      dress.available = true;
      await dress.save();
    }

    res.json({
      message: "Dispute resolved successfully",
      returnRecord
    });

  } catch (error) {
    console.error("❌ Resolve dispute error:", error);
    res.status(500).json({ message: error.message });
  }
};


const uploadReturnPhotos = async (req, res) => {
  try {
    const returnRecord = await Return.findById(req.params.returnId);

    if (!returnRecord) {
      return res.status(404).json({ message: "Return not found" });
    }

    // Check if user is either renter or owner
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
    console.error("❌ Upload photos error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Export all functions
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