import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Check for logged in user
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [location]);

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
    setProfileMenuOpen(false);
  }, [location]);

  // Smooth scroll to section (for home page anchors only)
  const scrollToSection = (id) => {
    if (location.pathname !== "/") {
      // If not on home page, navigate to home with hash
      navigate(`/#${id}`);
      return;
    }
    
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setMobileMenuOpen(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  // Get dashboard link based on role
  const getDashboardLink = () => {
    if (!user) return "/";
    switch (user.role) {
      case "admin":
        return "/admin/dashboard";
      case "owner":
        return "/owner/dashboard"; // Changed from "/owner/dresses" to "/owner/dashboard"
      default:
        return "/profile";
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
              <Link to="/ai-recommendation" className="nav-link">AI Recommendation</Link>
              <Link to="/virtual-tryon" className="nav-link">Virtual Try-On</Link>
              <button onClick={() => scrollToSection("faq")} className="nav-link">FAQ</button>
              <Link to="/contact" className="nav-link">Contact</Link>
            </>
          ) : (
            // On other pages - use router links
            <>
              <Link to="/" className="nav-link">Home</Link>
              <Link to="/dresses" className="nav-link">Collection</Link>
              <Link to="/ai-recommendation" className="nav-link">AI Recommendation</Link>
              <Link to="/virtual-tryon" className="nav-link">Virtual Try-On</Link>
              <Link to="/faq" className="nav-link">FAQ</Link>
              <Link to="/contact" className="nav-link">Contact</Link>
            </>
          )}
        </div>

        {/* Right Side - Auth/Profile */}
        <div className="nav-right">
          {user ? (
            // Logged in - Show Profile
            <div className="profile-dropdown">
              <button 
                className="profile-btn"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              >
                <div className="profile-avatar">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <span className="profile-name">{user.name?.split(' ')[0]}</span>
                <i className={`ri-arrow-down-s-line ${profileMenuOpen ? 'rotate' : ''}`}></i>
              </button>

              {profileMenuOpen && (
                <div className="dropdown-menu">
                  <Link to={getDashboardLink()} className="dropdown-item">
                    <i className="ri-dashboard-line"></i>
                    Dashboard
                  </Link>
                  <Link to="/profile" className="dropdown-item">
                    <i className="ri-user-line"></i>
                    My Profile
                  </Link>
                  {user.role === 'renter' && (
                    <Link to="/my-bookings" className="dropdown-item">
                      <i className="ri-calendar-line"></i>
                      My Bookings
                    </Link>
                  )}
                  {/* OWNER DASHBOARD LINK - ADDED HERE */}
                  {user.role === 'owner' && (
                    <Link to="/owner/dashboard" className="dropdown-item">
                      <i className="ri-store-line"></i>
                      Owner Dashboard
                    </Link>
                  )}
                  <div className="dropdown-divider"></div>
                  <button onClick={handleLogout} className="dropdown-item logout">
                    <i className="ri-logout-box-line"></i>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Not logged in - Show Login/Signup
            <div className="auth-buttons">
              <Link to="/login" className="btn-outline-small">Login</Link>
              <Link to="/register" className="btn-primary-small">Sign Up</Link>
            </div>
          )}

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
            <Link to="/ai-recommendation" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              <i className="ri-robot-line"></i>
              AI Recommendation
            </Link>
            <Link to="/virtual-tryon" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              <i className="ri-camera-line"></i>
              Virtual Try-On
            </Link>
            <button onClick={() => scrollToSection("faq")} className="mobile-nav-link">
              <i className="ri-question-line"></i>
              FAQ
            </button>
            <Link to="/contact" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              <i className="ri-customer-service-line"></i>
              Contact
            </Link>
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
            <Link to="/ai-recommendation" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              <i className="ri-robot-line"></i>
              AI Recommendation
            </Link>
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

        {/* Mobile Auth Section */}
        {!user ? (
          <>
            <div className="mobile-auth">
              <Link to="/login" className="mobile-login" onClick={() => setMobileMenuOpen(false)}>
                <i className="ri-login-circle-line"></i>
                Login
              </Link>
              <Link to="/register" className="mobile-signup" onClick={() => setMobileMenuOpen(false)}>
                <i className="ri-user-add-line"></i>
                Sign Up
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="mobile-user">
              <div className="mobile-user-avatar">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="mobile-user-info">
                <strong>{user.name}</strong>
                <span>{user.email}</span>
              </div>
            </div>
            <Link to={getDashboardLink()} className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              <i className="ri-dashboard-line"></i>
              Dashboard
            </Link>
            <Link to="/profile" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              <i className="ri-user-line"></i>
              My Profile
            </Link>
            {user.role === 'renter' && (
              <Link to="/my-bookings" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                <i className="ri-calendar-line"></i>
                My Bookings
              </Link>
            )}
            {/* OWNER DASHBOARD LINK IN MOBILE MENU */}
            {user.role === 'owner' && (
              <Link to="/owner/dashboard" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                <i className="ri-store-line"></i>
                Owner Dashboard
              </Link>
            )}
            <button onClick={handleLogout} className="mobile-nav-link logout">
              <i className="ri-logout-box-line"></i>
              Logout
            </button>
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