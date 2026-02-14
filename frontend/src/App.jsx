import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import DressListing from './pages/DressListing';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dresses" element={<DressListing />} />
        {/* Add more routes here as needed */}
      </Routes>
    </Router>
  );
}

export default App;