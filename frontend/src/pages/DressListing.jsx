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
        console.log('✅ Backend is running');
      } catch (err) {
        setBackendStatus('offline');
        console.log('❌ Backend is offline');
        setError("Cannot connect to server. Please make sure backend is running on port 5000.");
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

  // Fetch REAL dresses from backend only
  useEffect(() => {
    const fetchDresses = async () => {
      setLoading(true);
      setError(null);
      
      // Don't try to fetch if backend is offline
      if (backendStatus === 'offline') {
        setLoading(false);
        return;
      }

      try {
        // Build query string from filters
        const queryParams = new URLSearchParams();
        if (filters.category) queryParams.append("category", filters.category);
        if (filters.size) queryParams.append("size", filters.size);
        if (filters.color) queryParams.append("color", filters.color);

        // Use the browse endpoint to get all dresses
        const url = `http://localhost:5000/api/browse${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        
        console.log('Fetching from:', url);
        
        const response = await fetch(url);
        
        // Check if response is OK
        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }

        // Check if response is JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          console.error("Received non-JSON response:", text.substring(0, 200));
          throw new Error("Server returned HTML instead of JSON. Backend might be misconfigured.");
        }
        
        const data = await response.json();
        console.log('Received data from backend:', data);
        
        if (data.length === 0) {
          // No dresses found in backend - show empty state
          setDresses([]);
        } else {
          // Transform backend data to match frontend structure
          const transformedDresses = data.map(dress => ({
            _id: dress._id,
            name: dress.name,
            category: dress.category,
            size: dress.size,
            color: dress.color,
            pricePerDay: dress.price,
            description: dress.description || `${dress.category} - ${dress.color} traditional dress`,
            images: [dress.image || "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80"],
            owner: dress.owner || { name: "Heritage Rental" },
            available: dress.available !== undefined ? dress.available : true
          }));
          
          setDresses(transformedDresses);
        }
        setError(null);
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
    navigate(`/booking/${dressId}`);
  };

  // Video banner content
  const videoBanners = [
    {
      video: "https://player.vimeo.com/external/370331253.sd.mp4?s=90bfe3b958e4441a1146b60020ea0b0b6f6f2a4a&profile_id=139&oauth2_token_id=57447761",
      title: "Nepali Wedding Traditions",
      description: "Experience the rich cultural heritage of Nepali weddings"
    },
    {
      video: "https://player.vimeo.com/external/434045046.sd.mp4?s=3a5b8a7e9b8f7e5d4c3b2a1d0e9f8g7h6i5j4k3l2m1n0o9p8q7r6s5t4u3v2w1x0y9z",
      title: "Festival Celebrations",
      description: "Traditional attire for Dashain, Tihar, and Teej"
    },
    {
      video: "https://player.vimeo.com/external/479581467.sd.mp4?s=8a7b6c5d4e3f2g1h0i9j8k7l6m5n4o3p2q1r0s9t8u7v6w5x4y3z2a1b0c9d8e7f6",
      title: "Modern Ethnic Fashion",
      description: "Fusion wear combining tradition with contemporary style"
    }
  ];

  return (
    <div className="dress-listing">
      <Navbar />

      {/* 🎥 VIDEO HEADER AT TOP */}
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

        {/* Floating stats cards */}
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
            <select 
              name="category" 
              value={filters.category} 
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Categories</option>
              <option value="Wedding">Wedding</option>
              <option value="Festival">Festival</option>
              <option value="Party">Party</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Size</label>
            <select 
              name="size" 
              value={filters.size} 
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Sizes</option>
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Color</label>
            <select 
              name="color" 
              value={filters.color} 
              onChange={handleFilterChange}
              className="filter-select"
            >
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
              <i className="ri-close-line"></i>
              Clear All
            </button>
          )}
        </div>

        {/* Results Info */}
        <div className="results-info">
          <p>
            <span className="results-count">{dresses.length}</span> dresses found
            {hasActiveFilters && " with selected filters"}
          </p>
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
            <button className="retry-btn" onClick={() => window.location.reload()}>
              Try Again
            </button>
          </div>
        )}

        {/* Backend Offline State */}
        {backendStatus === 'offline' && !loading && (
          <div className="error-state">
            <i className="ri-server-line"></i>
            <h3>Backend Server Not Running</h3>
            <p>Please start the backend server on port 5000</p>
            <ol style={{ textAlign: 'left', marginTop: '20px', marginBottom: '20px', paddingLeft: '20px' }}>
              <li>Open terminal in backend folder</li>
              <li>Run: <code>npm start</code></li>
              <li>Refresh this page</li>
            </ol>
            <button className="retry-btn" onClick={() => window.location.reload()}>
              <i className="ri-refresh-line"></i>
              Refresh Page
            </button>
          </div>
        )}

        {/* Empty State - shown when no dresses in database */}
        {!loading && !error && backendStatus === 'online' && dresses.length === 0 && (
          <div className="empty-state">
            <i className="ri-inbox-line"></i>
            <h3>No dresses available</h3>
            <p>Check back later for new additions</p>
          </div>
        )}

        {/* Dress Grid/List - shows ONLY real dresses from database */}
        {!loading && dresses.length > 0 && (
          <div className={`dress-results ${viewMode}`}>
            {dresses.map((dress) => (
              <Link to={`/booking/${dress._id}`} key={dress._id} className="dress-item-link">
                {viewMode === "grid" ? (
                  // GRID VIEW CARD
                  <div className="dress-card">
                    <div className="dress-image-wrapper">
                      <img 
                        src={dress.images[0]} 
                        alt={dress.name}
                        className="dress-image"
                      />
                      {!dress.available && (
                        <span className="dress-badge">Rented</span>
                      )}
                    </div>
                    <div className="dress-info">
                      <h3 className="dress-name">{dress.name}</h3>
                      <p className="dress-category">{dress.category}</p>
                      <p className="dress-size">Size: {dress.size}</p>
                      <div className="dress-price-row">
                        <span className="dress-price">₹{dress.pricePerDay}</span>
                        <span className="dress-per-day">/day</span>
                      </div>
                      <button 
                        className="rent-btn" 
                        onClick={(e) => handleRentNow(e, dress._id)}
                      >
                        Rent Now
                      </button>
                    </div>
                  </div>
                ) : (
                  // LIST VIEW CARD
                  <div className="dress-list-card">
                    <div className="list-image-wrapper">
                      <img 
                        src={dress.images[0]} 
                        alt={dress.name}
                        className="list-image"
                      />
                      {!dress.available && (
                        <span className="dress-badge">Rented</span>
                      )}
                    </div>
                    <div className="list-info">
                      <h3 className="list-name">{dress.name}</h3>
                      <p className="list-category">{dress.category}</p>
                      <p className="list-description">{dress.description}</p>
                      <p className="list-size">Size: {dress.size} | Color: {dress.color}</p>
                      <div className="list-price-row">
                        <span className="list-price">₹{dress.pricePerDay}</span>
                        <span className="list-per-day">/day</span>
                      </div>
                      <button 
                        className="list-rent-btn" 
                        onClick={(e) => handleRentNow(e, dress._id)}
                      >
                        Rent Now
                      </button>
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default DressListing;