const mongoose = require("mongoose");

const dressSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    size: { type: String, required: true }, //S, M, L, XL
    color: { type: String, required: true },
    category: { type: String, required: true }, // Daura Suruwal, Gunyo Cholo
    price: { type: Number, required: true },
    image: { type: String }, //store image URL or path
    available: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Dress", dressSchema);
