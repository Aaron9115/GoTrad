import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import DressListing from "./pages/DressListing";
import Booking from "./pages/Booking";
import AIRecommendation from "./pages/AIRecommendation";
import Contact from "./pages/Contact"; // Make sure this import is here
import Login from "./components/Login"; 
import Register from "./components/Register";
import Profile from "./pages/Profile";
// import MyBookings from "./pages/MyBookings"; // Create this later
// import DressManagement from "./pages/DressManagement"; // Create this later
// import AdminDashboard from "./pages/AdminDashboard"; // Create this later

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/dresses" element={<DressListing />} />
        <Route path="/booking/:dressId" element={<Booking />} />
        <Route path="/ai-recommendation" element={<AIRecommendation />} />
        <Route path="/contact" element={<Contact />} /> {/* This route is correct */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes */}
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        
        {/* <Route path="/my-bookings" element={
          <ProtectedRoute allowedRoles={['renter']}>
            <MyBookings />
          </ProtectedRoute>
        /> */}

        {/* Owner Routes */}
        {/* <Route path="/owner/dresses" element={
          <ProtectedRoute allowedRoles={['owner', 'admin']}>
            <DressManagement />
          </ProtectedRoute>
        /> */}

        {/* Admin Routes */}
        {/* <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        /> */}

        {/* Catch all - 404 redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;