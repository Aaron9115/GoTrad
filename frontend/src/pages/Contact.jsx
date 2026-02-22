import React, { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./Contact.css";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("http://localhost:5000/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send message");
      }

      setSuccess(data.message);
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: ""
      });

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: "ri-map-pin-line",
      title: "Visit Us",
      details: ["Kathmandu, Nepal"],
    },
    {
      icon: "ri-phone-line",
      title: "Call Us",
      details: ["+977 98765 43210", "+977 98765 43211"],
      note: "Mon-Sat, 10am - 7pm"
    },
    {
      icon: "ri-mail-line",
      title: "Email Us",
      details: ["care@gotrad.com", "support@gotrad.com"],
      note: "24hr response time"
    },
    {
      icon: "ri-time-line",
      title: "Business Hours",
      details: ["Monday - Friday: 10am - 7pm", "Saturday: 11am - 5pm", "Sunday: Closed"]
    }
  ];

  const faqs = [
    {
      question: "How quickly do you respond?",
      answer: "We typically respond within 2-4 hours during business hours. For urgent inquiries, please call us directly."
    },
    {
      question: "Can I visit your showroom?",
      answer: "Yes! We have a physical showroom where you can see our collection. Please schedule an appointment first."
    },
    {
      question: "Do you offer international shipping?",
      answer: "Yes, we ship internationally. Additional charges may apply based on your location."
    },
    {
      question: "How do I track my order?",
      answer: "Once your order is shipped, you'll receive a tracking number via email and SMS."
    }
  ];

  return (
    <div className="contact-page">
      <Navbar />
      
      <div className="contact-container">
        {/* Header */}
        <div className="contact-header">
          <h1>Get in <span className="gradient-text">Touch</span></h1>
          <p>We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="success-message">
            <i className="ri-checkbox-circle-line"></i>
            <div>
              <h3>Message Sent!</h3>
              <p>{success}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="error-message">
            <i className="ri-error-warning-line"></i>
            <div>
              <h3>Something went wrong</h3>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="contact-grid">
          {/* Left Column - Contact Info */}
          <div className="contact-info-section">
            <h2>Contact Information</h2>
            <p className="info-subtitle">Choose your preferred way to reach us</p>

            <div className="info-cards">
              {contactInfo.map((info, index) => (
                <div key={index} className="info-card glass-panel">
                  <div className="info-icon">
                    <i className={info.icon}></i>
                  </div>
                  <div className="info-content">
                    <h3>{info.title}</h3>
                    {info.details.map((detail, i) => (
                      <p key={i}>{detail}</p>
                    ))}
                    {info.note && <span className="info-note">{info.note}</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Social Links */}
            <div className="social-section">
              <h3>Follow Us</h3>
              <div className="social-links">
                <a href="#" className="social-link facebook">
                  <i className="ri-facebook-fill"></i>
                </a>
                <a href="#" className="social-link instagram">
                  <i className="ri-instagram-line"></i>
                </a>
                <a href="#" className="social-link twitter">
                  <i className="ri-twitter-x-line"></i>
                </a>
                <a href="#" className="social-link linkedin">
                  <i className="ri-linkedin-fill"></i>
                </a>
                <a href="#" className="social-link youtube">
                  <i className="ri-youtube-line"></i>
                </a>
              </div>
            </div>

            {/* Map */}
            <div className="map-container glass-panel">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3769.588464315904!2d72.8882564!3d19.1137017!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c97f346053b7%3A0xacf72f56793d190a!2sAndheri%20East%2C%20Mumbai%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                width="100%"
                height="250"
                style={{ border: 0, borderRadius: '16px' }}
                allowFullScreen=""
                loading="lazy"
                title="Google Maps"
              ></iframe>
            </div>
          </div>

          {/* Right Column - Contact Form */}
          <div className="contact-form-section glass-panel">
            <h2>Send a Message</h2>
            <p className="form-subtitle">Fill out the form and we'll get back to you within 24 hours</p>

            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">
                    <i className="ri-user-line"></i>
                    Your Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">
                    <i className="ri-mail-line"></i>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">
                    <i className="ri-phone-line"></i>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subject">
                    <i className="ri-question-line"></i>
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="What is this about?"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="message">
                  <i className="ri-message-line"></i>
                  Your Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us more about your inquiry..."
                  rows="6"
                  required
                ></textarea>
              </div>

              <div className="form-footer">
                <p className="form-note">
                  <i className="ri-information-line"></i>
                  Fields marked with * are required
                </p>
                <button 
                  type="submit" 
                  className="btn-primary btn-large"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-small"></span>
                      Sending...
                    </>
                  ) : (
                    <>
                      <i className="ri-send-plane-line"></i>
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="contact-faq">
          <h2>Frequently Asked <span className="gradient-text">Questions</span></h2>
          <div className="faq-grid">
            {faqs.map((faq, index) => (
              <div key={index} className="faq-card glass-panel">
                <h3>
                  <i className="ri-question-line"></i>
                  {faq.question}
                </h3>
                <p>{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="contact-cta glass-panel">
          <div className="cta-content">
            <h2>Prefer to talk?</h2>
            <p>Call us directly and speak with our customer support team</p>
            <a href="tel:+977 9800000000" className="btn-primary btn-large">
              <i className="ri-phone-line"></i>
              +977 9800000000
            </a>
          </div>
          <div className="cta-image">
            <i className="ri-customer-service-line"></i>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Contact;