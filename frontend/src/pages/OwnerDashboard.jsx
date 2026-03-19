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
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [activeBookingsLoading, setActiveBookingsLoading] = useState(false);
  const [returnsLoading, setReturnsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // ========== DRESS MANAGEMENT STATE ==========
  const [formData, setFormData] = useState({
    name: "",
    size: "",
    color: "",
    category: "",
    price: "",
    description: ""
  });
  
  // Image upload states
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [editingDress, setEditingDress] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Booking confirmation state
  const [processingBooking, setProcessingBooking] = useState(null);
  // Track expanded renter details
  const [expandedRenter, setExpandedRenter] = useState(null);
  // Track expanded active renter details
  const [expandedActiveRenter, setExpandedActiveRenter] = useState(null);

  // ========== CHECK USER AUTHENTICATION ==========
  useEffect(() => {
    const userData = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    
    if (!userData || !token) {
      navigate("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== "owner" && parsedUser.role !== "admin") {
        navigate("/");
        return;
      }

      setUser(parsedUser);
      fetchMyDresses();
      fetchPendingBookings();
      fetchActiveBookings();
      fetchPendingReturns();
    } catch (err) {
      console.error("Error parsing user data:", err);
      navigate("/login");
    }
  }, [navigate]);

  // ========== FETCH OWNER'S DRESSES FROM BACKEND ==========
  const fetchMyDresses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch("http://localhost:5000/api/dress/my-dresses", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch your dresses");
      }

      const data = await response.json();
      setDresses(data);
      setError("");
    } catch (err) {
      console.error("Error fetching dresses:", err);
      setError(err.message);
      setDresses([]);
    } finally {
      setLoading(false);
    }
  };

  // ========== FETCH PENDING BOOKINGS ==========
  const fetchPendingBookings = async () => {
    try {
      setBookingsLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch("http://localhost:5000/api/booking/owner/pending", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPendingBookings(data);
      } else {
        setPendingBookings([]);
      }
    } catch (err) {
      console.error("Error fetching pending bookings:", err);
      setPendingBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  };

  // ========== FETCH ACTIVE BOOKINGS (confirmed) ==========
  const fetchActiveBookings = async () => {
    try {
      setActiveBookingsLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch("http://localhost:5000/api/booking/owner", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Filter only confirmed/booked bookings that are not completed
        const active = data.filter(b => 
          (b.status === "confirmed" || b.status === "booked") && 
          new Date(b.endDate) >= new Date()
        );
        setActiveBookings(active);
      } else {
        setActiveBookings([]);
      }
    } catch (err) {
      console.error("Error fetching active bookings:", err);
      setActiveBookings([]);
    } finally {
      setActiveBookingsLoading(false);
    }
  };

  // ========== FETCH PENDING RETURNS FROM BACKEND ==========
  const fetchPendingReturns = async () => {
    try {
      setReturnsLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch("http://localhost:5000/api/return/owner", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const pending = data.filter(ret => ret.status === "pending" || ret.status === "under_review");
        setPendingReturns(pending);
      } else {
        setPendingReturns([]);
      }
    } catch (err) {
      console.error("Error fetching returns:", err);
      setPendingReturns([]);
    } finally {
      setReturnsLoading(false);
    }
  };

  // ========== HANDLE CONFIRM BOOKING ==========
  const handleConfirmBooking = async (bookingId) => {
    setProcessingBooking(bookingId);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`http://localhost:5000/api/booking/confirm/${bookingId}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to confirm booking");
      }

      setSuccess("Booking confirmed successfully!");
      
      // Refresh all lists
      await fetchPendingBookings();
      await fetchActiveBookings();
      await fetchMyDresses();
      
      setTimeout(() => setSuccess(""), 3000);

    } catch (err) {
      setError(err.message);
    } finally {
      setProcessingBooking(null);
    }
  };

  // ========== HANDLE REJECT BOOKING ==========
  const handleRejectBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to reject this booking?")) {
      return;
    }

    setProcessingBooking(bookingId);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`http://localhost:5000/api/booking/reject/${bookingId}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reject booking");
      }

      setSuccess("Booking rejected");
      
      await fetchPendingBookings();
      
      setTimeout(() => setSuccess(""), 3000);

    } catch (err) {
      setError(err.message);
    } finally {
      setProcessingBooking(null);
    }
  };

  // ========== HANDLE MARK AS READY FOR RETURN ==========
  const handleMarkAsReturnReady = async (bookingId) => {
    if (!window.confirm("Has the rental period ended? The renter can now initiate return.")) {
      return;
    }

    // This would need a backend endpoint to update booking status
    // For now, we'll just show a message and redirect to returns
    setSuccess("Please ask renter to initiate return from their dashboard");
    
    setTimeout(() => setSuccess(""), 3000);
  };

  // ========== HANDLE FORM INPUT CHANGE ==========
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ""
      });
    }
  };

  // ========== HANDLE IMAGE UPLOAD ==========
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError("Please upload an image file");
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }

      setImageFile(file);
      setError("");

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      if (formErrors.image) {
        setFormErrors(prev => ({ ...prev, image: "" }));
      }
    }
  };

  // ========== REMOVE SELECTED IMAGE ==========
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ========== SIMULATE UPLOAD PROGRESS ==========
  const simulateUpload = () => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setUploadProgress(0);
            resolve();
          }, 500);
        }
      }, 200);
    });
  };

  // ========== COMPRESS IMAGE FUNCTION ==========
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimensions
          const maxWidth = 800;
          const maxHeight = 800;
          
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round(height * (maxWidth / width));
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round(width * (maxHeight / height));
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG with 0.7 quality
          const compressedDataUrl = canvas.toDataURL('image/png');
          resolve(compressedDataUrl);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // ========== VALIDATE DRESS FORM ==========
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) errors.name = "Dress name is required";
    if (!formData.size) errors.size = "Please select a size";
    if (!formData.color.trim()) errors.color = "Color is required";
    if (!formData.category) errors.category = "Please select a category";
    if (!formData.price) {
      errors.price = "Price is required";
    } else if (isNaN(formData.price) || Number(formData.price) <= 0) {
      errors.price = "Price must be a positive number";
    }
    if (!imageFile && !imagePreview && !editingDress) {
      errors.image = "Please upload an image";
    }
    
    return errors;
  };

  // ========== HANDLE ADD DRESS SUBMIT ==========
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await simulateUpload();
      const token = localStorage.getItem("token");
      
      let imageUrl = "";
      
      // If there's an image file, compress and convert to base64
      if (imageFile) {
        imageUrl = await compressImage(imageFile);
        console.log("Compressed image size:", Math.round(imageUrl.length / 1024), "KB");
      }

      // Create JSON payload for backend
      const dressData = {
        name: formData.name,
        size: formData.size,
        color: formData.color,
        category: formData.category,
        price: Number(formData.price),
        description: formData.description || "",
        image: imageUrl || "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80"
      };

      const response = await fetch("http://localhost:5000/api/dress/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(dressData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add dress");
      }

      setSuccess("Dress added successfully!");
      setFormData({
        name: "",
        size: "",
        color: "",
        category: "",
        price: "",
        description: ""
      });
      
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      // Refresh the dress list from backend
      await fetchMyDresses();
      
      setTimeout(() => {
        setActiveTab("my-dresses");
        setSuccess("");
      }, 2000);

    } catch (err) {
      console.error("Error adding dress:", err);
      setError(err.message || "Failed to add dress. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ========== HANDLE DELETE DRESS ==========
  const handleDelete = async (dressId) => {
    if (!window.confirm("Are you sure you want to delete this dress?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`http://localhost:5000/api/dress/${dressId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to delete dress");
      }

      setSuccess("Dress deleted successfully");
      await fetchMyDresses(); // Refresh the list
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // ========== HANDLE TOGGLE AVAILABILITY ==========
  const handleToggleAvailability = async (dressId, currentStatus) => {
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`http://localhost:5000/api/dress/${dressId}/toggle`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      const data = await response.json();
      setSuccess(data.message);
      await fetchMyDresses(); // Refresh the list
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // ========== HANDLE EDIT BUTTON CLICK ==========
  const handleEditClick = (dress) => {
    setEditingDress(dress);
    setFormData({
      name: dress.name,
      size: dress.size,
      color: dress.color,
      category: dress.category,
      price: dress.price,
      description: dress.description || ""
    });
    setImagePreview(dress.image);
    setShowEditModal(true);
  };

  // ========== HANDLE UPDATE DRESS ==========
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      
      let imageUrl = imagePreview;
      if (imageFile) {
        imageUrl = await compressImage(imageFile);
      }
      
      const dressData = {
        name: formData.name,
        size: formData.size,
        color: formData.color,
        category: formData.category,
        price: Number(formData.price),
        description: formData.description || "",
        image: imageUrl
      };

      const response = await fetch(`http://localhost:5000/api/dress/${editingDress._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(dressData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update dress");
      }

      setSuccess("Dress updated successfully!");
      setShowEditModal(false);
      setEditingDress(null);
      await fetchMyDresses(); // Refresh the list
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ========== FORMAT PRICE WITH NPR ==========
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN").format(price);
  };

  // ========== FORMAT DATE FOR DISPLAY ==========
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // ========== TOGGLE RENTER DETAILS ==========
  const toggleRenterDetails = (bookingId) => {
    if (expandedRenter === bookingId) {
      setExpandedRenter(null);
    } else {
      setExpandedRenter(bookingId);
    }
  };

  // ========== TOGGLE ACTIVE RENTER DETAILS ==========
  const toggleActiveRenterDetails = (bookingId) => {
    if (expandedActiveRenter === bookingId) {
      setExpandedActiveRenter(null);
    } else {
      setExpandedActiveRenter(bookingId);
    }
  };

  // ========== CHECK IF RENTAL IS ENDING SOON ==========
  const isEndingSoon = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 2 && diffDays >= 0;
  };

  return (
    <div className="owner-dashboard">
      <Navbar />
      
      <div className="dashboard-container">
        {/* ========== HEADER SECTION ========== */}
        <div className="dashboard-header">
          <div>
            <h1>Welcome, <span className="highlight">{user?.name}</span></h1>
            <p className="dashboard-subtitle">Manage your dress collection and returns</p>
          </div>
          <div className="owner-badge">
            <i className="ri-store-line"></i>
            <span>Owner Account</span>
          </div>
        </div>

        {/* ========== SUCCESS/ERROR MESSAGES ========== */}
        {success && (
          <div className="success-message">
            <i className="ri-checkbox-circle-line"></i>
            <span>{success}</span>
          </div>
        )}
        
        {error && (
          <div className="error-message">
            <i className="ri-error-warning-line"></i>
            <span>{error}</span>
          </div>
        )}

        {/* ========== DASHBOARD TABS ========== */}
        <div className="dashboard-tabs">
          <button 
            className={`tab-btn ${activeTab === "my-dresses" ? "active" : ""}`}
            onClick={() => setActiveTab("my-dresses")}
          >
            <i className="ri-grid-line"></i>
            My Dresses ({dresses.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === "add-dress" ? "active" : ""}`}
            onClick={() => setActiveTab("add-dress")}
          >
            <i className="ri-add-circle-line"></i>
            Add New Dress
          </button>
          <button 
            className={`tab-btn ${activeTab === "pending" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("pending");
              fetchPendingBookings();
            }}
          >
            <i className="ri-time-line"></i>
            Pending ({pendingBookings.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === "active" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("active");
              fetchActiveBookings();
            }}
          >
            <i className="ri-calendar-check-line"></i>
            Active ({activeBookings.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === "returns" ? "active" : ""}`}
            onClick={() => setActiveTab("returns")}
          >
            <i className="ri-arrow-return-line"></i>
            Returns ({pendingReturns.length})
          </button>
        </div>

        {/* ========== MY DRESSES TAB ========== */}
        {activeTab === "my-dresses" && (
          <div className="my-dresses-tab">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading your dresses...</p>
              </div>
            ) : dresses.length === 0 ? (
              <div className="empty-state">
                <i className="ri-inbox-line"></i>
                <h3>No dresses yet</h3>
                <p>Start by adding your first dress</p>
                <button 
                  className="btn-primary"
                  onClick={() => setActiveTab("add-dress")}
                >
                  <i className="ri-add-line"></i>
                  Add Your First Dress
                </button>
              </div>
            ) : (
              <div className="dresses-grid">
                {dresses.map((dress) => (
                  <div key={dress._id} className="dress-card">
                    <div className="dress-image">
                      <img 
                        src={dress.image || "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80"} 
                        alt={dress.name}
                      />
                      <div className={`status-badge ${dress.available ? 'available' : 'rented'}`}>
                        {dress.available ? 'Available' : 'Rented'}
                      </div>
                    </div>
                    
                    <div className="dress-info">
                      <h3 className="dress-name">{dress.name}</h3>
                      <p className="dress-category">{dress.category}</p>
                      
                      <div className="dress-details">
                        <span className="dress-size">
                          <i className="ri-ruler-line"></i> {dress.size}
                        </span>
                        <span className="dress-color">
                          <i className="ri-palette-line"></i> {dress.color}
                        </span>
                      </div>
                      
                      <div className="dress-price">
                        NPR {formatPrice(dress.price)} <span>/day</span>
                      </div>
                      
                      {dress.description && (
                        <p className="dress-description">{dress.description}</p>
                      )}
                    </div>
                    
                    <div className="dress-actions">
                      <button 
                        className={`action-btn toggle ${dress.available ? 'rented' : 'available'}`}
                        onClick={() => handleToggleAvailability(dress._id, dress.available)}
                      >
                        <i className={`ri-${dress.available ? 'close' : 'check'}-line`}></i>
                        {dress.available ? 'Mark Rented' : 'Mark Available'}
                      </button>
                      
                      <button 
                        className="action-btn edit"
                        onClick={() => handleEditClick(dress)}
                      >
                        <i className="ri-edit-line"></i>
                        Edit
                      </button>
                      
                      <button 
                        className="action-btn delete"
                        onClick={() => handleDelete(dress._id)}
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========== ADD DRESS TAB WITH IMAGE UPLOAD ========== */}
        {activeTab === "add-dress" && (
          <div className="add-dress-tab">
            <div className="form-card">
              <h2>Add New Dress</h2>
              <p className="form-subtitle">Fill in the details below and upload an image</p>
              
              <form onSubmit={handleSubmit} className="dress-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">
                      <i className="ri-shirt-line"></i>
                      Dress Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., Red Silk Saree"
                      className={formErrors.name ? 'error' : ''}
                    />
                    {formErrors.name && <span className="error-text">{formErrors.name}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="category">
                      <i className="ri-grid-line"></i>
                      Category *
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className={formErrors.category ? 'error' : ''}
                    >
                      <option value="">Select category</option>
                      <option value="Wedding">Wedding</option>
                      <option value="Festival">Festival</option>
                      <option value="Party">Party</option>
                      <option value="Traditional">Traditional</option>
                      <option value="Modern">Modern</option>
                    </select>
                    {formErrors.category && <span className="error-text">{formErrors.category}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="size">
                      <i className="ri-ruler-line"></i>
                      Size *
                    </label>
                    <select
                      id="size"
                      name="size"
                      value={formData.size}
                      onChange={handleInputChange}
                      className={formErrors.size ? 'error' : ''}
                    >
                      <option value="">Select size</option>
                      <option value="XS">XS</option>
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="XL">XL</option>
                      <option value="XXL">XXL</option>
                      <option value="Custom">Custom</option>
                    </select>
                    {formErrors.size && <span className="error-text">{formErrors.size}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="color">
                      <i className="ri-palette-line"></i>
                      Color *
                    </label>
                    <input
                      type="text"
                      id="color"
                      name="color"
                      value={formData.color}
                      onChange={handleInputChange}
                      placeholder="e.g., Red, Blue, Green"
                      className={formErrors.color ? 'error' : ''}
                    />
                    {formErrors.color && <span className="error-text">{formErrors.color}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="price">
                      <i className="ri-money-rupee-circle-line"></i>
                      Price per day (NPR) *
                    </label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="e.g., 2500"
                      min="1"
                      className={formErrors.price ? 'error' : ''}
                    />
                    {formErrors.price && <span className="error-text">{formErrors.price}</span>}
                  </div>

                  <div className="form-group">
                    <label>
                      <i className="ri-image-line"></i>
                      Dress Image *
                    </label>
                    <div 
                      className={`file-upload-area ${formErrors.image ? 'error' : ''}`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        style={{ display: 'none' }}
                      />
                      {!imagePreview ? (
                        <>
                          <i className="ri-upload-cloud-line"></i>
                          <p>Click to upload or drag and drop</p>
                          <span className="upload-hint">PNG, JPG, JPEG up to 5MB</span>
                        </>
                      ) : (
                        <div className="file-selected">
                          <i className="ri-checkbox-circle-line"></i>
                          <span>Image selected</span>
                        </div>
                      )}
                    </div>
                    {formErrors.image && <span className="error-text">{formErrors.image}</span>}
                  </div>
                </div>

                {/* Image Preview */}
                {imagePreview && (
                  <div className="image-preview-container">
                    <div className="image-preview">
                      <img src={imagePreview} alt="Preview" />
                      <button 
                        type="button"
                        className="remove-image"
                        onClick={handleRemoveImage}
                      >
                        <i className="ri-close-line"></i>
                      </button>
                    </div>
                  </div>
                )}

                {/* Upload Progress Bar */}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="upload-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">{uploadProgress}% Uploaded</span>
                  </div>
                )}

                <div className="form-group full-width">
                  <label htmlFor="description">
                    <i className="ri-file-text-line"></i>
                    Description (optional)
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Tell us about this dress..."
                    rows="4"
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn-outline"
                    onClick={() => {
                      setActiveTab("my-dresses");
                      setFormData({
                        name: "",
                        size: "",
                        color: "",
                        category: "",
                        price: "",
                        description: ""
                      });
                      setImageFile(null);
                      setImagePreview(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-small"></span>
                        Adding...
                      </>
                    ) : (
                      <>
                        <i className="ri-add-line"></i>
                        Add Dress
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========== PENDING BOOKINGS TAB ========== */}
        {activeTab === "pending" && (
          <div className="bookings-tab">
            <h2 className="tab-heading">Pending Bookings</h2>
            {bookingsLoading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading bookings...</p>
              </div>
            ) : pendingBookings.length === 0 ? (
              <div className="empty-state">
                <i className="ri-time-line"></i>
                <h3>No pending bookings</h3>
                <p>When renters book your dresses, they'll appear here</p>
              </div>
            ) : (
              <div className="bookings-grid">
                {pendingBookings.map((booking) => (
                  <div key={booking._id} className="booking-card">
                    <div className="booking-header">
                      <div className="booking-dress-info">
                        <img 
                          src={booking.dress?.image || "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=100&q=80"} 
                          alt={booking.dress?.name}
                          className="booking-dress-image"
                        />
                        <div>
                          <h3>{booking.dress?.name}</h3>
                          <p className="booking-dress-category">{booking.dress?.category}</p>
                        </div>
                      </div>
                      <span className="booking-status pending">Pending</span>
                    </div>

                    <div className="booking-details">
                      <div className="detail-row">
                        <i className="ri-user-line"></i>
                        <strong>Renter:</strong> {booking.renter?.name}
                      </div>
                      <div className="detail-row">
                        <i className="ri-phone-line"></i>
                        <strong>Phone:</strong> {booking.deliveryAddress?.phone}
                      </div>
                      <div className="detail-row">
                        <i className="ri-map-pin-line"></i>
                        <strong>Delivery Address:</strong> {booking.deliveryAddress?.address}, {booking.deliveryAddress?.city}
                      </div>
                      <div className="detail-row">
                        <i className="ri-calendar-line"></i>
                        <strong>Dates:</strong> {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                      </div>
                      <div className="detail-row">
                        <i className="ri-money-rupee-circle-line"></i>
                        <strong>Total Amount:</strong> NPR {formatPrice(booking.totalAmount)}
                      </div>
                      
                      {/* Toggle Renter Details Button */}
                      <button 
                        className="toggle-details-btn"
                        onClick={() => toggleRenterDetails(booking._id)}
                      >
                        <i className={`ri-arrow-${expandedRenter === booking._id ? 'up' : 'down'}-s-line`}></i>
                        {expandedRenter === booking._id ? 'Hide Refund Details' : 'View Refund Details'}
                      </button>

                      {/* Expanded Renter Details */}
                      {expandedRenter === booking._id && booking.renter && (
                        <div className="renter-details-expanded">
                          <h4>Renter Refund Information</h4>
                          
                          <div className="renter-info-section">
                            <p><strong>Email:</strong> {booking.renter.email || 'Not provided'}</p>
                            <p><strong>City:</strong> {booking.renter.city || 'Not provided'}</p>
                          </div>

                          <div className="refund-method-badge">
                            <strong>Preferred Refund Method:</strong>{' '}
                            <span className={`method-badge ${booking.renter.preferredRefundMethod || 'none'}`}>
                              {booking.renter.preferredRefundMethod === 'bank' ? 'Bank Transfer' : 
                               booking.renter.preferredRefundMethod === 'digital_wallet' ? 'Digital Wallet' : 
                               booking.renter.preferredRefundMethod === 'cash' ? 'Cash' : 'Not specified'}
                            </span>
                          </div>

                          {/* Bank Details */}
                          {booking.renter.preferredRefundMethod === 'bank' && booking.renter.bankDetails && (
                            <div className="bank-details">
                              <h5>Bank Account Details</h5>
                              {booking.renter.bankDetails.accountHolder ? (
                                <p><strong>Account Holder:</strong> {booking.renter.bankDetails.accountHolder}</p>
                              ) : (
                                <p className="text-muted">Account holder name not provided</p>
                              )}
                              {booking.renter.bankDetails.bankName ? (
                                <p><strong>Bank Name:</strong> {booking.renter.bankDetails.bankName}</p>
                              ) : (
                                <p className="text-muted">Bank name not provided</p>
                              )}
                              {booking.renter.bankDetails.accountNumber ? (
                                <p><strong>Account Number:</strong> {booking.renter.bankDetails.accountNumber}</p>
                              ) : (
                                <p className="text-muted">Account number not provided</p>
                              )}
                              {booking.renter.bankDetails.ifscCode && (
                                <p><strong>IFSC Code:</strong> {booking.renter.bankDetails.ifscCode}</p>
                              )}
                            </div>
                          )}

                          {/* Digital Wallet Details */}
                          {booking.renter.preferredRefundMethod === 'digital_wallet' && booking.renter.digitalWallet && (
                            <div className="wallet-details">
                              <h5>Digital Wallet Details</h5>
                              {booking.renter.digitalWallet.provider ? (
                                <p><strong>Provider:</strong> {booking.renter.digitalWallet.provider}</p>
                              ) : (
                                <p className="text-muted">Provider not specified</p>
                              )}
                              {booking.renter.digitalWallet.phoneNumber ? (
                                <p><strong>Phone Number:</strong> {booking.renter.digitalWallet.phoneNumber}</p>
                              ) : (
                                <p className="text-muted">Phone number not provided</p>
                              )}
                              {booking.renter.digitalWallet.qrCode && (
                                <div className="qr-code-preview">
                                  <p><strong>QR Code:</strong></p>
                                  <img 
                                    src={booking.renter.digitalWallet.qrCode.startsWith('http') ? booking.renter.digitalWallet.qrCode : `http://localhost:5000${booking.renter.digitalWallet.qrCode}`} 
                                    alt="Payment QR Code"
                                    className="qr-thumbnail"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {/* Show message if no details provided */}
                          {(!booking.renter.bankDetails || Object.keys(booking.renter.bankDetails).every(key => !booking.renter.bankDetails[key])) && 
                           (!booking.renter.digitalWallet || Object.keys(booking.renter.digitalWallet).every(key => !booking.renter.digitalWallet[key])) && (
                            <p className="no-details-message">
                              <i className="ri-information-line"></i>
                              The renter hasn't added their refund details yet. They can add them in their profile.
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="booking-actions">
                      <button 
                        className="btn-confirm"
                        onClick={() => handleConfirmBooking(booking._id)}
                        disabled={processingBooking === booking._id}
                      >
                        {processingBooking === booking._id ? (
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
                      <button 
                        className="btn-reject"
                        onClick={() => handleRejectBooking(booking._id)}
                        disabled={processingBooking === booking._id}
                      >
                        <i className="ri-close-line"></i>
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========== ACTIVE BOOKINGS TAB ========== */}
        {activeTab === "active" && (
          <div className="bookings-tab">
            <h2 className="tab-heading">Active Rentals</h2>
            {activeBookingsLoading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading active rentals...</p>
              </div>
            ) : activeBookings.length === 0 ? (
              <div className="empty-state">
                <i className="ri-calendar-check-line"></i>
                <h3>No active rentals</h3>
                <p>When you confirm bookings, they'll appear here</p>
              </div>
            ) : (
              <div className="bookings-grid">
                {activeBookings.map((booking) => {
                  const endingSoon = isEndingSoon(booking.endDate);
                  return (
                    <div key={booking._id} className={`booking-card ${endingSoon ? 'ending-soon' : ''}`}>
                      <div className="booking-header">
                        <div className="booking-dress-info">
                          <img 
                            src={booking.dress?.image || "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=100&q=80"} 
                            alt={booking.dress?.name}
                            className="booking-dress-image"
                          />
                          <div>
                            <h3>{booking.dress?.name}</h3>
                            <p className="booking-dress-category">{booking.dress?.category}</p>
                          </div>
                        </div>
                        <span className="booking-status active">Active</span>
                      </div>

                      <div className="booking-details">
                        <div className="detail-row">
                          <i className="ri-user-line"></i>
                          <strong>Renter:</strong> {booking.renter?.name}
                        </div>
                        <div className="detail-row">
                          <i className="ri-phone-line"></i>
                          <strong>Phone:</strong> {booking.deliveryAddress?.phone}
                        </div>
                        <div className="detail-row">
                          <i className="ri-map-pin-line"></i>
                          <strong>Address:</strong> {booking.deliveryAddress?.address}, {booking.deliveryAddress?.city}
                        </div>
                        <div className="detail-row">
                          <i className="ri-calendar-line"></i>
                          <strong>Rental Period:</strong>
                        </div>
                        <div className="date-range">
                          <span className="start-date">From: {formatDate(booking.startDate)}</span>
                          <span className="end-date">To: {formatDate(booking.endDate)}</span>
                        </div>
                        {endingSoon && (
                          <div className="ending-soon-badge">
                            <i className="ri-alert-line"></i>
                            Rental ending soon!
                          </div>
                        )}
                        <div className="detail-row">
                          <i className="ri-money-rupee-circle-line"></i>
                          <strong>Total Paid:</strong> NPR {formatPrice(booking.totalAmount)}
                        </div>
                        
                        {/* Toggle Renter Details Button */}
                        <button 
                          className="toggle-details-btn"
                          onClick={() => toggleActiveRenterDetails(booking._id)}
                        >
                          <i className={`ri-arrow-${expandedActiveRenter === booking._id ? 'up' : 'down'}-s-line`}></i>
                          {expandedActiveRenter === booking._id ? 'Hide Refund Details' : 'View Refund Details'}
                        </button>

                        {/* Expanded Renter Details */}
                        {expandedActiveRenter === booking._id && booking.renter && (
                          <div className="renter-details-expanded">
                            <h4>Renter Refund Information</h4>
                            
                            <div className="renter-info-section">
                              <p><strong>Email:</strong> {booking.renter.email || 'Not provided'}</p>
                              <p><strong>City:</strong> {booking.renter.city || 'Not provided'}</p>
                            </div>

                            <div className="refund-method-badge">
                              <strong>Preferred Refund Method:</strong>{' '}
                              <span className={`method-badge ${booking.renter.preferredRefundMethod || 'none'}`}>
                                {booking.renter.preferredRefundMethod === 'bank' ? 'Bank Transfer' : 
                                 booking.renter.preferredRefundMethod === 'digital_wallet' ? 'Digital Wallet' : 
                                 booking.renter.preferredRefundMethod === 'cash' ? 'Cash' : 'Not specified'}
                              </span>
                            </div>

                            {/* Bank Details */}
                            {booking.renter.preferredRefundMethod === 'bank' && booking.renter.bankDetails && (
                              <div className="bank-details">
                                <h5>Bank Account Details</h5>
                                {booking.renter.bankDetails.accountHolder ? (
                                  <p><strong>Account Holder:</strong> {booking.renter.bankDetails.accountHolder}</p>
                                ) : (
                                  <p className="text-muted">Account holder name not provided</p>
                                )}
                                {booking.renter.bankDetails.bankName ? (
                                  <p><strong>Bank Name:</strong> {booking.renter.bankDetails.bankName}</p>
                                ) : (
                                  <p className="text-muted">Bank name not provided</p>
                                )}
                                {booking.renter.bankDetails.accountNumber ? (
                                  <p><strong>Account Number:</strong> {booking.renter.bankDetails.accountNumber}</p>
                                ) : (
                                  <p className="text-muted">Account number not provided</p>
                                )}
                                {booking.renter.bankDetails.ifscCode && (
                                  <p><strong>IFSC Code:</strong> {booking.renter.bankDetails.ifscCode}</p>
                                )}
                              </div>
                            )}

                            {/* Digital Wallet Details */}
                            {booking.renter.preferredRefundMethod === 'digital_wallet' && booking.renter.digitalWallet && (
                              <div className="wallet-details">
                                <h5>Digital Wallet Details</h5>
                                {booking.renter.digitalWallet.provider ? (
                                  <p><strong>Provider:</strong> {booking.renter.digitalWallet.provider}</p>
                                ) : (
                                  <p className="text-muted">Provider not specified</p>
                                )}
                                {booking.renter.digitalWallet.phoneNumber ? (
                                  <p><strong>Phone Number:</strong> {booking.renter.digitalWallet.phoneNumber}</p>
                                ) : (
                                  <p className="text-muted">Phone number not provided</p>
                                )}
                                {booking.renter.digitalWallet.qrCode && (
                                  <div className="qr-code-preview">
                                    <p><strong>QR Code:</strong></p>
                                    <img 
                                      src={booking.renter.digitalWallet.qrCode.startsWith('http') ? booking.renter.digitalWallet.qrCode : `http://localhost:5000${booking.renter.digitalWallet.qrCode}`} 
                                      alt="Payment QR Code"
                                      className="qr-thumbnail"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.style.display = 'none';
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Show message if no details provided */}
                            {(!booking.renter.bankDetails || Object.keys(booking.renter.bankDetails).every(key => !booking.renter.bankDetails[key])) && 
                             (!booking.renter.digitalWallet || Object.keys(booking.renter.digitalWallet).every(key => !booking.renter.digitalWallet[key])) && (
                              <p className="no-details-message">
                                <i className="ri-information-line"></i>
                                The renter hasn't added their refund details yet. They can add them in their profile.
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="booking-actions">
                        <button 
                          className="btn-return-ready"
                          onClick={() => handleMarkAsReturnReady(booking._id)}
                          disabled={processingBooking === booking._id}
                        >
                          <i className="ri-arrow-return-line"></i>
                          Mark Return Ready
                        </button>
                        <button 
                          className="btn-contact"
                          onClick={() => window.location.href = `mailto:${booking.renter?.email}`}
                        >
                          <i className="ri-message-line"></i>
                          Contact Renter
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========== PENDING RETURNS TAB ========== */}
        {activeTab === "returns" && (
          <div className="returns-tab">
            <h2 className="tab-heading">Pending Returns</h2>
            {returnsLoading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading returns...</p>
              </div>
            ) : pendingReturns.length === 0 ? (
              <div className="empty-state">
                <i className="ri-arrow-return-line"></i>
                <h3>No pending returns</h3>
                <p>When renters return dresses, they'll appear here</p>
              </div>
            ) : (
              <div className="returns-grid">
                {pendingReturns.map((returnItem) => (
                  <div key={returnItem._id} className="return-card">
                    <div className="return-header">
                      <h3>{returnItem.dress?.name || "Dress"}</h3>
                      <span className={`return-status ${returnItem.status}`}>
                        {returnItem.status}
                      </span>
                    </div>
                    
                    <div className="return-details">
                      <p>
                        <i className="ri-user-line"></i>
                        <strong>Renter:</strong> {returnItem.renter?.name}
                      </p>
                      <p>
                        <i className="ri-phone-line"></i>
                        <strong>Phone:</strong> {returnItem.renter?.phone || "Not provided"}
                      </p>
                      <p>
                        <i className="ri-calendar-line"></i>
                        <strong>Return Initiated:</strong> {formatDate(returnItem.returnInitiatedAt)}
                      </p>
                      <p>
                        <i className="ri-camera-line"></i>
                        <strong>Photos:</strong> {returnItem.photos?.length || 0} submitted
                      </p>
                      <p>
                        <i className="ri-check-line"></i>
                        <strong>Renter's Condition:</strong> {returnItem.renterAssessment?.condition}
                      </p>
                      {returnItem.renterAssessment?.comments && (
                        <p>
                          <i className="ri-chat-1-line"></i>
                          <strong>Comments:</strong> {returnItem.renterAssessment.comments}
                        </p>
                      )}
                    </div>

                    <div className="return-actions">
                      <Link 
                        to={`/owner/return/${returnItem._id}`}
                        className="btn-primary"
                      >
                        <i className="ri-search-line"></i>
                        Review Return
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========== EDIT DRESS MODAL WITH IMAGE UPLOAD ========== */}
        {showEditModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Edit Dress</h2>
                <button 
                  className="modal-close"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingDress(null);
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                >
                  <i className="ri-close-line"></i>
                </button>
              </div>
              
              <form onSubmit={handleUpdate} className="dress-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-name">Dress Name *</label>
                    <input
                      type="text"
                      id="edit-name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit-category">Category *</label>
                    <select
                      id="edit-category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                    >
                      <option value="Wedding">Wedding</option>
                      <option value="Festival">Festival</option>
                      <option value="Party">Party</option>
                      <option value="Traditional">Traditional</option>
                      <option value="Modern">Modern</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-size">Size *</label>
                    <select
                      id="edit-size"
                      name="size"
                      value={formData.size}
                      onChange={handleInputChange}
                    >
                      <option value="XS">XS</option>
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="XL">XL</option>
                      <option value="XXL">XXL</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit-color">Color *</label>
                    <input
                      type="text"
                      id="edit-color"
                      name="color"
                      value={formData.color}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-price">Price (NPR) *</label>
                    <input
                      type="number"
                      id="edit-price"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Dress Image</label>
                    <div 
                      className="file-upload-area"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        style={{ display: 'none' }}
                      />
                      {!imagePreview ? (
                        <>
                          <i className="ri-upload-cloud-line"></i>
                          <p>Click to upload new image</p>
                        </>
                      ) : (
                        <div className="file-selected">
                          <i className="ri-checkbox-circle-line"></i>
                          <span>New image selected</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Image Preview in Edit Modal */}
                {imagePreview && (
                  <div className="image-preview-container">
                    <div className="image-preview">
                      <img src={imagePreview} alt="Preview" />
                      <button 
                        type="button"
                        className="remove-image"
                        onClick={handleRemoveImage}
                      >
                        <i className="ri-close-line"></i>
                      </button>
                    </div>
                  </div>
                )}

                <div className="form-group full-width">
                  <label htmlFor="edit-description">Description</label>
                  <textarea
                    id="edit-description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                  />
                </div>

                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="btn-outline"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingDress(null);
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Updating...' : 'Update Dress'}
                  </button>
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