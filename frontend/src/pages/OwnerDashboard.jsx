import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./OwnerDashboard.css";

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dresses");
  const [dresses, setDresses] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  const [pendingReturns, setPendingReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expandedRefund, setExpandedRefund] = useState({});
  
  const [form, setForm] = useState({ name: "", size: "", color: "", category: "", price: "", description: "" });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingDress, setEditingDress] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [processing, setProcessing] = useState(null);

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
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    
    try {
      const [dressRes, pendingRes, activeRes, returnRes] = await Promise.all([
        fetch("http://localhost:5000/api/dress/my-dresses", { headers }),
        fetch("http://localhost:5000/api/booking/owner/pending", { headers }),
        fetch("http://localhost:5000/api/booking/owner", { headers }),
        fetch("http://localhost:5000/api/return/owner", { headers })
      ]);
      
      if (dressRes.ok) {
        const dressesData = await dressRes.json();
        const dressesWithStatus = dressesData.map(dress => ({
          ...dress,
          isCurrentlyRented: !dress.available
        }));
        setDresses(dressesWithStatus);
      }
      
      if (pendingRes.ok) setPendingBookings(await pendingRes.json());
      if (activeRes.ok) {
        const data = await activeRes.json();
        setActiveBookings(data.filter(b => 
          (b.status === "confirmed" || b.status === "booked") && 
          new Date(b.endDate) >= new Date()
        ));
      }
      if (returnRes.ok) {
        const data = await returnRes.json();
        setPendingReturns(data.filter(r => r.status === "pending" || r.status === "under_review"));
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to fetch data");
    }
    setLoading(false);
  };

  const confirmBooking = async (id) => {
    setProcessing(id);
    const res = await fetch(`http://localhost:5000/api/booking/confirm/${id}`, { 
      method: "PUT", 
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } 
    });
    if (res.ok) { 
      setSuccess("Booking confirmed successfully!"); 
      fetchData(); 
      setTimeout(() => setSuccess(""), 3000); 
    } else {
      setError("Failed to confirm booking");
    }
    setProcessing(null);
  };

  const rejectBooking = async (id) => {
    if (!confirm("Are you sure you want to reject this booking?")) return;
    setProcessing(id);
    const res = await fetch(`http://localhost:5000/api/booking/reject/${id}`, { 
      method: "PUT", 
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } 
    });
    if (res.ok) { 
      setSuccess("Booking rejected"); 
      fetchData(); 
      setTimeout(() => setSuccess(""), 3000); 
    } else {
      setError("Failed to reject booking");
    }
    setProcessing(null);
  };

  const deleteDress = async (id) => {
    if (!confirm("Are you sure you want to delete this dress?")) return;
    const res = await fetch(`http://localhost:5000/api/dress/${id}`, { 
      method: "DELETE", 
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } 
    });
    if (res.ok) { 
      setSuccess("Dress deleted successfully"); 
      fetchData(); 
      setTimeout(() => setSuccess(""), 3000); 
    } else {
      setError("Failed to delete dress");
    }
  };

  // Toggle availability - Owner can manually change availability status
  const toggleAvailability = async (id, isCurrentlyRented) => {
    // Show confirmation dialog
    const action = isCurrentlyRented ? "mark as available" : "mark as rented";
    if (!confirm(`Are you sure you want to ${action} this dress?`)) return;
    
    const res = await fetch(`http://localhost:5000/api/dress/${id}/toggle`, { 
      method: "PATCH", 
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } 
    });
    if (res.ok) { 
      const message = isCurrentlyRented ? "Dress marked as available" : "Dress marked as rented";
      setSuccess(message); 
      fetchData(); 
      setTimeout(() => setSuccess(""), 3000); 
    } else {
      setError("Failed to update availability");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { 
      setError("Please upload an image file"); 
      return; 
    }
    if (file.size > 5 * 1024 * 1024) { 
      setError("Image size should be less than 5MB"); 
      return; 
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const compressImage = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width, h = img.height, max = 800;
        if (w > h && w > max) { 
          h = h * (max / w); 
          w = max; 
        } else if (h > max) { 
          w = w * (max / h); 
          h = max; 
        }
        canvas.width = w; 
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/png"));
      };
    };
  });

  const addDress = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let imageUrl = imageFile ? await compressImage(imageFile) : "";
      const res = await fetch("http://localhost:5000/api/dress/add", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({ 
          ...form, 
          price: Number(form.price), 
          image: imageUrl || "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80" 
        })
      });
      if (res.ok) { 
        setSuccess("Dress added successfully!"); 
        setForm({ name: "", size: "", color: "", category: "", price: "", description: "" }); 
        setImageFile(null); 
        setImagePreview(null); 
        fetchData(); 
        setTimeout(() => setActiveTab("dresses"), 1500); 
      } else {
        throw new Error();
      }
    } catch (err) { 
      setError("Failed to add dress"); 
    }
    setSubmitting(false);
  };

  const updateDress = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let imageUrl = imageFile ? await compressImage(imageFile) : imagePreview;
      const res = await fetch(`http://localhost:5000/api/dress/${editingDress._id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({ ...form, price: Number(form.price), image: imageUrl })
      });
      if (res.ok) { 
        setSuccess("Dress updated successfully!"); 
        setShowEditModal(false); 
        setEditingDress(null); 
        fetchData(); 
        setTimeout(() => setSuccess(""), 3000); 
      } else {
        throw new Error();
      }
    } catch (err) { 
      setError("Failed to update dress"); 
    }
    setSubmitting(false);
  };

  const formatPrice = (p) => new Intl.NumberFormat("en-IN").format(p);
  const formatDate = (d) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const isEndingSoon = (end) => Math.ceil((new Date(end) - new Date()) / (1000 * 60 * 60 * 24)) <= 2;

  const toggleRefund = (id) => {
    setExpandedRefund(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderRefundDetails = (booking) => {
    if (!booking.refundDetails) return null;
    
    return (
      <div className="refund-section">
        <button 
          className="refund-toggle-btn" 
          onClick={() => toggleRefund(booking._id)}
        >
          {expandedRefund[booking._id] ? "▼ Hide Refund Details" : "▶ View Refund Details"}
        </button>
        
        {expandedRefund[booking._id] && (
          <div className="refund-details">
            <h4>Refund Information</h4>
            <div className="refund-row">
              <strong>Email:</strong> 
              <span>{booking.renter?.email || "-"}</span>
            </div>
            <div className="refund-row">
              <strong>Payment Method:</strong> 
              <span>{booking.refundDetails.preferredMethod === "bank" ? "Bank Transfer" : "Digital Wallet"}</span>
            </div>
            
            {booking.refundDetails.preferredMethod === "bank" && (
              <>
                <div className="refund-row">
                  <strong>Bank Name:</strong> 
                  <span>{booking.refundDetails.bankDetails?.bankName || "-"}</span>
                </div>
                <div className="refund-row">
                  <strong>Account Number:</strong> 
                  <span>{booking.refundDetails.bankDetails?.accountNumber || "-"}</span>
                </div>
              </>
            )}
            
            {booking.refundDetails.preferredMethod === "digital_wallet" && (
              <>
                <div className="refund-row">
                  <strong>Wallet Provider:</strong> 
                  <span>{booking.refundDetails.digitalWallet?.provider || "-"}</span>
                </div>
                <div className="refund-row">
                  <strong>Phone Number:</strong> 
                  <span>{booking.refundDetails.digitalWallet?.phoneNumber || "-"}</span>
                </div>
                {booking.refundDetails.digitalWallet?.qrCode && (
                  <div className="qr-code-container">
                    <strong>QR Code:</strong>
                    <img 
                      src={booking.refundDetails.digitalWallet.qrCode} 
                      alt="Payment QR Code" 
                      className="qr-code-image"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) return (
    <div className="dashboard">
      <Navbar />
      <div className="loader"></div>
      <Footer />
    </div>
  );

  return (
    <div className="dashboard">
      <Navbar />
      <div className="container">
        <div className="head">
          <h1>Welcome back, {user?.name}</h1>
          <span className="tag">Owner Dashboard</span>
        </div>
        
        {success && <div className="msg success">{success}</div>}
        {error && <div className="msg error">{error}</div>}

        <div className="tabs">
          <button className={activeTab === "dresses" ? "active" : ""} onClick={() => setActiveTab("dresses")}>
            My Dresses ({dresses.length})
          </button>
          <button className={activeTab === "add" ? "active" : ""} onClick={() => setActiveTab("add")}>
            Add New Dress
          </button>
          <button className={activeTab === "pending" ? "active" : ""} onClick={() => setActiveTab("pending")}>
            Pending Bookings ({pendingBookings.length})
          </button>
          <button className={activeTab === "active" ? "active" : ""} onClick={() => setActiveTab("active")}>
            Active Rentals ({activeBookings.length})
          </button>
          <button className={activeTab === "returns" ? "active" : ""} onClick={() => setActiveTab("returns")}>
            Return Requests ({pendingReturns.length})
          </button>
        </div>

        {/* My Dresses Tab */}
        {activeTab === "dresses" && (
          dresses.length === 0 ? (
            <div className="empty">
              <p>No dresses added yet. Click "Add New Dress" to get started.</p>
            </div>
          ) : (
            <div className="grid">
              {dresses.map(d => {
                const isAvailable = d.available;
                return (
                  <div key={d._id} className="card">
                    <img src={d.image || "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&q=80"} alt={d.name} />
                    <div className="card-info">
                      <h3>{d.name}</h3>
                      <p>{d.category} • {d.size} • {d.color}</p>
                      <div className="price">NPR {formatPrice(d.price)}<span>/day</span></div>
                      <span className={`badge ${isAvailable ? "avail" : "rent"}`}>
                        {isAvailable ? "Available" : "Rented"}
                      </span>
                    </div>
                    <div className="card-actions">
                      <button 
                        className={`btn-toggle ${isAvailable ? "avail" : "rent"}`} 
                        onClick={() => toggleAvailability(d._id, !isAvailable)}
                      >
                        {isAvailable ? "Mark as Rented" : "Mark as Available"}
                      </button>
                      <button className="btn-edit" onClick={() => { 
                        setEditingDress(d); 
                        setForm(d); 
                        setImagePreview(d.image); 
                        setShowEditModal(true); 
                      }}>
                        Edit
                      </button>
                      <button className="btn-del" onClick={() => deleteDress(d._id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Add Dress Tab */}
        {activeTab === "add" && (
          <div className="form-box">
            <h2>Add New Dress</h2>
            <form onSubmit={addDress}>
              <div className="row">
                <input 
                  type="text" 
                  placeholder="Dress Name *" 
                  value={form.name} 
                  onChange={e => setForm({ ...form, name: e.target.value })} 
                  required 
                />
                <select 
                  value={form.category} 
                  onChange={e => setForm({ ...form, category: e.target.value })} 
                  required
                >
                  <option value="">Select Category</option>
                  <option>Wedding</option>
                  <option>Festival</option>
                  <option>Party</option>
                  <option>Traditional</option>
                  <option>Modern</option>
                </select>
              </div>
              
              <div className="row">
                <select 
                  value={form.size} 
                  onChange={e => setForm({ ...form, size: e.target.value })} 
                  required
                >
                  <option value="">Select Size</option>
                  <option>XS</option>
                  <option>S</option>
                  <option>M</option>
                  <option>L</option>
                  <option>XL</option>
                  <option>XXL</option>
                </select>
                <input 
                  type="text" 
                  placeholder="Color *" 
                  value={form.color} 
                  onChange={e => setForm({ ...form, color: e.target.value })} 
                  required 
                />
              </div>
              
              <div className="row">
                <input 
                  type="number" 
                  placeholder="Price per day (₹) *" 
                  value={form.price} 
                  onChange={e => setForm({ ...form, price: e.target.value })} 
                  required 
                />
                <div className="upload" onClick={() => fileInputRef.current?.click()}>
                  📷 {imagePreview ? "Change Image" : "Upload Image"}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  hidden 
                />
              </div>
              
              {imagePreview && (
                <div className="preview">
                  <img src={imagePreview} alt="Preview" />
                  <button type="button" onClick={() => { 
                    setImageFile(null); 
                    setImagePreview(null); 
                  }}>
                    ✕
                  </button>
                </div>
              )}
              
              <textarea 
                rows="3" 
                placeholder="Description (optional)" 
                value={form.description} 
                onChange={e => setForm({ ...form, description: e.target.value })}
              ></textarea>
              
              <button type="submit" disabled={submitting}>
                {submitting ? "Adding..." : "Add Dress"}
              </button>
              <button type="button" className="cancel" onClick={() => setActiveTab("dresses")}>
                Cancel
              </button>
            </form>
          </div>
        )}

        {/* Pending Bookings Tab */}
        {activeTab === "pending" && (
          pendingBookings.length === 0 ? (
            <div className="empty">
              <p>No pending bookings at the moment.</p>
            </div>
          ) : (
            <div className="list">
              {pendingBookings.map(b => (
                <div key={b._id} className="item">
                  <div className="item-head">
                    <strong>{b.dress?.name}</strong>
                    <span className="status pending">Pending Approval</span>
                  </div>
                  
                  <div className="item-body">
                    <p><strong>Renter:</strong> {b.renter?.name}</p>
                    <p><strong>Phone:</strong> {b.deliveryAddress?.phone}</p>
                    <p><strong>Address:</strong> {b.deliveryAddress?.address}</p>
                    <p><strong>Dates:</strong> {formatDate(b.startDate)} - {formatDate(b.endDate)}</p>
                    <p><strong>Total Amount:</strong> ₹{formatPrice(b.totalAmount)}</p>
                  </div>
                  
                  {renderRefundDetails(b)}
                  
                  <div className="item-actions">
                    <button 
                      className="confirm" 
                      onClick={() => confirmBooking(b._id)} 
                      disabled={processing === b._id}
                    >
                      Confirm Booking
                    </button>
                    <button 
                      className="reject" 
                      onClick={() => rejectBooking(b._id)} 
                      disabled={processing === b._id}
                    >
                      Reject Booking
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Active Rentals Tab */}
        {activeTab === "active" && (
          activeBookings.length === 0 ? (
            <div className="empty">
              <p>No active rentals at the moment.</p>
            </div>
          ) : (
            <div className="list">
              {activeBookings.map(b => (
                <div key={b._id} className={`item ${isEndingSoon(b.endDate) ? "warning" : ""}`}>
                  <div className="item-head">
                    <strong>{b.dress?.name}</strong>
                    <span className="status active">Active Rental</span>
                  </div>
                  
                  <div className="item-body">
                    <p><strong>Renter:</strong> {b.renter?.name}</p>
                    <p><strong>Phone:</strong> {b.deliveryAddress?.phone}</p>
                    <p><strong>Address:</strong> {b.deliveryAddress?.address}</p>
                    <p><strong>Rental Period:</strong> {formatDate(b.startDate)} - {formatDate(b.endDate)}</p>
                    <p><strong>Total Amount:</strong> ₹{formatPrice(b.totalAmount)}</p>
                    {isEndingSoon(b.endDate) && (
                      <p className="alert-text">⚠️ This rental is ending within 2 days</p>
                    )}
                  </div>
                  
                  {renderRefundDetails(b)}
                  
                  <div className="item-actions">
                    <button 
                      className="contact" 
                      onClick={() => window.location.href = `tel:${b.deliveryAddress?.phone}`}
                    >
                      Contact Renter: {b.deliveryAddress?.phone}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Return Requests Tab */}
        {activeTab === "returns" && (
          pendingReturns.length === 0 ? (
            <div className="empty">
              <p>No pending return requests.</p>
            </div>
          ) : (
            <div className="list">
              {pendingReturns.map(r => (
                <div key={r._id} className="item">
                  <div className="item-head">
                    <strong>{r.dress?.name}</strong>
                    <span className="status pending">Return Requested</span>
                  </div>
                  
                  <div className="item-body">
                    <p><strong>Renter:</strong> {r.renter?.name}</p>
                    <p><strong>Phone:</strong> {r.renter?.phone || r.deliveryAddress?.phone || "Not provided"}</p>
                    <p><strong>Request Date:</strong> {formatDate(r.returnInitiatedAt)}</p>
                    <p><strong>Photos Uploaded:</strong> {r.photos?.length || 0} photos</p>
                  </div>
                  
                  <Link to={`/owner/return/${r._id}`} className="btn-review">
                    Review Return Request
                  </Link>
                </div>
              ))}
            </div>
          )
        )}

        {/* Edit Dress Modal */}
        {showEditModal && (
          <div className="modal">
            <div className="modal-box">
              <div className="modal-head">
                <h3>Edit Dress</h3>
                <button onClick={() => setShowEditModal(false)}>✕</button>
              </div>
              
              <form onSubmit={updateDress}>
                <div className="row">
                  <input 
                    type="text" 
                    placeholder="Dress Name" 
                    value={form.name} 
                    onChange={e => setForm({ ...form, name: e.target.value })} 
                  />
                  <select 
                    value={form.category} 
                    onChange={e => setForm({ ...form, category: e.target.value })}
                  >
                    <option>Wedding</option>
                    <option>Festival</option>
                    <option>Party</option>
                    <option>Traditional</option>
                    <option>Modern</option>
                  </select>
                </div>
                
                <div className="row">
                  <select 
                    value={form.size} 
                    onChange={e => setForm({ ...form, size: e.target.value })}
                  >
                    <option>XS</option>
                    <option>S</option>
                    <option>M</option>
                    <option>L</option>
                    <option>XL</option>
                    <option>XXL</option>
                  </select>
                  <input 
                    type="text" 
                    placeholder="Color" 
                    value={form.color} 
                    onChange={e => setForm({ ...form, color: e.target.value })} 
                  />
                </div>
                
                <div className="row">
                  <input 
                    type="number" 
                    placeholder="Price per day" 
                    value={form.price} 
                    onChange={e => setForm({ ...form, price: e.target.value })} 
                  />
                  <div className="upload" onClick={() => fileInputRef.current?.click()}>
                    📷 Change Image
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    accept="image/*" 
                    hidden 
                  />
                </div>
                
                {imagePreview && (
                  <div className="preview">
                    <img src={imagePreview} alt="Preview" />
                  </div>
                )}
                
                <textarea 
                  rows="3" 
                  placeholder="Description" 
                  value={form.description} 
                  onChange={e => setForm({ ...form, description: e.target.value })}
                ></textarea>
                
                <button type="submit" disabled={submitting}>
                  Update Dress
                </button>
                <button type="button" className="cancel" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
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