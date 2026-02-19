const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Your frontend URL
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory (for profile pictures)
app.use("/uploads", express.static("uploads"));

// Create uploads directory if it doesn't exist
const fs = require('fs');
const path = require('path');
const uploadsDir = path.join(__dirname, 'uploads');
const profilesDir = path.join(__dirname, 'uploads/profiles');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log('✅ Created uploads directory');
}
if (!fs.existsSync(profilesDir)) {
  fs.mkdirSync(profilesDir, { recursive: true });
  console.log('✅ Created uploads/profiles directory');
}

// Auth Routes
app.use("/api/auth", require("./routes/authRoutes"));

// Dress Routes
const dressRoutes = require("./routes/dressRoutes");
app.use("/api/dress", dressRoutes);

// Browse Routes
const browseRoutes = require("./routes/browseRoutes");
app.use("/api/browse", browseRoutes);

// Booking Routes
const bookingRoutes = require("./routes/bookingRoutes");
app.use("/api/booking", bookingRoutes);

// Review Routes
const reviewRoutes = require("./routes/reviewRoutes");
app.use("/api/review", reviewRoutes);

// Recommend Routes
const recommendRoutes = require("./routes/recommendRoutes");
app.use("/api", recommendRoutes);

// Profile Routes
const profileRoutes = require("./routes/profileRoutes");
app.use("/api/profile", profileRoutes);

// Contact Routes
const contactRoutes = require("./routes/contactRoutes");
app.use("/api/contact", contactRoutes);




// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ 
    message: `Route ${req.method} ${req.url} not found`,
    availableRoutes: [
      '/api/auth',
      '/api/dress',
      '/api/browse',
      '/api/booking',
      '/api/review',
      '/api/recommend',
      '/api/profile'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
  console.log(` Frontend URL: http://localhost:5173`);
  console.log(` API Base URL: http://localhost:${PORT}/api`);
});