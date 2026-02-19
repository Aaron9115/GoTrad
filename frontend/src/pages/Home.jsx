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

      {/* HERO SECTION */}
      <section id="hero" className="hero">
        <div className="hero-bg-overlay"></div>
        <div className="hero-content glass-panel">
          
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

      {/* ABOUT SECTION */}
      <section id="about" className="section">
        <div className="container">
          <div className="section-header">
            <h2>Why rent with <span className="gradient-text">Heritage</span>?</h2>
            <p className="section-sub">Experience tradition with modern convenience</p>
          </div>
          <div className="features-grid">
            <div className="feature-card glass-panel">
              <div className="feature-icon">
                <i className="ri-vip-diamond-line"></i>
              </div>
              <h3>Premium Quality</h3>
              <p>Curated collection of authentic handcrafted pieces, cleaned and pressed.</p>
            </div>
            <div className="feature-card glass-panel">
              <div className="feature-icon">
                <i className="ri-calendar-line"></i>
              </div>
              <h3>Flexible Rental</h3>
              <p>2, 4, or 7 days. Extended options available for destination weddings.</p>
            </div>
            <div className="feature-card glass-panel">
              <div className="feature-icon">
                <i className="ri-scissors-line"></i>
              </div>
              <h3>Perfect Fit</h3>
              <p>Free alterations. Our master tailors ensure flawless fitting.</p>
            </div>
            <div className="feature-card glass-panel">
              <div className="feature-icon">
                <i className="ri-refund-line"></i>
              </div>
              <h3>Easy Returns</h3>
              <p>Hassle-free pickup. Just pack and schedule — we handle the rest.</p>
            </div>
          </div>
        </div>
      </section>

      {/* DRESS COLLECTION */}
      <section id="collection" className="section bg-white-soft">
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
                  <div key={dress._id} className="dress-card glass-panel">
                    <div className="card-badge">{dress.category}</div>
                    <div className="media-wrapper">
                      <img 
                        src={dress.image || "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=500&q=80"} 
                        alt={dress.name}
                        className="card-img" 
                      />
                      <div className="card-info">
                        <span className="dress-type">{dress.category}</span>
                        <h4 className="dress-name">{dress.name}</h4>
                        <span className="dress-price">₹{dress.price}<span>/day</span></span>
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

      {/* RENTAL PROCESS */}
      <section id="process" className="section">
        <div className="container">
          <div className="section-header">
            <h2>Rental <span className="gradient-text">Process</span></h2>
            <p className="section-sub">Four simple steps to your perfect outfit</p>
          </div>
          <div className="process-timeline">
            <div className="process-step">
              <div className="step-number">1</div>
              <div className="step-content glass-panel">
                <div className="step-icon">
                  <i className="ri-search-line"></i>
                </div>
                <h4>Browse & Select</h4>
                <p>Explore our curated collection of authentic heritage pieces</p>
              </div>
              <div className="step-connector"></div>
            </div>
            <div className="process-step">
              <div className="step-number">2</div>
              <div className="step-content glass-panel">
                <div className="step-icon">
                  <i className="ri-calendar-check-line"></i>
                </div>
                <h4>Choose Dates</h4>
                <p>Pick your rental period — 2, 4, or 7 days</p>
              </div>
              <div className="step-connector"></div>
            </div>
            <div className="process-step">
              <div className="step-number">3</div>
              <div className="step-content glass-panel">
                <div className="step-icon">
                  <i className="ri-t-shirt-2-line"></i>
                </div>
                <h4>Try & Alter</h4>
                <p>Free home trial and alterations by master tailors</p>
              </div>
              <div className="step-connector"></div>
            </div>
            <div className="process-step">
              <div className="step-number">4</div>
              <div className="step-content glass-panel">
                <div className="step-icon">
                  <i className="ri-return-line"></i>
                </div>
                <h4>Wear & Return</h4>
                <p>Easy pickup after your event, professionally cleaned</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="section bg-white-soft">
        <div className="container">
          <div className="section-header">
            <h2>Frequently <span className="gradient-text">Asked</span></h2>
            <p className="section-sub">Everything you need to know</p>
          </div>
          <div className="faq-grid">
            <div className="faq-item glass-panel">
              <div className="faq-question">
                <span>What if the dress doesn't fit?</span>
                <i className="ri-arrow-down-s-line"></i>
              </div>
              <div className="faq-answer">
                <p>We offer free alterations. Simply schedule a trial fitting and our master tailors will adjust it perfectly. If it still doesn't work, you can exchange for another size at no extra cost.</p>
              </div>
            </div>
            <div className="faq-item glass-panel">
              <div className="faq-question">
                <span>How is the dress cleaned?</span>
                <i className="ri-arrow-down-s-line"></i>
              </div>
              <div className="faq-answer">
                <p>Every dress is professionally dry-cleaned and sanitized after each rental. We use eco-friendly, hypoallergenic detergents safe for sensitive skin.</p>
              </div>
            </div>
            <div className="faq-item glass-panel">
              <div className="faq-question">
                <span>What about late returns?</span>
                <i className="ri-arrow-down-s-line"></i>
              </div>
              <div className="faq-answer">
                <p>We offer a 24-hour grace period. Additional days are charged at 30% of the daily rate. You can also extend your rental directly from your account.</p>
              </div>
            </div>
            <div className="faq-item glass-panel">
              <div className="faq-question">
                <span>Do you offer destination delivery?</span>
                <i className="ri-arrow-down-s-line"></i>
              </div>
              <div className="faq-answer">
                <p>Yes! We deliver to most wedding destinations. Additional shipping charges may apply based on location. Contact us for a quote.</p>
              </div>
            </div>
            <div className="faq-item glass-panel">
              <div className="faq-question">
                <span>Can I book a trial?</span>
                <i className="ri-arrow-down-s-line"></i>
              </div>
              <div className="faq-answer">
                <p>Absolutely. You can book a home trial of up to 3 dresses for $10 (refunded upon rental). Our stylist will assist you.</p>
              </div>
            </div>
            <div className="faq-item glass-panel">
              <div className="faq-question">
                <span>What if I damage the dress?</span>
                <i className="ri-arrow-down-s-line"></i>
              </div>
              <div className="faq-answer">
                <p>Minor wear is expected and covered. Significant damage is assessed case-by-case with a maximum charge of 40% of retail value.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section id="contact" className="section">
        <div className="container">
          <div className="section-header">
            <h2>Get in <span className="gradient-text">Touch</span></h2>
            <p className="section-sub">We'd love to hear from you</p>
          </div>
          <div className="contact-grid">
            {/* Left: Contact info cards */}
            <div className="contact-info">
              <div className="contact-card glass-panel">
                <div className="contact-icon">
                  <i className="ri-map-pin-line"></i>
                </div>
                <div className="contact-details">
                  <h4>Visit Us</h4>
                  <p>12 Heritage Lane, Andheri East, Mumbai 400069</p>
                </div>
              </div>
              <div className="contact-card glass-panel">
                <div className="contact-icon">
                  <i className="ri-phone-line"></i>
                </div>
                <div className="contact-details">
                  <h4>Call Us</h4>
                  <p>+91 98765 43210</p>
                  <p>Mon-Sat, 10am - 7pm</p>
                </div>
              </div>
              <div className="contact-card glass-panel">
                <div className="contact-icon">
                  <i className="ri-mail-line"></i>
                </div>
                <div className="contact-details">
                  <h4>Email</h4>
                  <p>care@heritagerentals.com</p>
                  <p>24hr response</p>
                </div>
              </div>
              <div className="contact-card glass-panel">
                <div className="contact-icon">
                  <i className="ri-time-line"></i>
                </div>
                <div className="contact-details">
                  <h4>Hours</h4>
                  <p>Mon-Fri: 10am - 7pm</p>
                  <p>Sat: 11am - 5pm</p>
                </div>
              </div>
            </div>
            {/* Right: Contact form */}
            <div className="contact-form glass-panel">
              <h3>Send a message</h3>
              <form>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Full name</label>
                    <input type="text" id="name" placeholder="John Doe" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" placeholder="john@example.com" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="phone">Phone</label>
                    <input type="tel" id="phone" placeholder="+91 98765 43210" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="event-date">Event date</label>
                    <input type="date" id="event-date" />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea id="message" rows="4" placeholder="Tell us about your event..."></textarea>
                </div>
                <button type="submit" className="btn-primary btn-large">
                  <span>Send message</span>
                  <i className="ri-send-plane-line"></i>
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