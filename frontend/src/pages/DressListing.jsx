import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./DressListing.css";

const DressListing = () => {
  const [dresses, setDresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: "",
    size: "",
    color: ""
  });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [activeVideo, setActiveVideo] = useState(0);
  const [backendStatus, setBackendStatus] = useState('checking');
  
  const navigate = useNavigate();

  // Check if backend is running
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/browse', {
          method: 'HEAD',
          signal: AbortSignal.timeout(2000)
        });
        setBackendStatus('online');
        console.log('Backend is running');
      } catch (err) {
        setBackendStatus('offline');
        console.log('Backend is offline');
        setError("Cannot connect to server. Please make sure backend is running on port 5000.");
        setLoading(false);
      }
    };
    checkBackend();
  }, []);

  // Auto-rotate videos in the hero banner
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveVideo((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch dresses from backend
  useEffect(() => {
    const fetchDresses = async () => {
      if (backendStatus === 'offline') {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams();
        if (filters.category && filters.category !== "") {
          queryParams.append("category", filters.category);
        }
        if (filters.size && filters.size !== "") {
          queryParams.append("size", filters.size);
        }
        if (filters.color && filters.color !== "") {
          queryParams.append("color", filters.color);
        }

        // FIXED: Use /filter endpoint for filtered results
        let url;
        if (queryParams.toString()) {
          url = `http://localhost:5000/api/browse/filter?${queryParams.toString()}`;
        } else {
          url = `http://localhost:5000/api/browse/`;
        }
        
        console.log("🔍 Fetching URL:", url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }

        const data = await response.json();
        
        console.log("📊 Received data count:", data.length);
        
        if (!data || data.length === 0) {
          setDresses([]);
        } else {
          const transformedDresses = data.map(dress => ({
            _id: dress._id,
            name: dress.name,
            category: dress.category,
            size: dress.size,
            color: dress.color,
            pricePerDay: dress.price,
            description: dress.description || `${dress.category} - ${dress.color} traditional dress`,
            images: [dress.image || "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80"],
            owner: dress.owner,
            available: dress.available !== undefined ? dress.available : true,
            averageRating: dress.averageRating || 0,
            totalReviews: dress.totalReviews || 0
          }));
          
          setDresses(transformedDresses);
        }
      } catch (err) {
        console.error('Failed to fetch dresses:', err);
        setError(err.message || "Could not load dresses. Please try again later.");
        setDresses([]);
      } finally {
        setLoading(false);
      }
    };

    if (backendStatus === 'online') {
      fetchDresses();
    }
  }, [filters.category, filters.size, filters.color, backendStatus]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ category: "", size: "", color: "" });
  };

  const hasActiveFilters = filters.category || filters.size || filters.color;

  const handleRentNow = (e, dressId) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/booking/${dressId}`);
  };

  const handleDressClick = (dressId) => {
    navigate(`/booking/${dressId}`);
  };

  // Video banner content with working URLs
  const videoBanners = [
    {
      video: "https://cdn.pixabay.com/video/2021/08/30/89177-591891745_large.mp4",
      title: "Nepali Wedding Traditions",
      description: "Experience the rich cultural heritage of Nepali weddings"
    },
    {
      video: "https://cdn.pixabay.com/video/2020/07/21/45231-443419881_large.mp4",
      title: "Festival Celebrations",
      description: "Traditional attire for Dashain, Tihar, and Teej"
    },
    {
      video: "https://cdn.pixabay.com/video/2019/10/16/28407-368586478_large.mp4",
      title: "Modern Ethnic Fashion",
      description: "Fusion wear combining tradition with contemporary style"
    }
  ];

  return (
    <div className="dress-listing">
      <Navbar />

      {/* VIDEO HEADER */}
      <div className="video-hero-container">
        <div className="video-background">
          {videoBanners.map((banner, index) => (
            <video
              key={index}
              className={`video-banner ${activeVideo === index ? "active" : ""}`}
              autoPlay
              loop
              muted
              playsInline
            >
              <source src={banner.video} type="video/mp4" />
            </video>
          ))}
          <div className="video-overlay"></div>
        </div>
        
        <div className="video-content">
          <h1 className="video-title">
            {videoBanners[activeVideo].title}
          </h1>
          <p className="video-description">
            {videoBanners[activeVideo].description}
          </p>
          <div className="video-indicators">
            {videoBanners.map((_, index) => (
              <button
                key={index}
                className={`video-indicator ${activeVideo === index ? "active" : ""}`}
                onClick={() => setActiveVideo(index)}
              >
                <span className="indicator-dot"></span>
              </button>
            ))}
          </div>
          <div className="video-cta">
            <a href="#collection" className="btn-primary btn-large">
              <span>Browse Collection</span>
              <i className="ri-arrow-right-line"></i>
            </a>
          </div>
        </div>

        <div className="video-stats">
          <div className="stat-card">
            <span className="stat-number">200+</span>
            <span className="stat-label">Nepali Dresses</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">50+</span>
            <span className="stat-label">Designers</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">1000+</span>
            <span className="stat-label">Happy Customers</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="listing-header" id="collection">
        <div className="container">
          <h1 className="listing-title">Browse Our Collection</h1>
          <p className="listing-subtitle">
            Discover traditional Nepali dresses for your special occasion
          </p>
          {backendStatus === 'offline' && (
            <div className="backend-offline-warning">
              <i className="ri-error-warning-line"></i>
              <span>Backend server not running. Please start the server on port 5000.</span>
            </div>
          )}
        </div>
      </div>

      <div className="container">
        {/* Filter Bar */}
        <div className="filter-bar">
          <div className="filter-toggle">
            <button 
              className={`filter-toggle-btn ${showFilters ? "active" : ""}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <i className="ri-filter-3-line"></i>
              <span>Filters</span>
              {hasActiveFilters && <span className="filter-badge"></span>}
            </button>
          </div>

          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              <i className="ri-grid-line"></i>
            </button>
            <button 
              className={`view-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
            >
              <i className="ri-list-check-2"></i>
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        <div className={`filter-panel ${showFilters ? "show" : ""}`}>
          <div className="filter-group">
            <label className="filter-label">Category</label>
            <select name="category" value={filters.category} onChange={handleFilterChange}>
              <option value="">All Categories</option>
              <option value="Wedding">Wedding</option>
              <option value="Festival">Festival</option>
              <option value="Party">Party</option>
              <option value="Traditional">Traditional</option>
              <option value="Modern">Modern</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Size</label>
            <select name="size" value={filters.size} onChange={handleFilterChange}>
              <option value="">All Sizes</option>
              <option value="XS">XS</option>
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
              <option value="XXL">XXL</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Color</label>
            <select name="color" value={filters.color} onChange={handleFilterChange}>
              <option value="">All Colors</option>
              <option value="Red">Red</option>
              <option value="Blue">Blue</option>
              <option value="Green">Green</option>
              <option value="Gold">Gold</option>
              <option value="Maroon">Maroon</option>
              <option value="Pink">Pink</option>
              <option value="Purple">Purple</option>
              <option value="Black">Black</option>
              <option value="White">White</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button className="clear-filters-btn" onClick={clearFilters}>
              <i className="ri-close-line"></i> Clear All
            </button>
          )}
        </div>

        {/* Results Info */}
        <div className="results-info">
          <p><span className="results-count">{dresses.length}</span> dresses found</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading dresses...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="error-state">
            <i className="ri-error-warning-line"></i>
            <p>{error}</p>
            <button className="retry-btn" onClick={() => window.location.reload()}>Try Again</button>
          </div>
        )}

        {/* Empty State - Show different message when filters are applied */}
        {!loading && !error && backendStatus === 'online' && dresses.length === 0 && (
          <div className="empty-state">
            <i className="ri-inbox-line"></i>
            {hasActiveFilters ? (
              <>
                <h3>No dresses match your filters</h3>
                <p>Try changing your filter criteria</p>
                <button className="clear-filters-btn" onClick={clearFilters}>Clear Filters</button>
              </>
            ) : (
              <>
                <h3>No dresses available</h3>
                <p>Check back later for new additions</p>
              </>
            )}
          </div>
        )}

        {/* Dress Grid/List */}
        {!loading && dresses.length > 0 && (
          <div className={`dress-results ${viewMode}`}>
            {dresses.map((dress) => (
              <div key={dress._id} className="dress-item-wrapper">
                {viewMode === "grid" ? (
                  <div className="dress-card" onClick={() => handleDressClick(dress._id)} style={{ cursor: 'pointer' }}>
                    <div className="dress-image-wrapper">
                      <img src={dress.images[0]} alt={dress.name} className="dress-image" />
                      {!dress.available && <span className="dress-badge">Rented</span>}
                    </div>
                    <div className="dress-info">
                      <h3 className="dress-name">{dress.name}</h3>
                      <p className="dress-category">{dress.category}</p>
                      <p className="dress-size">Size: {dress.size} | Color: {dress.color}</p>
                      
                      <div className="dress-rating">
                        <div className="stars">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <i key={star} className={`ri-star${star <= Math.round(dress.averageRating) ? '-fill' : '-line'}`} style={{ color: '#fbbf24', fontSize: '0.9rem' }}></i>
                          ))}
                        </div>
                        <button className="review-count-link" onClick={(e) => { e.stopPropagation(); navigate(`/reviews/${dress._id}`); }}>
                          ({dress.totalReviews} reviews)
                        </button>
                      </div>
                      
                      <div className="dress-price-row">
                        <span className="dress-price">NPR {dress.pricePerDay}</span>
                        <span className="dress-per-day">/day</span>
                      </div>
                      
                      <div className="dress-card-actions">
                        <button className="rent-btn" onClick={(e) => { e.stopPropagation(); handleRentNow(e, dress._id); }}>Rent Now</button>
                        <button className="review-btn" onClick={(e) => { e.stopPropagation(); navigate(`/reviews/${dress._id}`); }}>
                          <i className="ri-star-line"></i> Reviews
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="dress-list-card" onClick={() => handleDressClick(dress._id)} style={{ cursor: 'pointer' }}>
                    <div className="list-image-wrapper">
                      <img src={dress.images[0]} alt={dress.name} className="list-image" />
                      {!dress.available && <span className="dress-badge">Rented</span>}
                    </div>
                    <div className="list-info">
                      <h3 className="list-name">{dress.name}</h3>
                      <p className="list-category">{dress.category}</p>
                      <p className="list-description">{dress.description}</p>
                      <p className="list-size">Size: {dress.size} | Color: {dress.color}</p>
                      
                      <div className="list-rating">
                        <div className="stars">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <i key={star} className={`ri-star${star <= Math.round(dress.averageRating) ? '-fill' : '-line'}`} style={{ color: '#fbbf24' }}></i>
                          ))}
                        </div>
                        <button className="review-count-link" onClick={(e) => { e.stopPropagation(); navigate(`/reviews/${dress._id}`); }}>
                          {dress.totalReviews} reviews
                        </button>
                      </div>
                      
                      <div className="list-price-row">
                        <span className="list-price">NPR {dress.pricePerDay}</span>
                        <span className="list-per-day">/day</span>
                      </div>
                      
                      <div className="list-card-actions">
                        <button className="list-rent-btn" onClick={(e) => { e.stopPropagation(); handleRentNow(e, dress._id); }}>Rent Now</button>
                        <button className="list-review-btn" onClick={(e) => { e.stopPropagation(); navigate(`/reviews/${dress._id}`); }}>
                          <i className="ri-star-line"></i> Read Reviews
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default DressListing;