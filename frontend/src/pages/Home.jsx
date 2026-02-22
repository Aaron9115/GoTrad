import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./Home.css";

export default function Home() {
  const [dresses, setDresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch real dresses from backend
  useEffect(() => {
    const fetchDresses = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/browse');
        
        if (!response.ok) {
          throw new Error('Failed to fetch dresses');
        }
        
        const data = await response.json();
        
        // Take only first 6 dresses for homepage display
        const recentDresses = data.slice(0, 6);
        setDresses(recentDresses);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dresses:', err);
        setError('Could not load dresses');
        setLoading(false);
      }
    };

    fetchDresses();
  }, []);

  return (
    <div className="home">
      {/* Reusable Navbar */}
      <Navbar />

      {/* HERO SECTION - New Background Image */}
      <section id="hero" className="hero">
        <div className="hero-bg-overlay"></div>
        <div className="hero-content">
          
          <h1>
            Celebrate <span className="gradient-text">Heritage</span><br />
            in Style
          </h1>
          <p className="hero-tagline">
            Rent exquisite traditional attire for weddings, festivals & special moments. 
            Authentic craftsmanship, effortless experience.
          </p>
          <div className="hero-buttons">
            <Link to="/dresses" className="btn-primary btn-large">
              <span>Explore Collection</span>
              <i className="ri-arrow-right-line"></i>
            </Link>
            <Link to="/process" className="btn-outline btn-large">
              <span>How It Works</span>
              <i className="ri-information-line"></i>
            </Link>
          </div>
          <div className="feature-badges">
            <div className="badge">
              <i className="ri-stack-line"></i>
              <span>500+ Dresses</span>
            </div>
            <div className="badge">
              <i className="ri-truck-line"></i>
              <span>Same Day Delivery</span>
            </div>
            <div className="badge">
              <i className="ri-verified-badge-line"></i>
              <span>Verified Quality</span>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT SECTION - Simple Cards */}
      <section id="about" className="section">
        <div className="container">
          <div className="section-header">
            <h2>Why rent with <span className="gradient-text">Heritage</span>?</h2>
            <p className="section-sub">Experience tradition with modern convenience</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <i className="ri-vip-diamond-line"></i>
              </div>
              <h3>Premium Quality</h3>
              <p>Curated collection of authentic handcrafted pieces, cleaned and pressed.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="ri-calendar-line"></i>
              </div>
              <h3>Flexible Rental</h3>
              <p>2, 4, or 7 days. Extended options available for destination weddings.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="ri-scissors-line"></i>
              </div>
              <h3>Perfect Fit</h3>
              <p>Free alterations. Our master tailors ensure flawless fitting.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="ri-refund-line"></i>
              </div>
              <h3>Easy Returns</h3>
              <p>Hassle-free pickup. Just pack and schedule — we handle the rest.</p>
            </div>
          </div>
        </div>
      </section>

      {/* DRESS COLLECTION - Simple Cards */}
      <section id="collection" className="section bg-light">
        <div className="container">
          <div className="section-header">
            <h2>Our <span className="gradient-text">Collection</span></h2>
            <p className="section-sub">Browse our traditional dresses</p>
          </div>
          
          <div className="filter-tabs">
            <button className="filter-btn active">All</button>
            <button className="filter-btn">Wedding</button>
            <button className="filter-btn">Festival</button>
            <button className="filter-btn">Party</button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading beautiful dresses...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="error-state">
              <i className="ri-error-warning-line"></i>
              <p>{error}</p>
            </div>
          )}

          {/* Dress Grid - REAL DRESSES FROM BACKEND */}
          {!loading && !error && (
            <div className="dress-grid">
              {dresses.length > 0 ? (
                dresses.map((dress) => (
                  <div key={dress._id} className="dress-card">
                    <div className="card-badge">{dress.category}</div>
                    <div className="image-wrapper">
                      <img 
                        src={dress.image || "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=500&q=80"} 
                        alt={dress.name}
                        className="card-img" 
                      />
                    </div>
                    <div className="card-info">
                      <span className="dress-type">{dress.category}</span>
                      <h4 className="dress-name">{dress.name}</h4>
                      <div className="price-row">
                        <span className="dress-price">₹{dress.price}</span>
                        <span className="per-day">/day</span>
                      </div>
                    </div>
                    <Link to={`/booking/${dress._id}`} className="rent-btn-card">Rent Now</Link>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <i className="ri-inbox-line"></i>
                  <h3>No dresses available</h3>
                  <p>Check back later for new additions</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* RENTAL PROCESS - Simple Cards */}
      <section id="process" className="section">
        <div className="container">
          <div className="section-header">
            <h2>Rental <span className="gradient-text">Process</span></h2>
            <p className="section-sub">Four simple steps to your perfect outfit</p>
          </div>
          <div className="process-grid">
            <div className="process-card">
              <div className="step-circle">1</div>
              <i className="ri-search-line process-icon"></i>
              <h4>Browse & Select</h4>
              <p>Explore our curated collection of authentic heritage pieces</p>
            </div>
            <div className="process-card">
              <div className="step-circle">2</div>
              <i className="ri-calendar-check-line process-icon"></i>
              <h4>Choose Dates</h4>
              <p>Pick your rental period — 2, 4, or 7 days</p>
            </div>
            <div className="process-card">
              <div className="step-circle">3</div>
              <i className="ri-t-shirt-2-line process-icon"></i>
              <h4>Try & Alter</h4>
              <p>Free home trial and alterations by master tailors</p>
            </div>
            <div className="process-card">
              <div className="step-circle">4</div>
              <i className="ri-return-line process-icon"></i>
              <h4>Wear & Return</h4>
              <p>Easy pickup after your event, professionally cleaned</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION - Simple Cards */}
      <section id="faq" className="section bg-light">
        <div className="container">
          <div className="section-header">
            <h2>Frequently <span className="gradient-text">Asked</span></h2>
            <p className="section-sub">Everything you need to know</p>
          </div>
          <div className="faq-simple-grid">
            <div className="faq-simple-card">
              <h4>What if the dress doesn't fit?</h4>
              <p>We offer free alterations. Simply schedule a trial fitting and our master tailors will adjust it perfectly. If it still doesn't work, you can exchange for another size at no extra cost.</p>
            </div>
            <div className="faq-simple-card">
              <h4>How is the dress cleaned?</h4>
              <p>Every dress is professionally dry-cleaned and sanitized after each rental. We use eco-friendly, hypoallergenic detergents safe for sensitive skin.</p>
            </div>
            <div className="faq-simple-card">
              <h4>What about late returns?</h4>
              <p>We offer a 24-hour grace period. Additional days are charged at 30% of the daily rate. You can also extend your rental directly from your account.</p>
            </div>
            <div className="faq-simple-card">
              <h4>Do you offer destination delivery?</h4>
              <p>Yes! We deliver to most wedding destinations. Additional shipping charges may apply based on location. Contact us for a quote.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT SECTION - Simple Cards */}
      <section id="contact" className="section">
        <div className="container">
          <div className="section-header">
            <h2>Get in <span className="gradient-text">Touch</span></h2>
            <p className="section-sub">We'd love to hear from you</p>
          </div>
          <div className="contact-simple-grid">
            {/* Left: Contact info cards */}
            <div className="contact-info-simple">
              <div className="contact-simple-card">
                <div className="contact-simple-icon">
                  <i className="ri-map-pin-line"></i>
                </div>
                <div>
                  <h4>Visit Us</h4>
                  <p>KATHMANDU</p>
                </div>
              </div>
              <div className="contact-simple-card">
                <div className="contact-simple-icon">
                  <i className="ri-phone-line"></i>
                </div>
                <div>
                  <h4>Call Us</h4>
                  <p>+977 98765 43210</p>
                  <p>Mon-Sat, 10am - 7pm</p>
                </div>
              </div>
              <div className="contact-simple-card">
                <div className="contact-simple-icon">
                  <i className="ri-mail-line"></i>
                </div>
                <div>
                  <h4>Email</h4>
                  <p>care@heritagerentals.com</p>
                  <p>24hr response</p>
                </div>
              </div>
              <div className="contact-simple-card">
                <div className="contact-simple-icon">
                  <i className="ri-time-line"></i>
                </div>
                <div>
                  <h4>Hours</h4>
                  <p>Mon-Fri: 10am - 7pm</p>
                  <p>Sat: 11am - 5pm</p>
                </div>
              </div>
            </div>
            {/* Right: Contact form */}
            <div className="contact-form-simple">
              <h3>Send a message</h3>
              <form>
                <div className="form-row">
                  <input type="text" placeholder="Full name" />
                  <input type="email" placeholder="Email" />
                </div>
                <div className="form-row">
                  <input type="tel" placeholder="Phone" />
                  <input type="date" placeholder="Event date" />
                </div>
                <textarea rows="4" placeholder="Tell us about your event..."></textarea>
                <button type="submit" className="btn-primary">
                  Send message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}