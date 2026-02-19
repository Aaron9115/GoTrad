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
    
    // Size options - kept simple for now
    size: { 
      type: String, 
      required: true,
      enum: ["XS", "S", "M", "L", "XL", "XXL", "Custom"] // Restrict to these options
    },
    
    // Color of the dress
    color: { 
      type: String, 
      required: true 
    },
    
    // Category - wedding, festival, party, etc
    category: { 
      type: String, 
      required: true,
      enum: ["Wedding", "Festival", "Party", "Traditional", "Modern"] 
    },
    
    // Price per day in rupees
    price: { 
      type: Number, 
      required: true 
    },
    
    // Image URL - where to find the dress photo
    image: { 
      type: String,
      default: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80" // Default image if none provided
    },
    
    // Dress description 
    description: { 
      type: String,
      default: ""
    },
    
    // Is this dress currently available for rent?
    available: { 
      type: Boolean, 
      default: true 
    }
  },
  { 
    timestamps: true // Automatically adds createdAt and updatedAt
  }
);

module.exports = mongoose.model("Dress", dressSchema);