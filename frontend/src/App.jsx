import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import DressListing from "./pages/DressListing";
import Booking from "./pages/Booking";
import AIRecommendation from "./pages/AIRecommendation";
import Contact from "./pages/Contact"; 
import Login from "./components/Login"; 
import Register from "./components/Register";
import Profile from "./pages/Profile";
import OwnerDashboard from "./pages/OwnerDashboard";

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
        <Route path="/contact" element={<Contact />} /> 
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes */}
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        
       <Route path="/owner/dashboard" element={
        <ProtectedRoute allowedRoles={['owner', 'admin']}>
       <OwnerDashboard />
      </ProtectedRoute>
      } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;