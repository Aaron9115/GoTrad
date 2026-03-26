import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./OwnerDashboard.css";

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("my-dresses");
  const [dresses, setDresses] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  const [pendingReturns, setPendingReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [expandedActive, setExpandedActive] = useState(null);
  
  // Dress form
  const [form, setForm] = useState({ name: "", size: "", color: "", category: "", price: "", description: "" });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingDress, setEditingDress] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [processing, setProcessing] = useState(null);

  // Auth check
  useEffect(() => {
    const userData = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!userData || !token) {
      navigate("/login");
      return;
    }
    const parsed = JSON.parse(userData);
    if (parsed.role !== "owner") {
      navigate("/");
      return;
    }
    setUser(parsed);
    fetchMyDresses();
    fetchPendingBookings();
    fetchActiveBookings();
    fetchPendingReturns();
  }, []);

  // API calls
  const apiCall = async (url, options = {}) => {
    const token = localStorage.getItem("token");
    const res = await fetch(url, {
      ...options,
      headers: { "Authorization": `Bearer ${token}`, ...options.headers }
    });
    return res;
  };

  const fetchMyDresses = async () => {
    setLoading(true);
    const res = await apiCall("http://localhost:5000/api/dress/my-dresses");
    if (res.ok) setDresses(await res.json());
    setLoading(false);
  };

  const fetchPendingBookings = async () => {
    const res = await apiCall("http://localhost:5000/api/booking/owner/pending");
    if (res.ok) setPendingBookings(await res.json());
  };

  const fetchActiveBookings = async () => {
    const res = await apiCall("http://localhost:5000/api/booking/owner");
    if (res.ok) {
      const data = await res.json();
      const active = data.filter(b => 
        (b.status === "confirmed" || b.status === "booked") && 
        new Date(b.endDate) >= new Date()
      );
      setActiveBookings(active);
    }
  };

  const fetchPendingReturns = async () => {
    const res = await apiCall("http://localhost:5000/api/return/owner");
    if (res.ok) {
      const data = await res.json();
      const pending = data.filter(r => r.status === "pending" || r.status === "under_review");
      setPendingReturns(pending);
    }
  };

  // Booking actions
  const confirmBooking = async (id) => {
    setProcessing(id);
    const res = await apiCall(`http://localhost:5000/api/booking/confirm/${id}`, { method: "PUT" });
    if (res.ok) {
      setSuccess("Booking confirmed!");
      await Promise.all([fetchPendingBookings(), fetchActiveBookings(), fetchMyDresses()]);
      setTimeout(() => setSuccess(""), 3000);
    } else setError("Failed to confirm");
    setProcessing(null);
  };

  const rejectBooking = async (id) => {
    if (!window.confirm("Reject this booking?")) return;
    setProcessing(id);
    const res = await apiCall(`http://localhost:5000/api/booking/reject/${id}`, { method: "PUT" });
    if (res.ok) {
      setSuccess("Booking rejected");
      await fetchPendingBookings();
      setTimeout(() => setSuccess(""), 3000);
    } else setError("Failed to reject");
    setProcessing(null);
  };

  // Dress actions
  const deleteDress = async (id) => {
    if (!window.confirm("Delete this dress?")) return;
    const res = await apiCall(`http://localhost:5000/api/dress/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSuccess("Dress deleted");
      await fetchMyDresses();
      setTimeout(() => setSuccess(""), 3000);
    } else setError("Failed to delete");
  };

  const toggleAvailability = async (id) => {
    const res = await apiCall(`http://localhost:5000/api/dress/${id}/toggle`, { method: "PATCH" });
    if (res.ok) {
      const data = await res.json();
      setSuccess(data.message);
      await fetchMyDresses();
      setTimeout(() => setSuccess(""), 3000);
    } else setError("Failed to update");
  };

  // Image handling
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const max = 800;
          if (width > height && width > max) {
            height = Math.round(height * (max / width));
            width = max;
          } else if (height > max) {
            width = Math.round(width * (max / height));
            height = max;
          }
          canvas.width = width;
          canvas.height = height;
          canvas.getContext("2d").drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/png"));
        };
      };
    });
  };

  const addDress = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let imageUrl = "";
      if (imageFile) imageUrl = await compressImage(imageFile);
      const res = await apiCall("http://localhost:5000/api/dress/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          image: imageUrl || "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80"
        })
      });
      if (res.ok) {
        setSuccess("Dress added!");
        setForm({ name: "", size: "", color: "", category: "", price: "", description: "" });
        setImageFile(null);
        setImagePreview(null);
        await fetchMyDresses();
        setTimeout(() => {
          setActiveTab("my-dresses");
          setSuccess("");
        }, 2000);
      } else throw new Error();
    } catch (err) {
      setError("Failed to add dress");
    }
    setSubmitting(false);
  };

  const updateDress = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let imageUrl = imagePreview;
      if (imageFile) imageUrl = await compressImage(imageFile);
      const res = await apiCall(`http://localhost:5000/api/dress/${editingDress._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: Number(form.price), image: imageUrl })
      });
      if (res.ok) {
        setSuccess("Dress updated!");
        setShowEditModal(false);
        setEditingDress(null);
        await fetchMyDresses();
        setTimeout(() => setSuccess(""), 3000);
      } else throw new Error();
    } catch (err) {
      setError("Failed to update");
    }
    setSubmitting(false);
  };

  // Helpers
  const formatPrice = (price) => new Intl.NumberFormat("en-IN").format(price);
  const formatDate = (date) => new Date(date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  const isEndingSoon = (endDate) => Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24)) <= 2;

  const renderRefundDetails = (booking, isActive = false) => {
    const isExpanded = isActive ? expandedActive === booking._id : expanded === booking._id;
    const toggle = () => isActive ? setExpandedActive(isExpanded ? null : booking._id) : setExpanded(isExpanded ? null : booking._id);
    
    return (
      <>
        <button className="toggle-details-btn" onClick={toggle}>
          <i className={`ri-arrow-${isExpanded ? "up" : "down"}-s-line`}></i>
          {isExpanded ? "Hide Refund Details" : "View Refund Details"}
        </button>
        {isExpanded && booking.refundDetails && (
          <div className="renter-details-expanded">
            <h4>Renter Refund Information</h4>
            <p><strong>Email:</strong> {booking.renter?.email || "Not provided"}</p>
            <p><strong>City:</strong> {booking.renter?.city || "Not provided"}</p>
            <p><strong>Method:</strong> {booking.refundDetails.preferredMethod === "bank" ? "Bank Transfer" : "Digital Wallet"}</p>
            {booking.refundDetails.preferredMethod === "bank" && booking.refundDetails.bankDetails && (
              <div className="bank-details">
                <p><strong>Bank:</strong> {booking.refundDetails.bankDetails.bankName || "Not provided"}</p>
                <p><strong>Account:</strong> {booking.refundDetails.bankDetails.accountNumber || "Not provided"}</p>
                <p><strong>Holder:</strong> {booking.refundDetails.bankDetails.accountHolder || "Not provided"}</p>
              </div>
            )}
            {booking.refundDetails.preferredMethod === "digital_wallet" && booking.refundDetails.digitalWallet && (
              <div className="wallet-details">
                <p><strong>Provider:</strong> {booking.refundDetails.digitalWallet.provider || "Not provided"}</p>
                <p><strong>Phone:</strong> {booking.refundDetails.digitalWallet.phoneNumber || "Not provided"}</p>
              </div>
            )}
          </div>
        )}
      </>
    );
  };

  if (loading) {
    return (
      <div className="owner-dashboard">
        <Navbar />
        <div className="loading-state"><div className="spinner"></div><p>Loading...</p></div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="owner-dashboard">
      <Navbar />
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1>Welcome, <span className="highlight">{user?.name}</span></h1>
            <p>Manage your dress collection and returns</p>
          </div>
          <div className="owner-badge"><i className="ri-store-line"></i> Owner Account</div>
        </div>

        {/* Messages */}
        {success && <div className="success-message"><i className="ri-checkbox-circle-line"></i> {success}</div>}
        {error && <div className="error-message"><i className="ri-error-warning-line"></i> {error}</div>}

        {/* Tabs */}
        <div className="dashboard-tabs">
          <button className={`tab-btn ${activeTab === "my-dresses" ? "active" : ""}`} onClick={() => setActiveTab("my-dresses")}>
            <i className="ri-grid-line"></i> My Dresses ({dresses.length})
          </button>
          <button className={`tab-btn ${activeTab === "add-dress" ? "active" : ""}`} onClick={() => setActiveTab("add-dress")}>
            <i className="ri-add-circle-line"></i> Add Dress
          </button>
          <button className={`tab-btn ${activeTab === "pending" ? "active" : ""}`} onClick={() => { setActiveTab("pending"); fetchPendingBookings(); }}>
            <i className="ri-time-line"></i> Pending ({pendingBookings.length})
          </button>
          <button className={`tab-btn ${activeTab === "active" ? "active" : ""}`} onClick={() => { setActiveTab("active"); fetchActiveBookings(); }}>
            <i className="ri-calendar-check-line"></i> Active ({activeBookings.length})
          </button>
          <button className={`tab-btn ${activeTab === "returns" ? "active" : ""}`} onClick={() => setActiveTab("returns")}>
            <i className="ri-arrow-return-line"></i> Returns ({pendingReturns.length})
          </button>
        </div>

        {/* My Dresses Tab */}
        {activeTab === "my-dresses" && (
          <div className="my-dresses-tab">
            {dresses.length === 0 ? (
              <div className="empty-state">
                <i className="ri-inbox-line"></i>
                <h3>No dresses yet</h3>
                <button className="btn-primary" onClick={() => setActiveTab("add-dress")}>Add Your First Dress</button>
              </div>
            ) : (
              <div className="dresses-grid">
                {dresses.map(d => (
                  <div key={d._id} className="dress-card">
                    <div className="dress-image">
                      <img src={d.image || "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80"} alt={d.name} />
                      <div className={`status-badge ${d.available ? "available" : "rented"}`}>{d.available ? "Available" : "Rented"}</div>
                    </div>
                    <div className="dress-info">
                      <h3>{d.name}</h3>
                      <p>{d.category}</p>
                      <div className="dress-details">
                        <span><i className="ri-ruler-line"></i> {d.size}</span>
                        <span><i className="ri-palette-line"></i> {d.color}</span>
                      </div>
                      <div className="dress-price">NPR {formatPrice(d.price)} <span>/day</span></div>
                    </div>
                    <div className="dress-actions">
                      <button className={`action-btn toggle ${d.available ? "rented" : "available"}`} onClick={() => toggleAvailability(d._id)}>
                        <i className={`ri-${d.available ? "close" : "check"}-line`}></i> {d.available ? "Mark Rented" : "Mark Available"}
                      </button>
                      <button className="action-btn edit" onClick={() => { setEditingDress(d); setForm(d); setImagePreview(d.image); setShowEditModal(true); }}>
                        <i className="ri-edit-line"></i> Edit
                      </button>
                      <button className="action-btn delete" onClick={() => deleteDress(d._id)}>
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add Dress Tab */}
        {activeTab === "add-dress" && (
          <div className="add-dress-tab">
            <div className="form-card">
              <h2>Add New Dress</h2>
              <form onSubmit={addDress}>
                <div className="form-row">
                  <input type="text" name="name" placeholder="Dress Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  <select name="category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required>
                    <option value="">Category *</option>
                    <option value="Wedding">Wedding</option><option value="Festival">Festival</option><option value="Party">Party</option>
                    <option value="Traditional">Traditional</option><option value="Modern">Modern</option>
                  </select>
                </div>
                <div className="form-row">
                  <select name="size" value={form.size} onChange={e => setForm({ ...form, size: e.target.value })} required>
                    <option value="">Size *</option>
                    <option value="XS">XS</option><option value="S">S</option><option value="M">M</option>
                    <option value="L">L</option><option value="XL">XL</option><option value="XXL">XXL</option>
                  </select>
                  <input type="text" name="color" placeholder="Color *" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} required />
                </div>
                <div className="form-row">
                  <input type="number" name="price" placeholder="Price per day *" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
                  <div className="file-upload" onClick={() => fileInputRef.current?.click()}>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" hidden />
                    {imagePreview ? "Image Selected ✓" : "Upload Image *"}
                  </div>
                </div>
                {imagePreview && (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview" />
                    <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }}>✕</button>
                  </div>
                )}
                <textarea rows="3" placeholder="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}></textarea>
                <div className="form-actions">
                  <button type="button" className="btn-outline" onClick={() => setActiveTab("my-dresses")}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? "Adding..." : "Add Dress"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Pending Bookings Tab */}
        {activeTab === "pending" && (
          <div className="bookings-tab">
            <h2>Pending Bookings</h2>
            {pendingBookings.length === 0 ? (
              <div className="empty-state"><i className="ri-time-line"></i><h3>No pending bookings</h3></div>
            ) : (
              <div className="bookings-grid">
                {pendingBookings.map(b => (
                  <div key={b._id} className="booking-card">
                    <div className="booking-header">
                      <div><strong>{b.dress?.name}</strong> - {b.dress?.category}</div>
                      <span className="booking-status pending">Pending</span>
                    </div>
                    <div className="booking-details">
                      <p><i className="ri-user-line"></i> {b.renter?.name}</p>
                      <p><i className="ri-phone-line"></i> {b.deliveryAddress?.phone}</p>
                      <p><i className="ri-map-pin-line"></i> {b.deliveryAddress?.address}, {b.deliveryAddress?.city}</p>
                      <p><i className="ri-calendar-line"></i> {formatDate(b.startDate)} - {formatDate(b.endDate)}</p>
                      <p><i className="ri-money-rupee-circle-line"></i> NPR {formatPrice(b.totalAmount)}</p>
                      {renderRefundDetails(b)}
                    </div>
                    <div className="booking-actions">
                      <button className="btn-confirm" onClick={() => confirmBooking(b._id)} disabled={processing === b._id}>Confirm</button>
                      <button className="btn-reject" onClick={() => rejectBooking(b._id)} disabled={processing === b._id}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Active Bookings Tab */}
        {activeTab === "active" && (
          <div className="bookings-tab">
            <h2>Active Rentals</h2>
            {activeBookings.length === 0 ? (
              <div className="empty-state"><i className="ri-calendar-check-line"></i><h3>No active rentals</h3></div>
            ) : (
              <div className="bookings-grid">
                {activeBookings.map(b => (
                  <div key={b._id} className={`booking-card ${isEndingSoon(b.endDate) ? "ending-soon" : ""}`}>
                    <div className="booking-header">
                      <div><strong>{b.dress?.name}</strong> - {b.dress?.category}</div>
                      <span className="booking-status active">Active</span>
                    </div>
                    <div className="booking-details">
                      <p><i className="ri-user-line"></i> {b.renter?.name}</p>
                      <p><i className="ri-phone-line"></i> {b.deliveryAddress?.phone}</p>
                      <p><i className="ri-map-pin-line"></i> {b.deliveryAddress?.address}</p>
                      <p><i className="ri-calendar-line"></i> {formatDate(b.startDate)} - {formatDate(b.endDate)}</p>
                      {isEndingSoon(b.endDate) && <div className="ending-soon-badge"><i className="ri-alert-line"></i> Ending soon!</div>}
                      {renderRefundDetails(b, true)}
                    </div>
                    <div className="booking-actions">
                      <button className="btn-return-ready" onClick={() => setSuccess("Ask renter to return")}>Mark Return Ready</button>
                      <button className="btn-contact" onClick={() => window.location.href = `mailto:${b.renter?.email}`}>Contact</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Returns Tab */}
        {activeTab === "returns" && (
          <div className="returns-tab">
            <h2>Pending Returns</h2>
            {pendingReturns.length === 0 ? (
              <div className="empty-state"><i className="ri-arrow-return-line"></i><h3>No pending returns</h3></div>
            ) : (
              <div className="returns-grid">
                {pendingReturns.map(r => (
                  <div key={r._id} className="return-card">
                    <div className="return-header">
                      <h3>{r.dress?.name}</h3>
                      <span className={`return-status ${r.status}`}>{r.status}</span>
                    </div>
                    <p><i className="ri-user-line"></i> {r.renter?.name}</p>
                    <p><i className="ri-calendar-line"></i> {formatDate(r.returnInitiatedAt)}</p>
                    <p><i className="ri-camera-line"></i> {r.photos?.length || 0} photos</p>
                    <Link to={`/owner/return/${r._id}`} className="btn-primary">Review Return</Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Edit Dress</h2>
                <button onClick={() => { setShowEditModal(false); setEditingDress(null); }}>✕</button>
              </div>
              <form onSubmit={updateDress}>
                <div className="form-row">
                  <input type="text" placeholder="Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    <option value="Wedding">Wedding</option><option value="Festival">Festival</option>
                    <option value="Party">Party</option><option value="Traditional">Traditional</option><option value="Modern">Modern</option>
                  </select>
                </div>
                <div className="form-row">
                  <select value={form.size} onChange={e => setForm({ ...form, size: e.target.value })}>
                    <option value="XS">XS</option><option value="S">S</option><option value="M">M</option>
                    <option value="L">L</option><option value="XL">XL</option><option value="XXL">XXL</option>
                  </select>
                  <input type="text" placeholder="Color *" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} required />
                </div>
                <div className="form-row">
                  <input type="number" placeholder="Price *" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
                  <div className="file-upload" onClick={() => fileInputRef.current?.click()}>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" hidden />
                    {imagePreview ? "Change Image" : "Update Image"}
                  </div>
                </div>
                {imagePreview && (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview" />
                  </div>
                )}
                <textarea rows="3" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}></textarea>
                <div className="modal-actions">
                  <button type="button" className="btn-outline" onClick={() => setShowEditModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? "Updating..." : "Update"}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default OwnerDashboard;