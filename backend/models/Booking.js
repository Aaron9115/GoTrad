const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    // Who is renting the dress
    renter: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    
    // Which dress is being rented
    dress: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Dress", 
      required: true 
    },
    
    // When the rental starts
    startDate: { 
      type: Date, 
      required: true 
    },
    
    // When the rental ends
    endDate: { 
      type: Date, 
      required: true 
    },
    
    // Current status of the booking
    status: { 
      type: String, 
      enum: [
        "booked",     // Dress is rented and currently with renter
        "returning",  // Return process has been initiated (photos submitted)
        "returned",   // Dress has been returned and verified
        "cancelled"   // Booking was cancelled
      ], 
      default: "booked" 
    },
    
    
    returnInfo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Return"
    }
  },
  { 
    timestamps: true // Automatically adds createdAt and updatedAt
  }
);


bookingSchema.methods.isActive = function() {
  return this.status === "booked" || this.status === "returning";
};


bookingSchema.methods.canBeCancelled = function() {
  const today = new Date();
  return this.status === "booked" && this.startDate > today;
};

module.exports = mongoose.model("Booking", bookingSchema);