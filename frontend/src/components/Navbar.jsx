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

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
  }, [location]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
  }, [location]);

  const scrollToSection = (id) => {
    if (location.pathname !== "/") {
      navigate(`/#${id}`);
      return;
    }
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  const getDashboardLink = () => {
    if (!user) return "/";
    if (user.role === "owner") return "/owner/dashboard";
    if (user.role === "admin") return "/admin/dashboard";
    return "/profile";
  };

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="nav-container">
        <Link to="/" className="logo">GoTrad</Link>

        <div className="nav-links desktop">
          {location.pathname === "/" ? (
            <>
              <button onClick={() => scrollToSection("hero")} className="nav-link">Home</button>
              <Link to="/dresses" className="nav-link">Collection</Link>
              <Link to="/ai-recommendation" className="nav-link">AI Recommendation</Link>
              <Link to="/virtual-tryon" className="nav-link">Virtual Try-On</Link>
              <button onClick={() => scrollToSection("faq")} className="nav-link">FAQ</button>
              <Link to="/contact" className="nav-link">Contact</Link>
            </>
          ) : (
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

        <div className="nav-right">
          {user ? (
            <div className="profile-dropdown">
              <button className="profile-btn" onClick={() => setProfileMenuOpen(!profileMenuOpen)}>
                <div className="profile-avatar">{user.name?.charAt(0).toUpperCase()}</div>
                <span className="profile-name">{user.name?.split(' ')[0]}</span>
                <i className={`ri-arrow-down-s-line ${profileMenuOpen ? 'rotate' : ''}`}></i>
              </button>
              {profileMenuOpen && (
                <div className="dropdown-menu">
                  <Link to={getDashboardLink()} className="dropdown-item"><i className="ri-dashboard-line"></i> Dashboard</Link>
                  <Link to="/profile" className="dropdown-item"><i className="ri-user-line"></i> My Profile</Link>
                  {user.role === 'renter' && <Link to="/my-bookings" className="dropdown-item"><i className="ri-calendar-line"></i> My Bookings</Link>}
                  {user.role === 'owner' && <Link to="/owner/dashboard" className="dropdown-item"><i className="ri-store-line"></i> Owner Dashboard</Link>}
                  <div className="dropdown-divider"></div>
                  <button onClick={handleLogout} className="dropdown-item logout"><i className="ri-logout-box-line"></i> Logout</button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn-outline-small">Login</Link>
              <Link to="/register" className="btn-primary-small">Sign Up</Link>
            </div>
          )}

          <Link to="/dresses" className="btn-book">
            <span>Book Now</span>
            <i className="ri-arrow-right-line"></i>
          </Link>

          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <i className={mobileMenuOpen ? "ri-close-line" : "ri-menu-line"}></i>
          </button>
        </div>
      </div>

      <div className={`mobile-menu ${mobileMenuOpen ? "open" : ""}`}>
        {location.pathname === "/" ? (
          <>
            <button onClick={() => scrollToSection("hero")} className="mobile-nav-link"><i className="ri-home-line"></i> Home</button>
            <Link to="/dresses" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}><i className="ri-grid-line"></i> Collection</Link>
            <Link to="/ai-recommendation" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}><i className="ri-robot-line"></i> AI Recommendation</Link>
            <Link to="/virtual-tryon" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}><i className="ri-camera-line"></i> Virtual Try-On</Link>
            <button onClick={() => scrollToSection("faq")} className="mobile-nav-link"><i className="ri-question-line"></i> FAQ</button>
            <Link to="/contact" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}><i className="ri-customer-service-line"></i> Contact</Link>
          </>
        ) : (
          <>
            <Link to="/" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}><i className="ri-home-line"></i> Home</Link>
            <Link to="/dresses" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}><i className="ri-grid-line"></i> Collection</Link>
            <Link to="/ai-recommendation" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}><i className="ri-robot-line"></i> AI Recommendation</Link>
            <Link to="/virtual-tryon" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}><i className="ri-camera-line"></i> Virtual Try-On</Link>
            <Link to="/faq" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}><i className="ri-question-line"></i> FAQ</Link>
            <Link to="/contact" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}><i className="ri-customer-service-line"></i> Contact</Link>
          </>
        )}

        {!user ? (
          <div className="mobile-auth">
            <Link to="/login" className="mobile-login" onClick={() => setMobileMenuOpen(false)}>Login</Link>
            <Link to="/register" className="mobile-signup" onClick={() => setMobileMenuOpen(false)}>Sign Up</Link>
          </div>
        ) : (
          <>
            <div className="mobile-user">
              <div className="mobile-user-avatar">{user.name?.charAt(0).toUpperCase()}</div>
              <div className="mobile-user-info">
                <strong>{user.name}</strong>
                <span>{user.email}</span>
              </div>
            </div>
            <Link to={getDashboardLink()} className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}><i className="ri-dashboard-line"></i> Dashboard</Link>
            <Link to="/profile" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}><i className="ri-user-line"></i> My Profile</Link>
            {user.role === 'renter' && <Link to="/my-bookings" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}><i className="ri-calendar-line"></i> My Bookings</Link>}
            {user.role === 'owner' && <Link to="/owner/dashboard" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}><i className="ri-store-line"></i> Owner Dashboard</Link>}
            <button onClick={handleLogout} className="mobile-nav-link logout"><i className="ri-logout-box-line"></i> Logout</button>
          </>
        )}

        <Link to="/dresses" className="mobile-book-btn" onClick={() => setMobileMenuOpen(false)}>
          <span>Book Now</span>
          <i className="ri-arrow-right-line"></i>
        </Link>

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