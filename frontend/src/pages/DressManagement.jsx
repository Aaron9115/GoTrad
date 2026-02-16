import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./DressManagement.css";

const DressManagement = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dresses, setDresses] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    size: "",
    color: "",
    category: "",
    price: "",
    image: ""
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState("my-dresses"); // "my-dresses" or "add-dress"
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Check if user is logged in and is owner
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        // Decode token or fetch user data
        // For now, we'll simulate a logged-in owner
        const userData = {
          _id: "123",
          name: "John Owner",
          email: "owner@example.com",
          role: "owner"
        };
        setUser(userData);
        setIsOwner(true);
        fetchUserDresses();
      } catch (err) {
        console.error("Auth error:", err);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  // Fetch user's dresses
  const fetchUserDresses = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/dress", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (response.ok) {
        // Filter dresses owned by current user
        const userDresses = data.filter(dress => dress.owner._id === "123");
        setDresses(userDresses);
      }
    } catch (err) {
      console.error("Error fetching dresses:", err);
      // Use mock data for demo
      setDemosetDresses();
    }
  };

  // Mock data for demo
  const setDemosetDresses = () => {
    setDresses([
      {
        _id: "1",
        name: "Red Gunyu Cholo",
        category: "Wedding",
        size: "M",
        color: "Red",
        price: 2500,
        image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80",
        available: true,
        createdAt: new Date().toISOString()
      },
      {
        _id: "2",
        name: "Blue Dhaka Topi Set",
        category: "Festival",
        size: "L",
        color: "Blue",
        price: 1500,
        image: "https://images.unsplash.com/photo-1556906781-9a412961b4f8?w=600&q=80",
        available: true,
        createdAt: new Date().toISOString()
      },
      {
        _id: "3",
        name: "Gold Bridal Lehenga",
        category: "Wedding",
        size: "XL",
        color: "Gold",
        price: 4500,
        image: "https://images.unsplash.com/photo-1588357716680-17909c80b91d?w=600&q=80",
        available: false,
        createdAt: new Date().toISOString()
      }
    ]);
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  // Handle image URL change with preview
  const handleImageChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, image: value }));
    setImagePreview(value);
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) errors.name = "Dress name is required";
    if (!formData.size) errors.size = "Size is required";
    if (!formData.color.trim()) errors.color = "Color is required";
    if (!formData.category) errors.category = "Category is required";
    if (!formData.price) {
      errors.price = "Price is required";
    } else if (isNaN(formData.price) || Number(formData.price) <= 0) {
      errors.price = "Price must be a positive number";
    }
    if (!formData.image.trim()) {
      errors.image = "Image URL is required";
    } else if (!isValidUrl(formData.image)) {
      errors.image = "Please enter a valid URL";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate URL
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/dress/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          size: formData.size,
          color: formData.color,
          category: formData.category,
          price: Number(formData.price),
          image: formData.image
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add dress");
      }

      // Success
      setSuccessMessage("Dress added successfully!");
      setFormData({
        name: "",
        size: "",
        color: "",
        category: "",
        price: "",
        image: ""
      });
      setImagePreview(null);
      
      // Refresh dresses list
      fetchUserDresses();
      
      // Switch to my dresses tab after 2 seconds
      setTimeout(() => {
        setActiveTab("my-dresses");
        setShowAddForm(false);
      }, 2000);

    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Filter and sort dresses
  const getFilteredDresses = () => {
    let filtered = [...dresses];

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(d => d.category === selectedCategory);
    }

    // Filter by size
    if (selectedSize) {
      filtered = filtered.filter(d => d.size === selectedSize);
    }

    // Filter by color
    if (selectedColor) {
      filtered = filtered.filter(d => d.color.toLowerCase() === selectedColor.toLowerCase());
    }

    // Search by name
    if (searchTerm) {
      filtered = filtered.filter(d => 
        d.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case "price-high":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "price-low":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "name-asc":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        break;
    }

    return filtered;
  };

  // Handle dress availability toggle
  const toggleAvailability = async (dressId, currentStatus) => {
    // This would be an API call in production
    setDresses(prev => prev.map(d => 
      d._id === dressId ? { ...d, available: !currentStatus } : d
    ));
  };

  // Handle dress delete
  const handleDelete = async (dressId) => {
    if (window.confirm("Are you sure you want to delete this dress?")) {
      // This would be an API call in production
      setDresses(prev => prev.filter(d => d._id !== dressId));
    }
  };

  // Get unique categories, sizes, colors for filters
  const uniqueCategories = [...new Set(dresses.map(d => d.category))];
  const uniqueSizes = [...new Set(dresses.map(d => d.size))];
  const uniqueColors = [...new Set(dresses.map(d => d.color))];

  const filteredDresses = getFilteredDresses();

  if (loading) {
    return (
      <div className="dress-management-page">
        <Navbar />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="dress-management-page">
        <Navbar />
        <div className="access-denied">
          <i className="ri-error-warning-line"></i>
          <h2>Access Denied</h2>
          <p>You need to be an owner to access this page.</p>
          <Link to="/" className="btn-primary">Go Home</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="dress-management-page">
      <Navbar />
      
      <div className="dm-container">
        {/* Header */}
        <div className="dm-header">
          <div>
            <h1>Dress <span className="gradient-text">Management</span></h1>
            <p>Manage your dress collection, add new items, and track availability</p>
          </div>
          <button 
            className="btn-primary"
            onClick={() => {
              setShowAddForm(true);
              setActiveTab("add-dress");
            }}
          >
            <i className="ri-add-line"></i>
            Add New Dress
          </button>
        </div>

        {/* Tabs */}
        <div className="dm-tabs">
          <button 
            className={`dm-tab ${activeTab === "my-dresses" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("my-dresses");
              setShowAddForm(false);
            }}
          >
            <i className="ri-grid-line"></i>
            My Dresses ({dresses.length})
          </button>
          <button 
            className={`dm-tab ${activeTab === "add-dress" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("add-dress");
              setShowAddForm(true);
            }}
          >
            <i className="ri-add-circle-line"></i>
            Add New Dress
          </button>
        </div>

        {/* Add Dress Form */}
        {showAddForm && (
          <div className="add-dress-form glass-panel">
            <h2>Add New Dress</h2>
            
            {successMessage && (
              <div className="success-message">
                <i className="ri-checkbox-circle-line"></i>
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="error-message">
                <i className="ri-error-warning-line"></i>
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Dress Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Red Gunyu Cholo"
                    className={formErrors.name ? "error" : ""}
                  />
                  {formErrors.name && <span className="error-text">{formErrors.name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="category">Category *</label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={formErrors.category ? "error" : ""}
                  >
                    <option value="">Select Category</option>
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
                  <label htmlFor="size">Size *</label>
                  <select
                    id="size"
                    name="size"
                    value={formData.size}
                    onChange={handleInputChange}
                    className={formErrors.size ? "error" : ""}
                  >
                    <option value="">Select Size</option>
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
                  <label htmlFor="color">Color *</label>
                  <input
                    type="text"
                    id="color"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    placeholder="e.g., Red, Blue, Green"
                    className={formErrors.color ? "error" : ""}
                  />
                  {formErrors.color && <span className="error-text">{formErrors.color}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="price">Price per day (₹) *</label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="e.g., 2500"
                    min="1"
                    className={formErrors.price ? "error" : ""}
                  />
                  {formErrors.price && <span className="error-text">{formErrors.price}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="image">Image URL *</label>
                  <input
                    type="url"
                    id="image"
                    name="image"
                    value={formData.image}
                    onChange={handleImageChange}
                    placeholder="https://example.com/image.jpg"
                    className={formErrors.image ? "error" : ""}
                  />
                  {formErrors.image && <span className="error-text">{formErrors.image}</span>}
                </div>
              </div>

              {/* Image Preview */}
              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                  <button 
                    type="button"
                    className="remove-image"
                    onClick={() => {
                      setImagePreview(null);
                      setFormData(prev => ({ ...prev, image: "" }));
                    }}
                  >
                    <i className="ri-close-line"></i>
                  </button>
                </div>
              )}

              <div className="form-actions">
                <button 
                  type="button"
                  className="btn-outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setActiveTab("my-dresses");
                    setFormData({
                      name: "",
                      size: "",
                      color: "",
                      category: "",
                      price: "",
                      image: ""
                    });
                    setImagePreview(null);
                    setSuccessMessage("");
                    setErrorMessage("");
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn-primary"
                  disabled={submitLoading}
                >
                  {submitLoading ? (
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
        )}

        {/* My Dresses Section */}
        {activeTab === "my-dresses" && !showAddForm && (
          <div className="my-dresses-section">
            {/* Filters and Search */}
            <div className="dress-filters glass-panel">
              <div className="filter-row">
                <div className="search-box">
                  <i className="ri-search-line"></i>
                  <input
                    type="text"
                    placeholder="Search dresses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="sort-box">
                  <i className="ri-sort-line"></i>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="name-asc">Name: A to Z</option>
                    <option value="name-desc">Name: Z to A</option>
                  </select>
                </div>
              </div>

              <div className="filter-chips">
                <div className="filter-chip-group">
                  <span className="filter-label">Category:</span>
                  <select 
                    className="filter-select"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="">All</option>
                    {uniqueCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-chip-group">
                  <span className="filter-label">Size:</span>
                  <select 
                    className="filter-select"
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                  >
                    <option value="">All</option>
                    {uniqueSizes.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-chip-group">
                  <span className="filter-label">Color:</span>
                  <select 
                    className="filter-select"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                  >
                    <option value="">All</option>
                    {uniqueColors.map(color => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                </div>

                {(selectedCategory || selectedSize || selectedColor || searchTerm) && (
                  <button 
                    className="clear-filters-btn small"
                    onClick={() => {
                      setSelectedCategory("");
                      setSelectedSize("");
                      setSelectedColor("");
                      setSearchTerm("");
                    }}
                  >
                    <i className="ri-close-line"></i>
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Dress Count */}
            <div className="dress-count">
              <span className="count-number">{filteredDresses.length}</span> dresses found
            </div>

            {/* Dresses Grid */}
            {filteredDresses.length === 0 ? (
              <div className="no-dresses">
                <i className="ri-inbox-line"></i>
                <h3>No dresses found</h3>
                <p>Get started by adding your first dress</p>
                <button 
                  className="btn-primary"
                  onClick={() => {
                    setShowAddForm(true);
                    setActiveTab("add-dress");
                  }}
                >
                  <i className="ri-add-line"></i>
                  Add Your First Dress
                </button>
              </div>
            ) : (
              <div className="dresses-grid">
                {filteredDresses.map((dress) => (
                  <div key={dress._id} className="dress-management-card glass-panel">
                    <div className="dress-card-image">
                      <img src={dress.image} alt={dress.name} />
                      <div className={`availability-badge ${dress.available ? 'available' : 'rented'}`}>
                        {dress.available ? 'Available' : 'Rented'}
                      </div>
                    </div>
                    
                    <div className="dress-card-content">
                      <h3>{dress.name}</h3>
                      <p className="dress-category">{dress.category}</p>
                      
                      <div className="dress-specs">
                        <span className="spec">
                          <i className="ri-ruler-line"></i> {dress.size}
                        </span>
                        <span className="spec">
                          <i className="ri-palette-line"></i> {dress.color}
                        </span>
                        <span className="spec price">
                          <i className="ri-money-rupee-circle-line"></i> ₹{dress.price}/day
                        </span>
                      </div>

                      <div className="dress-card-actions">
                        <button 
                          className={`action-btn toggle ${dress.available ? 'rented' : 'available'}`}
                          onClick={() => toggleAvailability(dress._id, dress.available)}
                        >
                          <i className={`ri-${dress.available ? 'close' : 'check'}-line`}></i>
                          {dress.available ? 'Mark as Rented' : 'Mark as Available'}
                        </button>
                        
                        <button 
                          className="action-btn edit"
                          onClick={() => alert('Edit functionality coming soon!')}
                        >
                          <i className="ri-edit-line"></i>
                        </button>
                        
                        <button 
                          className="action-btn delete"
                          onClick={() => handleDelete(dress._id)}
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>

                      <div className="dress-meta">
                        <span>
                          <i className="ri-calendar-line"></i>
                          Added: {new Date(dress.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default DressManagement;