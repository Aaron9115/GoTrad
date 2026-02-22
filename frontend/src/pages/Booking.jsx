import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./Booking.css";

const BookingPage = () => {
  const { dressId } = useParams();
  const navigate = useNavigate();
  const [dress, setDress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingData, setBookingData] = useState({
    startDate: "",
    endDate: ""
  });
  const [priceBreakdown, setPriceBreakdown] = useState({
    days: 0,
    subtotal: 0,
    serviceFee: 0,
    securityDeposit: 1000,
    total: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [user, setUser] = useState(null);
  const [dateError, setDateError] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setUser({ token });
    }
  }, []);

  // Fetch dress details
  useEffect(() => {
    const fetchDress = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/browse`);
        const data = await response.json();
        const foundDress = data.find(d => d._id === dressId);
        
        if (foundDress) {
          setDress({
            _id: foundDress._id,
            name: foundDress.name,
            category: foundDress.category,
            size: foundDress.size,
            color: foundDress.color,
            pricePerDay: foundDress.price,
            description: foundDress.description || `${foundDress.category} - ${foundDress.color} traditional dress`,
            images: [foundDress.image || "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80"],
            owner: foundDress.owner || { name: "Heritage Rental" },
            available: foundDress.available
          });
        } else {
          setError("Dress not found");
        }
      } catch (err) {
        console.error("Error fetching dress:", err);
        setDress({
          _id: dressId,
          name: "Red Gunyu Cholo",
          category: "Wedding",
          size: "M",
          color: "Red",
          pricePerDay: 2500,
          description: "Traditional Nepali red Gunyu Cholo with gold embroidery",
          images: ["https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80"],
          owner: { name: "Himalayan Heritage" },
          available: true
        });
      } finally {
        setLoading(false);
      }
    };

    if (dressId) {
      fetchDress();
    }
  }, [dressId]);

  // Calculate price when dates change
  useEffect(() => {
    if (bookingData.startDate && bookingData.endDate && dress) {
      const start = new Date(bookingData.startDate);
      const end = new Date(bookingData.endDate);
      
      if (end < start) {
        setDateError("End date cannot be before start date");
        return;
      }
      
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      if (diffDays > 0 && diffDays <= 30) {
        const subtotal = dress.pricePerDay * diffDays;
        const serviceFee = Math.round(subtotal * 0.05);
        const securityDeposit = 1000; // Fixed security deposit
        const total = subtotal + serviceFee + securityDeposit;
        
        setPriceBreakdown({
          days: diffDays,
          subtotal,
          serviceFee,
          securityDeposit,
          total
        });
        setDateError("");
      } else if (diffDays > 30) {
        setDateError("Maximum rental period is 30 days");
      }
    }
  }, [bookingData.startDate, bookingData.endDate, dress]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = today.toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      navigate("/login", { state: { from: `/booking/${dressId}` } });
      return;
    }

    if (!dress.available) {
      setError("This dress is no longer available for booking");
      return;
    }

    if (dateError) {
      return;
    }

    if (!agreedToTerms) {
      setError("Please agree to the terms and conditions");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch("http://localhost:5000/api/booking/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          dressId: dress._id,
          startDate: bookingData.startDate,
          endDate: bookingData.endDate,
          securityDeposit: 1000
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Booking failed");
      }

      setBookingSuccess(true);
      setBookingData({ startDate: "", endDate: "" });
      window.scrollTo({ top: 0, behavior: "smooth" });

    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewMyBookings = () => {
    navigate("/my-bookings");
  };

  const continueShopping = () => {
    navigate("/dresses");
  };

  if (loading) {
    return (
      <div className="booking-page">
        <Navbar />
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading dress details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!dress && !loading) {
    return (
      <div className="booking-page">
        <Navbar />
        <div className="error-state">
          <i className="ri-error-warning-line"></i>
          <h3>Dress Not Found</h3>
          <p>The dress you're looking for doesn't exist or has been removed.</p>
          <Link to="/dresses" className="btn-primary">
            Browse Collection
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="booking-page">
      <Navbar />

      {bookingSuccess && (
        <div className="booking-success-banner">
          <div className="success-content">
            <i className="ri-checkbox-circle-line"></i>
            <div>
              <h3>Booking Confirmed!</h3>
              <p>Your dress has been successfully booked. ₹1000 security deposit will be refunded upon return.</p>
            </div>
            <div className="success-actions">
              <button onClick={viewMyBookings} className="btn-outline">
                View My Bookings
              </button>
              <button onClick={continueShopping} className="btn-primary">
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="booking-container">
        <div className="booking-header">
          <h1>Complete Your Booking</h1>
          <p>Review your details and confirm your rental</p>
        </div>

        <div className="booking-grid">
          {/* Left Column - Booking Form */}
          <div className="booking-form-section glass-panel">
            <h2>Rental Details</h2>
            
            {!user && (
              <div className="login-warning glass-panel">
                <i className="ri-information-line"></i>
                <p>You need to be logged in to book a dress.</p>
                <Link to="/login" state={{ from: `/booking/${dressId}` }} className="btn-primary">
                  Login to Continue
                </Link>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="startDate">
                  <i className="ri-calendar-line"></i>
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={bookingData.startDate}
                  onChange={handleChange}
                  min={minDate}
                  required
                  disabled={!user || !dress.available || bookingSuccess}
                />
              </div>

              <div className="form-group">
                <label htmlFor="endDate">
                  <i className="ri-calendar-line"></i>
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={bookingData.endDate}
                  onChange={handleChange}
                  min={bookingData.startDate || minDate}
                  required
                  disabled={!user || !dress.available || bookingSuccess}
                />
              </div>

              {dateError && (
                <div className="date-error">
                  <i className="ri-error-warning-line"></i>
                  {dateError}
                </div>
              )}

              {error && (
                <div className="error-message">
                  <i className="ri-error-warning-line"></i>
                  {error}
                </div>
              )}

              {!dress.available && (
                <div className="unavailable-warning">
                  <i className="ri-information-line"></i>
                  This dress is currently not available for booking.
                </div>
              )}

              {/* Terms Agreement */}
              <div className="terms-agreement">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                  />
                  <span>
                    I agree to the <Link to="/terms">terms and conditions</Link>. I understand that ₹1000 security deposit will be refunded upon safe return of the dress.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className={`btn-primary btn-large ${(!user || !dress.available || isSubmitting || dateError || !bookingData.startDate || !bookingData.endDate || bookingSuccess || !agreedToTerms) ? "disabled" : ""}`}
                disabled={!user || !dress.available || isSubmitting || dateError || !bookingData.startDate || !bookingData.endDate || bookingSuccess || !agreedToTerms}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-small"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <i className="ri-check-line"></i>
                    Pay ₹{priceBreakdown.total} & Confirm
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column - Dress Summary & Price Breakdown */}
          <div className="booking-summary-section">
            <div className="dress-summary-card glass-panel">
              <h2>Your Selection</h2>
              
              <div className="summary-dress">
                <div className="summary-image">
                  <img src={dress.images[0]} alt={dress.name} />
                </div>
                <div className="summary-details">
                  <h3>{dress.name}</h3>
                  <p className="summary-category">{dress.category}</p>
                  <div className="summary-specs">
                    <span className="spec-badge">
                      <i className="ri-ruler-line"></i> Size: {dress.size}
                    </span>
                    <span className="spec-badge">
                      <i className="ri-palette-line"></i> {dress.color}
                    </span>
                  </div>
                  <p className="summary-price">₹{dress.pricePerDay}<span>/day</span></p>
                </div>
              </div>

              <div className="owner-info">
                <i className="ri-user-line"></i>
                <span>Owner: {dress.owner.name}</span>
              </div>
            </div>

            <div className="price-breakdown-card glass-panel">
              <h2>Price Details</h2>
              
              {bookingData.startDate && bookingData.endDate && !dateError ? (
                <>
                  <div className="price-row">
                    <span>Rental Period</span>
                    <span className="price-days">{priceBreakdown.days} days</span>
                  </div>
                  <div className="price-row">
                    <span>Subtotal (₹{dress.pricePerDay} × {priceBreakdown.days} days)</span>
                    <span>₹{priceBreakdown.subtotal}</span>
                  </div>
                  <div className="price-row">
                    <span>Service Fee (5%)</span>
                    <span>₹{priceBreakdown.serviceFee}</span>
                  </div>
                  <div className="price-row highlight">
                    <span>Security Deposit (Refundable)</span>
                    <span className="security-deposit">₹{priceBreakdown.securityDeposit}</span>
                  </div>
                  <div className="price-divider"></div>
                  <div className="price-row total">
                    <span>Total Amount</span>
                    <span className="total-amount">₹{priceBreakdown.total}</span>
                  </div>
                  <p className="deposit-note">
                    <i className="ri-information-line"></i>
                    Security deposit will be refunded within 5-7 days after return verification
                  </p>
                </>
              ) : (
                <div className="no-dates-selected">
                  <i className="ri-calendar-todo-line"></i>
                  <p>Select start and end dates to see price breakdown</p>
                </div>
              )}
            </div>

            <div className="policy-card glass-panel">
              <h3>Booking Policy</h3>
              <ul className="policy-list">
                <li><i className="ri-check-line"></i> Free cancellation up to 48 hours before rental</li>
                <li><i className="ri-check-line"></i> Professional dry cleaning included</li>
                <li><i className="ri-check-line"></i> Free delivery within city limits</li>
                <li><i className="ri-check-line"></i> ₹1000 refundable security deposit</li>
                <li><i className="ri-check-line"></i> Damage charges deducted from deposit</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BookingPage;