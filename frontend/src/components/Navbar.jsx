import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Navbar scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Smooth scroll to section (for home page anchors)
  const scrollToSection = (id) => {
    if (location.pathname !== "/") {
      // If not on home page, navigate to home with hash
      window.location.href = `/#${id}`;
      return;
    }
    
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setMobileMenuOpen(false);
    }
  };

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="nav-container">
        {/* Logo */}
        <Link to="/" className="logo">
          
          <span>GoTrad</span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="nav-links desktop">
          {location.pathname === "/" ? (
            // On home page - use smooth scroll
            <>
              <button onClick={() => scrollToSection("hero")} className="nav-link">Home</button>
              <Link to="/dresses" className="nav-link">Collection</Link>
              {/* ADDED: AI Recommendation link */}
              <Link to="/ai-recommendation" className="nav-link">AI Recommendation</Link>
              {/* ADDED: Virtual Try-On link */}
              <Link to="/virtual-tryon" className="nav-link">Virtual Try-On</Link>
              <button onClick={() => scrollToSection("faq")} className="nav-link">FAQ</button>
              <button onClick={() => scrollToSection("contact")} className="nav-link">Contact</button>
            </>
          ) : (
            // On other pages - use router links
            <>
              <Link to="/" className="nav-link">Home</Link>
              <Link to="/dresses" className="nav-link">Collection</Link>
              {/* ADDED: AI Recommendation link */}
              <Link to="/ai-recommendation" className="nav-link">AI Recommendation</Link>
              {/* ADDED: Virtual Try-On link */}
              <Link to="/virtual-tryon" className="nav-link">Virtual Try-On</Link>
              <Link to="/faq" className="nav-link">FAQ</Link>
              <Link to="/contact" className="nav-link">Contact</Link>
            </>
          )}
        </div>

        {/* Book Now Button */}
        <Link to="/dresses" className="btn-book">
          <span>Book Now</span>
          <i className="ri-arrow-right-line"></i>
        </Link>

        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <i className={mobileMenuOpen ? "ri-close-line" : "ri-menu-line"}></i>
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? "open" : ""}`}>
        {location.pathname === "/" ? (
          // On home page - use smooth scroll
          <>
            <button onClick={() => scrollToSection("hero")} className="mobile-nav-link">
              <i className="ri-home-line"></i>
              Home
            </button>
            <Link to="/dresses" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              <i className="ri-grid-line"></i>
              Collection
            </Link>
            {/* ADDED: AI Recommendation in mobile menu */}
            <Link to="/ai-recommendation" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              <i className="ri-robot-line"></i>
              AI Recommendation
            </Link>
            {/* ADDED: Virtual Try-On in mobile menu */}
            <Link to="/virtual-tryon" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              <i className="ri-camera-line"></i>
              Virtual Try-On
            </Link>
            <button onClick={() => scrollToSection("faq")} className="mobile-nav-link">
              <i className="ri-question-line"></i>
              FAQ
            </button>
            <button onClick={() => scrollToSection("contact")} className="mobile-nav-link">
              <i className="ri-customer-service-line"></i>
              Contact
            </button>
          </>
        ) : (
          // On other pages - use router links
          <>
            <Link to="/" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              <i className="ri-home-line"></i>
              Home
            </Link>
            <Link to="/dresses" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              <i className="ri-grid-line"></i>
              Collection
            </Link>
            {/* ADDED: AI Recommendation in mobile menu */}
            <Link to="/ai-recommendation" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              <i className="ri-robot-line"></i>
              AI Recommendation
            </Link>
            {/* ADDED: Virtual Try-On in mobile menu */}
            <Link to="/virtual-tryon" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              <i className="ri-camera-line"></i>
              Virtual Try-On
            </Link>
            <Link to="/faq" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              <i className="ri-question-line"></i>
              FAQ
            </Link>
            <Link to="/contact" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              <i className="ri-customer-service-line"></i>
              Contact
            </Link>
          </>
        )}
        
        {/* Mobile Book Now Button */}
        <Link to="/dresses" className="mobile-book-btn" onClick={() => setMobileMenuOpen(false)}>
          <span>Book Now</span>
          <i className="ri-arrow-right-line"></i>
        </Link>

        {/* Mobile Social Links */}
        <div className="mobile-social">
          <a href="#" aria-label="Facebook"><i className="ri-facebook-fill"></i></a>
          <a href="#" aria-label="Instagram"><i className="ri-instagram-line"></i></a>
          <a href="#" aria-label="Twitter"><i className="ri-twitter-x-line"></i></a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;