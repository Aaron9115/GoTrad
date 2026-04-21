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
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/booking/my", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch bookings");
      }
      const data = await response.json();
      setBookings(data);
    } catch (err) {
      console.error("Fetch bookings error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (booking) => {
    setSelectedBooking(booking);
    setShowCancelModal(true);
  };

  const handleDeleteClick = (booking) => {
    setSelectedBooking(booking);
    setShowDeleteModal(true);
  };

  const confirmCancel = async () => {
    if (!selectedBooking) return;
    setCancelLoading(selectedBooking._id);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/booking/cancel/${selectedBooking._id}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to cancel booking");
      }
      
      await fetchBookings();
      setShowCancelModal(false);
      setSelectedBooking(null);
      
    } catch (err) {
      console.error("Cancel error:", err);
      setError(err.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setCancelLoading(null);
    }
  };

  const confirmDelete = async () => {
    if (!selectedBooking) return;
    setDeleteLoading(selectedBooking._id);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/booking/delete/${selectedBooking._id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete booking");
      }
      
      await fetchBookings();
      setShowDeleteModal(false);
      setSelectedBooking(null);
      
    } catch (err) {
      console.error("Delete error:", err);
      setError(err.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setDeleteLoading(null);
    }
  };

  const getFilteredBookings = () => {
    const now = new Date();
    switch(activeTab) {
      case "active": 
        return bookings.filter(b => (b.status === "confirmed" || b.status === "booked") && new Date(b.endDate) >= now);
      case "pending": 
        return bookings.filter(b => b.status === "pending");
      case "past": 
        return bookings.filter(b => b.status === "returned" || (b.status === "confirmed" && new Date(b.endDate) < now));
      case "cancelled": 
        return bookings.filter(b => b.status === "cancelled");
      default: 
        return bookings;
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  const formatPrice = (price) => {
    if (!price && price !== 0) return "0";
    return new Intl.NumberFormat("en-IN").format(price);
  };

  const getStatusText = (status) => {
    const map = { 
      pending: "Pending", 
      confirmed: "Confirmed", 
      booked: "Active", 
      returned: "Returned", 
      cancelled: "Cancelled",
      rejected: "Rejected"
    };
    return map[status] || status;
  };

  // CANCEL ONLY FOR PENDING STATUS
  const canCancelBooking = (booking) => {
    return booking.status === "pending";
  };

  const canReturnBooking = (booking) => {
    const today = new Date();
    const endDate = new Date(booking.endDate);
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    return (booking.status === "confirmed" || booking.status === "booked") && endDate <= today;
  };

  const canDeleteBooking = (booking) => {
    return booking.status === "cancelled" || booking.status === "returned";
  };

  const filteredBookings = getFilteredBookings();

  if (loading) {
    return (
      <div className="my-bookings-page">
        <Navbar />
        <div className="loading-state"><div className="spinner"></div><p>Loading...</p></div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="my-bookings-page">
      <Navbar />
      <div className="bookings-container">
        <div className="page-header">
          <h1>My Bookings</h1>
          <p>View and manage your dress rentals</p>
        </div>

        {error && <div className="error-msg"><i className="ri-error-warning-line"></i> {error}</div>}

        <div className="tabs">
          <button className={activeTab === "all" ? "active" : ""} onClick={() => setActiveTab("all")}>All ({bookings.length})</button>
          <button className={activeTab === "pending" ? "active" : ""} onClick={() => setActiveTab("pending")}>Pending</button>
          <button className={activeTab === "active" ? "active" : ""} onClick={() => setActiveTab("active")}>Active</button>
          <button className={activeTab === "past" ? "active" : ""} onClick={() => setActiveTab("past")}>Past</button>
          <button className={activeTab === "cancelled" ? "active" : ""} onClick={() => setActiveTab("cancelled")}>Cancelled</button>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="empty-state">
            <i className="ri-calendar-line"></i>
            <h3>No bookings found</h3>
            <Link to="/dresses" className="btn-primary">Browse Dresses</Link>
          </div>
        ) : (
          <div className="bookings-list">
            {filteredBookings.map(booking => {
              const dressPrice = booking.dress?.price || 0;
              const start = new Date(booking.startDate);
              const end = new Date(booking.endDate);
              const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
              const subtotal = dressPrice * days;
              const serviceFee = Math.round(subtotal * 0.05);
              const total = subtotal + serviceFee;
              
              const canCancel = canCancelBooking(booking);
              const canReturn = canReturnBooking(booking);
              const canDelete = canDeleteBooking(booking);

              return (
                <div key={booking._id} className="booking-card">
                  <div className="booking-image">
                    <img 
                      src={booking.dress?.image || "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80"} 
                      alt={booking.dress?.name || "Dress"} 
                    />
                  </div>
                  <div className="booking-info">
                    <div className="booking-title">
                      <h3>{booking.dress?.name || "Dress"}</h3>
                      <span className={`status ${booking.status}`}>{getStatusText(booking.status)}</span>
                    </div>
                    <p className="category">{booking.dress?.category || "N/A"}</p>
                    <div className="dates">
                      <div><i className="ri-calendar-line"></i> {formatDate(booking.startDate)} - {formatDate(booking.endDate)}</div>
                      <div><i className="ri-time-line"></i> {days} day{days !== 1 ? 's' : ''}</div>
                    </div>
                    <div className="specs">
                      {booking.dress?.size && <span><i className="ri-ruler-line"></i> {booking.dress.size}</span>}
                      {booking.dress?.color && <span><i className="ri-palette-line"></i> {booking.dress.color}</span>}
                    </div>
                    <div className="price">
                      <div>Subtotal: NPR {formatPrice(subtotal)}</div>
                      <div>Service Fee (5%): NPR {formatPrice(serviceFee)}</div>
                      <div className="total">Total: NPR {formatPrice(total)}</div>
                    </div>
                    {booking.status === "pending" && (
                      <div className="notice"><i className="ri-time-line"></i> Awaiting owner confirmation</div>
                    )}
                    <div className="actions">
                      <Link to={`/dress/${booking.dress?._id}`} className="btn-view">View Dress</Link>
                      {canCancel && (
                        <button 
                          className="btn-cancel" 
                          onClick={() => handleCancelClick(booking)} 
                          disabled={cancelLoading === booking._id}
                        >
                          {cancelLoading === booking._id ? "Cancelling..." : "Cancel Booking"}
                        </button>
                      )}
                      {canReturn && (
                        <Link to={`/return/${booking._id}`} className="btn-return">Return Dress</Link>
                      )}
                      {canDelete && (
                        <button 
                          className="btn-delete" 
                          onClick={() => handleDeleteClick(booking)} 
                          disabled={deleteLoading === booking._id}
                        >
                          {deleteLoading === booking._id ? "Deleting..." : "Delete"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {showCancelModal && selectedBooking && (
        <div className="modal">
          <div className="modal-content">
            <h3>Cancel Booking</h3>
            <p>Are you sure you want to cancel this booking?</p>
            <div className="modal-details">
              <p><strong>Dress:</strong> {selectedBooking.dress?.name || "Unknown"}</p>
              <p><strong>Dates:</strong> {formatDate(selectedBooking.startDate)} - {formatDate(selectedBooking.endDate)}</p>
              <p><strong>Total Amount:</strong> NPR {formatPrice(selectedBooking.totalAmount)}</p>
            </div>
            <p className="warning-text">
              <i className="ri-information-line"></i>
              Cancellation is free at this stage.
            </p>
            <div className="modal-actions">
              <button className="btn-outline" onClick={() => setShowCancelModal(false)}>Keep Booking</button>
              <button className="btn-danger" onClick={confirmCancel} disabled={cancelLoading === selectedBooking._id}>
                {cancelLoading === selectedBooking._id ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedBooking && (
        <div className="modal">
          <div className="modal-content">
            <h3>Delete Booking</h3>
            <p>This action cannot be undone.</p>
            <div className="modal-details">
              <p><strong>Dress:</strong> {selectedBooking.dress?.name || "Unknown"}</p>
              <p><strong>Dates:</strong> {formatDate(selectedBooking.startDate)} - {formatDate(selectedBooking.endDate)}</p>
              <p><strong>Status:</strong> {getStatusText(selectedBooking.status)}</p>
            </div>
            <div className="modal-actions">
              <button className="btn-outline" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="btn-danger" onClick={confirmDelete} disabled={deleteLoading === selectedBooking._id}>
                {deleteLoading === selectedBooking._id ? "Deleting..." : "Yes, Delete"}
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