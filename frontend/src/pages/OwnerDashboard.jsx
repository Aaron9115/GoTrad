import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./OwnerDashboard.css";

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("my-dresses"); // my-dresses, add-dress
  const [dresses, setDresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Form state for adding new dress
  const [formData, setFormData] = useState({
    name: "",
    size: "",
    color: "",
    category: "",
    price: "",
    image: "",
    description: ""
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [editingDress, setEditingDress] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Check if user is logged in and is owner
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "owner" && parsedUser.role !== "admin") {
      navigate("/");
      return;
    }

    setUser(parsedUser);
    fetchMyDresses();
  }, [navigate]);

  // Fetch owner's dresses
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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ""
      });
    }
  };

  // Validate form
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
    
    return errors;
  };

  // Handle add dress submit
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
      const token = localStorage.getItem("token");
      
      const response = await fetch("http://localhost:5000/api/dress/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
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
        image: "",
        description: ""
      });
      
      // Refresh the dress list
      fetchMyDresses();
      
      // Switch to my dresses tab after 2 seconds
      setTimeout(() => {
        setActiveTab("my-dresses");
        setSuccess("");
      }, 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete dress
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
      fetchMyDresses();
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle toggle availability
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
      
      // Update local state
      setDresses(dresses.map(dress => 
        dress._id === dressId 
          ? { ...dress, available: !currentStatus }
          : dress
      ));
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle edit button click
  const handleEditClick = (dress) => {
    setEditingDress(dress);
    setFormData({
      name: dress.name,
      size: dress.size,
      color: dress.color,
      category: dress.category,
      price: dress.price,
      image: dress.image || "",
      description: dress.description || ""
    });
    setShowEditModal(true);
  };

  // Handle update dress
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
      
      const response = await fetch(`http://localhost:5000/api/dress/${editingDress._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update dress");
      }

      setSuccess("Dress updated successfully!");
      setShowEditModal(false);
      setEditingDress(null);
      fetchMyDresses();
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Format price with commas
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN").format(price);
  };

  return (
    <div className="owner-dashboard">
      <Navbar />
      
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1>Welcome, <span className="highlight">{user?.name}</span></h1>
            <p className="dashboard-subtitle">Manage your dress collection</p>
          </div>
          <div className="owner-badge">
            <i className="ri-store-line"></i>
            <span>Owner Account</span>
          </div>
        </div>

        {/* Success/Error Messages */}
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

        {/* Dashboard Tabs */}
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
        </div>

        {/* MY DRESSES TAB */}
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
                        ₹{formatPrice(dress.price)} <span>/day</span>
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

        {/* ADD DRESS TAB */}
        {activeTab === "add-dress" && (
          <div className="add-dress-tab">
            <div className="form-card">
              <h2>Add New Dress</h2>
              <p className="form-subtitle">Fill in the details below</p>
              
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
                      Price per day (₹) *
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
                    <label htmlFor="image">
                      <i className="ri-image-line"></i>
                      Image URL (optional)
                    </label>
                    <input
                      type="url"
                      id="image"
                      name="image"
                      value={formData.image}
                      onChange={handleInputChange}
                      placeholder="https://example.com/dress.jpg"
                    />
                  </div>
                </div>

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
                        image: "",
                        description: ""
                      });
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

        {/* Edit Modal */}
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
                    <label htmlFor="edit-price">Price (₹) *</label>
                    <input
                      type="number"
                      id="edit-price"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit-image">Image URL</label>
                    <input
                      type="url"
                      id="edit-image"
                      name="image"
                      value={formData.image}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

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