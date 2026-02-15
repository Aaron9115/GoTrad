import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import DressListing from "./pages/DressListing";
import Booking from "./pages/Booking";
import AIRecommendation from "./pages/AIRecommendation"; // Add this import

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dresses" element={<DressListing />} />
        <Route path="/booking/:dressId" element={<Booking />} />
        <Route path="/ai-recommendation" element={<AIRecommendation />} /> {/* Add this route */}
      </Routes>
    </Router>
  );
}

export default App;