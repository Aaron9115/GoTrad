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
    total: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [user, setUser] = useState(null);
  const [dateError, setDateError] = useState("");

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // You can decode token or fetch user data
      setUser({ token });
    }
  }, []);

  // Fetch dress details
  useEffect(() => {
    const fetchDress = async () => {
      try {
        setLoading(true);
        // Try to get specific dress by ID
        const response = await fetch(`/api/browse`);
        const data = await response.json();
        // Find the specific dress by ID
        const foundDress = data.find(d => d._id === dressId);
        
        if (foundDress) {
          // Transform to match frontend structure
          setDress({
            _id: foundDress._id,
            name: foundDress.name,
            category: foundDress.category,
            size: foundDress.size,
            color: foundDress.color,
            pricePerDay: foundDress.price,
            description: `${foundDress.category} - ${foundDress.color} traditional dress`,
            images: [foundDress.image || "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80"],
            owner: foundDress.owner || { name: "Heritage Rental" },
            available: foundDress.available
          });
        } else {
          setError("Dress not found");
        }
        setError(null);
      } catch (err) {
        console.error("Error fetching dress:", err);
        // Fallback to mock data for demo
        setDress({
          _id: dressId,
          name: "Red Gunyu Cholo",
          category: "Wedding",
          size: "M",
          color: "Red",
          pricePerDay: 2500,
          description: "Traditional Nepali red Gunyu Cholo with gold embroidery, perfect for weddings and ceremonies.",
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
      
      // Validate dates
      if (end < start) {
        setDateError("End date cannot be before start date");
        return;
      }
      
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
      
      if (diffDays > 0 && diffDays <= 30) { // Max 30 days rental
        const subtotal = dress.pricePerDay * diffDays;
        const serviceFee = Math.round(subtotal * 0.05); // 5% service fee
        const total = subtotal + serviceFee;
        
        setPriceBreakdown({
          days: diffDays,
          subtotal,
          serviceFee,
          total
        });
        setDateError("");
      } else if (diffDays > 30) {
        setDateError("Maximum rental period is 30 days");
      }
    }
  }, [bookingData.startDate, bookingData.endDate, dress]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Get today's date for min date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = today.toISOString().split('T')[0];

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      // Redirect to login if not logged in
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

    setIsSubmitting(true);
    setError(null);

    try {
      // Get token from localStorage
      const token = localStorage.getItem("token");
      
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          dressId: dress._id,
          startDate: bookingData.startDate,
          endDate: bookingData.endDate
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Booking failed");
      }

      // Booking successful
      setBookingSuccess(true);
      
      // Reset form
      setBookingData({ startDate: "", endDate: "" });
      
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: "smooth" });

    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle view my bookings
  const viewMyBookings = () => {
    navigate("/my-bookings");
  };

  // Handle continue shopping
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

      {/* Success Message */}
      {bookingSuccess && (
        <div className="booking-success-banner">
          <div className="success-content">
            <i className="ri-checkbox-circle-line"></i>
            <div>
              <h3>Booking Confirmed!</h3>
              <p>Your dress has been successfully booked. Check your email for details.</p>
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

              <button
                type="submit"
                className={`btn-primary btn-large ${(!user || !dress.available || isSubmitting || dateError || !bookingData.startDate || !bookingData.endDate || bookingSuccess) ? "disabled" : ""}`}
                disabled={!user || !dress.available || isSubmitting || dateError || !bookingData.startDate || !bookingData.endDate || bookingSuccess}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-small"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <i className="ri-check-line"></i>
                    Confirm Booking
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column - Dress Summary & Price Breakdown */}
          <div className="booking-summary-section">
            {/* Dress Summary Card */}
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
                <span>Rented by: {dress.owner.name}</span>
              </div>
            </div>

            {/* Price Breakdown Card */}
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
                  <div className="price-divider"></div>
                  <div className="price-row total">
                    <span>Total Amount</span>
                    <span className="total-amount">₹{priceBreakdown.total}</span>
                  </div>
                </>
              ) : (
                <div className="no-dates-selected">
                  <i className="ri-calendar-todo-line"></i>
                  <p>Select start and end dates to see price breakdown</p>
                </div>
              )}
            </div>

            {/* Booking Policy Card */}
            <div className="policy-card glass-panel">
              <h3>Booking Policy</h3>
              <ul className="policy-list">
                <li>
                  <i className="ri-check-line"></i>
                  <span>Free cancellation up to 48 hours before rental</span>
                </li>
                <li>
                  <i className="ri-check-line"></i>
                  <span>Professional dry cleaning included</span>
                </li>
                <li>
                  <i className="ri-check-line"></i>
                  <span>Free delivery within city limits</span>
                </li>
                <li>
                  <i className="ri-check-line"></i>
                  <span>Security deposit may apply</span>
                </li>
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