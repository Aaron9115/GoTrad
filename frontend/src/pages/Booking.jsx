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
    endDate: "",
    address: "",
    city: "",
    phone: ""
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
  const [backendStatus, setBackendStatus] = useState('checking');

  // Check if backend is running
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/browse', {
          method: 'HEAD',
          signal: AbortSignal.timeout(2000)
        });
        setBackendStatus('online');
        console.log(' Backend is running');
      } catch (err) {
        setBackendStatus('offline');
        console.log(' Backend is offline');
      }
    };
    checkBackend();
  }, []);

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      // Pre-fill phone if available in user data
      if (parsedUser.phone) {
        setBookingData(prev => ({ ...prev, phone: parsedUser.phone }));
      }
    }
  }, []);

  // Fetch dress details by ID
  useEffect(() => {
    const fetchDressById = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`Fetching dress with ID: ${dressId}`);
        
        // Try to fetch from backend first
        if (backendStatus === 'online') {
          // First try to get all dresses and find by ID
          const response = await fetch(`http://localhost:5000/api/browse`);
          
          if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
          }

          const data = await response.json();
          console.log('Received all dresses:', data);
          
          // Find the dress with matching ID
          const foundDress = data.find(d => d._id === dressId);
          
          if (foundDress) {
            console.log('Found dress:', foundDress);
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
              available: foundDress.available !== undefined ? foundDress.available : true
            });
          } else {
            // Try to fetch single dress if endpoint exists
            try {
              const singleResponse = await fetch(`http://localhost:5000/api/dress/${dressId}`);
              if (singleResponse.ok) {
                const singleDress = await singleResponse.json();
                setDress({
                  _id: singleDress._id,
                  name: singleDress.name,
                  category: singleDress.category,
                  size: singleDress.size,
                  color: singleDress.color,
                  pricePerDay: singleDress.price,
                  description: singleDress.description,
                  images: [singleDress.image || "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80"],
                  owner: singleDress.owner || { name: "Heritage Rental" },
                  available: singleDress.available
                });
              } else {
                setError("Dress not found in database");
              }
            } catch (err) {
              setError("Dress not found in database");
            }
          }
        } else {
          // Backend offline - show error instead of mock data
          setError("Cannot connect to server. Please make sure backend is running.");
        }
      } catch (err) {
        console.error("Error fetching dress:", err);
        setError(err.message || "Failed to load dress details");
      } finally {
        setLoading(false);
      }
    };

    if (dressId && backendStatus !== 'checking') {
      fetchDressById();
    }
  }, [dressId, backendStatus]);

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
        const securityDeposit = 1000;
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

    // Validate address fields
    if (!bookingData.address.trim()) {
      setError("Please enter your delivery address");
      return;
    }
    if (!bookingData.city.trim()) {
      setError("Please enter your city");
      return;
    }
    if (!bookingData.phone.trim()) {
      setError("Please enter your phone number");
      return;
    }
    if (!/^\d{10}$/.test(bookingData.phone.replace(/\D/g, ''))) {
      setError("Please enter a valid 10-digit phone number");
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
          address: bookingData.address,
          city: bookingData.city,
          phone: bookingData.phone,
          securityDeposit: 1000,
          totalAmount: priceBreakdown.total
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Booking failed");
      }

      setBookingSuccess(true);
      // Reset only date and address fields, keep phone for next time
      setBookingData(prev => ({ 
        startDate: "", 
        endDate: "",
        address: "",
        city: "",
        phone: prev.phone // Keep phone for next time
      }));
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

  if (!dress && !loading && error) {
    return (
      <div className="booking-page">
        <Navbar />
        <div className="error-state">
          <i className="ri-error-warning-line"></i>
          <h3>Error Loading Dress</h3>
          <p>{error}</p>
          <Link to="/dresses" className="btn-primary">
            Browse Collection
          </Link>
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
              <h3>Booking Request Sent!</h3>
              <p>Your booking request has been sent to the owner. You'll be notified once they confirm.</p>
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
            
            {backendStatus === 'offline' && (
              <div className="backend-offline-warning">
                <i className="ri-server-line"></i>
                <p>Backend server not running. Please start the server to book.</p>
              </div>
            )}

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
              {/* Date Selection */}
              <div className="form-group">
                <label htmlFor="startDate">
                  <i className="ri-calendar-line"></i>
                  Start Date *
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={bookingData.startDate}
                  onChange={handleChange}
                  min={minDate}
                  required
                  disabled={!user || !dress.available || bookingSuccess || backendStatus === 'offline'}
                />
              </div>

              <div className="form-group">
                <label htmlFor="endDate">
                  <i className="ri-calendar-line"></i>
                  End Date *
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={bookingData.endDate}
                  onChange={handleChange}
                  min={bookingData.startDate || minDate}
                  required
                  disabled={!user || !dress.available || bookingSuccess || backendStatus === 'offline'}
                />
              </div>

              {dateError && (
                <div className="date-error">
                  <i className="ri-error-warning-line"></i>
                  {dateError}
                </div>
              )}

              {/* Delivery Address */}
              <div className="form-group">
                <label htmlFor="address">
                  <i className="ri-map-pin-line"></i>
                  Delivery Address *
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={bookingData.address}
                  onChange={handleChange}
                  placeholder="Street address, apartment, etc."
                  required
                  disabled={!user || !dress.available || bookingSuccess || backendStatus === 'offline'}
                />
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="city">
                    <i className="ri-building-line"></i>
                    City *
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={bookingData.city}
                    onChange={handleChange}
                    placeholder="Your city"
                    required
                    disabled={!user || !dress.available || bookingSuccess || backendStatus === 'offline'}
                  />
                </div>

                <div className="form-group half">
                  <label htmlFor="phone">
                    <i className="ri-phone-line"></i>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={bookingData.phone}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    required
                    disabled={!user || !dress.available || bookingSuccess || backendStatus === 'offline'}
                  />
                </div>
              </div>

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
                    disabled={backendStatus === 'offline'}
                  />
                  <span>
                    I agree to the <Link to="/terms">terms and conditions</Link>. I understand that ₹1000 security deposit will be refunded upon safe return of the dress.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className={`btn-primary btn-large ${(!user || !dress.available || isSubmitting || dateError || !bookingData.startDate || !bookingData.endDate || !bookingData.address || !bookingData.city || !bookingData.phone || bookingSuccess || !agreedToTerms || backendStatus === 'offline') ? "disabled" : ""}`}
                disabled={!user || !dress.available || isSubmitting || dateError || !bookingData.startDate || !bookingData.endDate || !bookingData.address || !bookingData.city || !bookingData.phone || bookingSuccess || !agreedToTerms || backendStatus === 'offline'}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-small"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <i className="ri-check-line"></i>
                    Send Booking Request
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
                <li><i className="ri-check-line"></i> Owner will confirm your booking within 24 hours</li>
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