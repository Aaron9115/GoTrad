const mongoose = require("mongoose");

const dressSchema = new mongoose.Schema(
  {
    // Owner of the dress
    owner: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    
    // Dress name 
    name: { 
      type: String, 
      required: true 
    },
    
    // Size options
    size: { 
      type: String, 
      required: true,
      enum: ["XS", "S", "M", "L", "XL", "XXL", "Custom"]
    },
    
    // Color of the dress
    color: { 
      type: String, 
      required: true 
    },
    
    // Category
    category: { 
      type: String, 
      required: true,
    },
    
    // Price per day
    price: { 
      type: Number, 
      required: true 
    },
    
    // Image URL
    image: { 
      type: String,
      default: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80"
    },
    
    // Dress description 
    description: { 
      type: String,
      default: ""
    },
    
    // Is this dress currently available?
    available: { 
      type: Boolean, 
      default: true 
    },
    
    // Rating fields (added for reviews)
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    }
  },
  { 
    timestamps: true
  }
);

module.exports = mongoose.model("Dress", dressSchema);