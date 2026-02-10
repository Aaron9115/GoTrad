const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/authRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

//For Dress Route
const dressRoutes = require("./routes/dressRoutes");
app.use("/api/dress", dressRoutes);

//For Browse Route
const browseRoutes = require("./routes/browseRoutes");
app.use("/api/browse", browseRoutes);

//For Booking Route
const bookingRoutes = require("./routes/bookingRoutes");
app.use("/api/booking", bookingRoutes);

//For Review Route
const reviewRoutes = require("./routes/reviewRoutes");
app.use("/api/review", reviewRoutes);

//For Recommend Route
const recommendRoutes = require("./routes/recommendRoutes");
app.use("/api", recommendRoutes);
