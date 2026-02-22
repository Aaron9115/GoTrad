import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-brand">
            <div className="footer-logo">
              <span>GoTrad</span>
            </div>
            <p className="footer-tagline">
              Celebrate tradition, effortlessly. Premium traditional wear rental for your special occasions.
            </p>
            <div className="social-links">
              <a href="#" aria-label="Facebook"><i className="ri-facebook-fill"></i></a>
              <a href="#" aria-label="Instagram"><i className="ri-instagram-line"></i></a>
              <a href="#" aria-label="Twitter"><i className="ri-twitter-x-line"></i></a>
              <a href="#" aria-label="Pinterest"><i className="ri-pinterest-line"></i></a>
              <a href="#" aria-label="YouTube"><i className="ri-youtube-line"></i></a>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="footer-links">
            <h5>Quick Links</h5>
            <Link to="/about">About Us</Link>
            <Link to="/dresses">Browse Collection</Link>
            <Link to="/process">How It Works</Link>
            <Link to="/faq">FAQ</Link>
            <Link to="/contact">Contact Us</Link>
          </div>

          {/* Support Column */}
          <div className="footer-links">
            <h5>Support</h5>
            <Link to="/help">Help Center</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/returns">Returns & Exchanges</Link>
            <Link to="/shipping">Shipping Info</Link>
          </div>

          {/* Contact Column */}
          <div className="footer-contact">
            <h5>Contact Us</h5>
            <p>
              <i className="ri-map-pin-line"></i>
              <span>Kathmandu</span>
            </p>
            <p>
              <i className="ri-phone-line"></i>
              <span>+977 98765 43210</span>
            </p>
            <p>
              <i className="ri-mail-line"></i>
              <span>care@gotrad.com</span>
            </p>
            <p>
              <i className="ri-time-line"></i>
              <span>Mon-Sat: 10am - 7pm</span>
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p>© {currentYear} GoTrad. All rights reserved. Crafted with tradition.</p>
          <div className="footer-bottom-links">
            <Link to="/sitemap">Sitemap</Link>
            <span className="separator">|</span>
            <Link to="/privacy">Privacy</Link>
            <span className="separator">|</span>
            <Link to="/terms">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;