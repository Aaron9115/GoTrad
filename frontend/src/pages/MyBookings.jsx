import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./MyBookings.css";

const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  // Fetch user's bookings
  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch("http://localhost:5000/api/booking/my", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch bookings");
      }

      const data = await response.json();
      setBookings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel booking
  const handleCancelClick = (booking) => {
    setSelectedBooking(booking);
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    if (!selectedBooking) return;

    setCancelLoading(selectedBooking._id);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`http://localhost:5000/api/booking/cancel/${selectedBooking._id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to cancel booking");
      }

      // Update the booking in the list
      setBookings(prev => prev.map(booking => 
        booking._id === selectedBooking._id 
          ? { ...booking, status: "cancelled" } 
          : booking
      ));

      setShowCancelModal(false);
      setSelectedBooking(null);

    } catch (err) {
      setError(err.message);
    } finally {
      setCancelLoading(null);
    }
  };

  // Filter bookings based on active tab
  const getFilteredBookings = () => {
    const now = new Date();
    
    switch(activeTab) {
      case "active":
        return bookings.filter(b => 
          (b.status === "confirmed" || b.status === "booked") && new Date(b.endDate) >= now
        );
      case "pending":
        return bookings.filter(b => b.status === "pending");
      case "past":
        return bookings.filter(b => 
          b.status === "returned" || 
          (b.status === "confirmed" && new Date(b.endDate) < now)
        );
      case "cancelled":
        return bookings.filter(b => b.status === "cancelled");
      case "returned":
        return bookings.filter(b => b.status === "returned");
      default:
        return bookings;
    }
  };

  const filteredBookings = getFilteredBookings();

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate total days and price
  const calculateTotal = (booking) => {
    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const subtotal = booking.dress?.price * days;
    const serviceFee = Math.round(subtotal * 0.05);
    return {
      days,
      subtotal,
      serviceFee,
      total: subtotal + serviceFee
    };
  };

  // Get status badge class
  const getStatusClass = (status) => {
    switch(status) {
      case "pending": return "status-pending";
      case "confirmed": return "status-active";
      case "booked": return "status-active";
      case "returned": return "status-completed";
      case "cancelled": return "status-cancelled";
      default: return "";
    }
  };

  // Get status display text
  const getStatusText = (status) => {
    switch(status) {
      case "pending": return "Awaiting Approval";
      case "confirmed": return "Confirmed";
      case "booked": return "Active";
      case "returned": return "Returned";
      case "cancelled": return "Cancelled";
      default: return status;
    }
  };

  // Check if booking is in return process
  const isReturnInProgress = (booking) => {
    return booking.returnStatus === "pending" || booking.returnStatus === "under_review";
  };

  // Check if return is resolved by owner
  const isReturnResolved = (booking) => {
    return booking.returnStatus === "resolved" || booking.returnStatus === "approved" || booking.returnStatus === "rejected";
  };

  if (loading) {
    return (
      <div className="my-bookings-page">
        <Navbar />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading your bookings...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="my-bookings-page">
      <Navbar />

      <div className="bookings-container">
        {/* Header */}
        <div className="bookings-header">
          <h1>My <span className="gradient-text">Bookings</span></h1>
          <p>View and manage your dress rentals</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <i className="ri-error-warning-line"></i>
            <span>{error}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="bookings-tabs">
          <button 
            className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All ({bookings.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === "pending" ? "active" : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            Pending Approval
          </button>
          <button 
            className={`tab-btn ${activeTab === "active" ? "active" : ""}`}
            onClick={() => setActiveTab("active")}
          >
            Active
          </button>
          <button 
            className={`tab-btn ${activeTab === "past" ? "active" : ""}`}
            onClick={() => setActiveTab("past")}
          >
            Past
          </button>
          <button 
            className={`tab-btn ${activeTab === "returned" ? "active" : ""}`}
            onClick={() => setActiveTab("returned")}
          >
            Returned
          </button>
          <button 
            className={`tab-btn ${activeTab === "cancelled" ? "active" : ""}`}
            onClick={() => setActiveTab("cancelled")}
          >
            Cancelled
          </button>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="empty-state">
            <i className="ri-calendar-line"></i>
            <h3>No bookings found</h3>
            <p>You haven't made any bookings yet</p>
            <Link to="/dresses" className="btn-primary">
              Browse Dresses
            </Link>
          </div>
        ) : (
          <div className="bookings-list">
            {filteredBookings.map((booking) => {
              const priceDetails = calculateTotal(booking);
              // Show cancel button for pending or confirmed bookings
              const canCancel = booking.status === "pending" || booking.status === "confirmed" || booking.status === "booked";
              // Show return button for confirmed bookings after rental period
              const canReturn = (booking.status === "confirmed" || booking.status === "booked") && new Date(booking.endDate) <= new Date() && !isReturnInProgress(booking) && !isReturnResolved(booking);
              // Show return in progress badge
              const returnInProgress = isReturnInProgress(booking);
              // Show return resolved details
              const returnResolved = isReturnResolved(booking);
              
              return (
                <div key={booking._id} className="booking-card glass-panel">
                  {/* Dress Image */}
                  <div className="booking-image">
                    <img 
                      src={booking.dress?.image || "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80"} 
                      alt={booking.dress?.name}
                    />
                  </div>

                  {/* Booking Details */}
                  <div className="booking-details">
                    <div className="booking-header">
                      <div>
                        <h3>{booking.dress?.name || "Dress"}</h3>
                        <p className="dress-category">{booking.dress?.category}</p>
                      </div>
                      <span className={`booking-status ${getStatusClass(booking.status)}`}>
                        {getStatusText(booking.status)}
                      </span>
                    </div>

                    {/* Delivery Info - Show for confirmed bookings */}
                    {(booking.status === "confirmed" || booking.status === "booked") && booking.deliveryAddress && (
                      <div className="delivery-info">
                        <div className="info-item">
                          <i className="ri-map-pin-line"></i>
                          <span>{booking.deliveryAddress.address}, {booking.deliveryAddress.city}</span>
                        </div>
                        <div className="info-item">
                          <i className="ri-phone-line"></i>
                          <span>{booking.deliveryAddress.phone}</span>
                        </div>
                      </div>
                    )}

                    <div className="booking-dates">
                      <div className="date-item">
                        <i className="ri-calendar-check-line"></i>
                        <div>
                          <span className="date-label">Start Date</span>
                          <span className="date-value">{formatDate(booking.startDate)}</span>
                        </div>
                      </div>
                      <div className="date-item">
                        <i className="ri-calendar-close-line"></i>
                        <div>
                          <span className="date-label">End Date</span>
                          <span className="date-value">{formatDate(booking.endDate)}</span>
                        </div>
                      </div>
                      <div className="date-item">
                        <i className="ri-time-line"></i>
                        <div>
                          <span className="date-label">Duration</span>
                          <span className="date-value">{priceDetails.days} days</span>
                        </div>
                      </div>
                    </div>

                    <div className="booking-specs">
                      {booking.dress?.size && (
                        <span className="spec">
                          <i className="ri-ruler-line"></i> Size: {booking.dress.size}
                        </span>
                      )}
                      {booking.dress?.color && (
                        <span className="spec">
                          <i className="ri-palette-line"></i> Color: {booking.dress.color}
                        </span>
                      )}
                    </div>

                    <div className="booking-price">
                      <div className="price-breakdown">
                        <span>Subtotal ({priceDetails.days} days)</span>
                        <span>₹{priceDetails.subtotal}</span>
                      </div>
                      <div className="price-breakdown">
                        <span>Service Fee (5%)</span>
                        <span>₹{priceDetails.serviceFee}</span>
                      </div>
                      <div className="price-total">
                        <span>Total Paid</span>
                        <span className="total-amount">₹{priceDetails.total}</span>
                      </div>
                    </div>

                    {/* Pending Approval Notice */}
                    {booking.status === "pending" && (
                      <div className="pending-approval">
                        <i className="ri-time-line"></i>
                        <span>Awaiting owner confirmation. You'll be notified once confirmed.</span>
                      </div>
                    )}

                    {/* ========== RETURN RESOLUTION SECTION ========== */}
                    {returnResolved && booking.returnResolution && (
                      <div className="return-resolution-section">
                        <h4 className="resolution-title">
                          <i className="ri-checkbox-circle-line"></i>
                          Return Resolution
                        </h4>
                        
                        <div className="resolution-details">
                          <div className="resolution-row">
                            <span className="resolution-label">Owner Condition:</span>
                            <span className="resolution-value">{booking.returnResolution.ownerCondition || "Good"}</span>
                          </div>
                          
                          <div className="resolution-row">
                            <span className="resolution-label">Return Method:</span>
                            <span className="resolution-value">{booking.returnResolution.returnMethod || "Courier"}</span>
                          </div>
                          
                          {booking.returnResolution.returnAddress && (
                            <div className="resolution-row">
                              <span className="resolution-label">Return Address:</span>
                              <span className="resolution-value">{booking.returnResolution.returnAddress}</span>
                            </div>
                          )}
                          
                          {booking.returnResolution.ownerNotes && (
                            <div className="resolution-row">
                              <span className="resolution-label">Owner Notes:</span>
                              <span className="resolution-value">{booking.returnResolution.ownerNotes}</span>
                            </div>
                          )}
                          
                          <div className="resolution-divider"></div>
                          
                          <div className="resolution-row highlight">
                            <span className="resolution-label">Security Deposit:</span>
                            <span className="resolution-value">₹{booking.returnResolution.securityDeposit || 1000}</span>
                          </div>
                          
                          <div className="resolution-row">
                            <span className="resolution-label">Deduction:</span>
                            <span className="resolution-value deduction">- ₹{booking.returnResolution.deduction || 0}</span>
                          </div>
                          
                          <div className="resolution-row total">
                            <span className="resolution-label">Refund Amount:</span>
                            <span className="resolution-value refund">₹{booking.returnResolution.refundAmount || 1000}</span>
                          </div>
                          
                          <div className="resolution-badge">
                            {booking.returnResolution.resolution === "full_refund" ? (
                              <span className="badge-full">✅ Full Refund</span>
                            ) : booking.returnResolution.resolution === "partial_refund" ? (
                              <span className="badge-partial">⚠️ Partial Refund</span>
                            ) : booking.returnResolution.resolution === "no_refund" ? (
                              <span className="badge-none">❌ No Refund</span>
                            ) : (
                              <span className="badge-full">✅ Full Refund</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Return In Progress Badge */}
                    {returnInProgress && (
                      <div className="return-in-progress">
                        <i className="ri-timer-line"></i>
                        <span>Return in progress - Awaiting owner review</span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="booking-actions">
                      <Link to={`/dress/${booking.dress?._id}`} className="btn-outline-small">
                        <i className="ri-eye-line"></i> View Dress
                      </Link>
                      
                      {/* Cancel Button - for pending or confirmed bookings */}
                      {canCancel && (
                        <button 
                          className="btn-cancel"
                          onClick={() => handleCancelClick(booking)}
                          disabled={cancelLoading === booking._id}
                        >
                          {cancelLoading === booking._id ? (
                            <>
                              <span className="spinner-small"></span>
                              Cancelling...
                            </>
                          ) : (
                            <>
                              <i className="ri-close-line"></i> Cancel Booking
                            </>
                          )}
                        </button>
                      )}

                      {/* Return Button - Only show after rental period */}
                      {canReturn && (
                        <Link 
                          to={`/return/${booking._id}`} 
                          className="btn-return"
                        >
                          <i className="ri-upload-line"></i> Return Dress
                        </Link>
                      )}

                      {/* View Return Status Button - for returns in progress */}
                      {returnInProgress && (
                        <Link 
                          to={`/return-status/${booking._id}`} 
                          className="btn-view-return"
                        >
                          <i className="ri-file-list-line"></i> View Return Status
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && selectedBooking && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h2>Cancel Booking</h2>
              <button className="modal-close" onClick={() => setShowCancelModal(false)}>
                <i className="ri-close-line"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <p>Are you sure you want to cancel this booking?</p>
              
              <div className="booking-summary">
                <p><strong>Dress:</strong> {selectedBooking.dress?.name}</p>
                <p><strong>Dates:</strong> {formatDate(selectedBooking.startDate)} - {formatDate(selectedBooking.endDate)}</p>
                <p><strong>Total:</strong> ₹{calculateTotal(selectedBooking).total}</p>
              </div>

              <p className="warning-text">
                <i className="ri-information-line"></i>
                {selectedBooking.status === "pending" 
                  ? "Cancellation is free at this stage." 
                  : "Cancellation may incur charges if within 48 hours of rental start."}
              </p>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-outline"
                onClick={() => setShowCancelModal(false)}
              >
                Keep Booking
              </button>
              <button 
                className="btn-danger"
                onClick={confirmCancel}
                disabled={cancelLoading === selectedBooking._id}
              >
                {cancelLoading === selectedBooking._id ? (
                  <>Cancelling...</>
                ) : (
                  <>Yes, Cancel Booking</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default MyBookings;