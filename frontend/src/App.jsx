import React from "react"; // ← fix here
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";       // ✅ Correct relative path

//import Login from "./components/Login.jsx"; // Make sure Login.jsx exists
//import Register from "./components/Register.jsx"; // Make sure Register.jsx exists

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        
      </Routes>
    </Router>
  );
}

export default App;
