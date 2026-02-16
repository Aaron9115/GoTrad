const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["owner", "renter", "admin"],
      default: "renter"
    },
    // New fields for profile - ADD THESE
    phone: {
      type: String,
      default: ""
    },
    address: {
      type: String,
      default: ""
    },
    bio: {
      type: String,
      default: ""
    },
    profileImage: {
      type: String,
      default: "https://via.placeholder.com/150"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);