import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./DressListing.css";

// Mockup Nepali Traditional Dresses Data (Fallback)
const mockDresses = [
  // Wedding Collection
  {
    _id: "1",
    name: "Red Gunyu Cholo",
    category: "Wedding",
    size: "M",
    color: "Red",
    pricePerDay: 2500,
    description: "Traditional Nepali red Gunyu Cholo with gold embroidery, perfect for weddings and ceremonies.",
    images: ["https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80"],
    owner: { name: "Himalayan Heritage" },
    available: true,
    isNew: true,
    type: "Wedding"
  },
  {
    _id: "2",
    name: "Maroon Haku Patasi",
    category: "Wedding",
    size: "L",
    color: "Maroon",
    pricePerDay: 3200,
    description: "Traditional Haku Patasi in rich maroon with intricate silver work, worn during special occasions.",
    images: ["https://images.unsplash.com/photo-1617128077837-60a09f9596ae?w=600&q=80"],
    owner: { name: "Nepali Cultural Wear" },
    available: true,
    isNew: false,
    type: "Wedding"
  },
  {
    _id: "3",
    name: "Gold Bridal Lehenga",
    category: "Wedding",
    size: "XL",
    color: "Gold",
    pricePerDay: 4500,
    description: "Stunning gold bridal lehenga with heavy embroidery, perfect for the main wedding ceremony.",
    images: ["https://images.unsplash.com/photo-1588357716680-17909c80b91d?w=600&q=80"],
    owner: { name: "Bridal Collection Nepal" },
    available: true,
    isNew: true,
    type: "Wedding"
  },

  // Festival Collection
  {
    _id: "4",
    name: "Green Pote Salwar",
    category: "Festival",
    size: "S",
    color: "Green",
    pricePerDay: 1800,
    description: "Beautiful green Pote Salwar with traditional beadwork, ideal for Teej and other festivals.",
    images: ["https://images.unsplash.com/photo-1610197519343-3b2daafb5780?w=600&q=80"],
    owner: { name: "Festive Wear Nepal" },
    available: true,
    isNew: false,
    type: "Festival"
  },
  {
    _id: "5",
    name: "Blue Dhaka Topi Set",
    category: "Festival",
    size: "M",
    color: "Blue",
    pricePerDay: 1500,
    description: "Traditional Dhaka Topi set with matching Kurta, perfect for Dashain and Tihar celebrations.",
    images: ["https://images.unsplash.com/photo-1556906781-9a412961b4f8?w=600&q=80"],
    owner: { name: "Dhaka Collection" },
    available: true,
    isNew: true,
    type: "Festival"
  },
  {
    _id: "6",
    name: "Pink Fariya",
    category: "Festival",
    size: "L",
    color: "Pink",
    pricePerDay: 1600,
    description: "Traditional pink Fariya with golden border, worn during cultural festivals and gatherings.",
    images: ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80"],
    owner: { name: "Nepali Traditions" },
    available: true,
    isNew: false,
    type: "Festival"
  },

  // Party Collection
  {
    _id: "7",
    name: "Black Saree with Blouse",
    category: "Party",
    size: "M",
    color: "Black",
    pricePerDay: 2200,
    description: "Elegant black saree with silver border and matching blouse, perfect for parties and events.",
    images: ["https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=600&q=80"],
    owner: { name: "Modern Ethnic Wear" },
    available: true,
    isNew: true,
    type: "Party"
  },
  {
    _id: "8",
    name: "Purple Anarkali",
    category: "Party",
    size: "S",
    color: "Purple",
    pricePerDay: 2400,
    description: "Royal purple Anarkali with traditional Nepali embroidery, great for cocktail parties.",
    images: ["https://images.unsplash.com/photo-1617137968427-85924d800a22?w=600&q=80"],
    owner: { name: "Ethnic Fusion" },
    available: true,
    isNew: false,
    type: "Party"
  },
  {
    _id: "9",
    name: "Navy Blue Kurta Set",
    category: "Party",
    size: "L",
    color: "Navy",
    pricePerDay: 1900,
    description: "Navy blue kurta set with subtle gold accents, perfect for evening parties and gatherings.",
    images: ["https://images.unsplash.com/photo-1617128077837-60a09f9596ae?w=600&q=80"],
    owner: { name: "Men's Traditional Wear" },
    available: true,
    isNew: false,
    type: "Party"
  },

  // More Wedding Collection
  {
    _id: "10",
    name: "White Bridal Sherwani",
    category: "Wedding",
    size: "XL",
    color: "White",
    pricePerDay: 3800,
    description: "Elegant white sherwani with gold embroidery, perfect for groom's wedding attire.",
    images: ["https://images.unsplash.com/photo-1617137968427-85924d800a22?w=600&q=80"],
    owner: { name: "Groom's Collection" },
    available: true,
    isNew: true,
    type: "Wedding"
  },
  {
    _id: "11",
    name: "Red Bridal Lehenga",
    category: "Wedding",
    size: "M",
    color: "Red",
    pricePerDay: 4200,
    description: "Traditional red bridal lehenga with heavy zari work and dupatta.",
    images: ["https://images.unsplash.com/photo-1588357716680-17909c80b91d?w=600&q=80"],
    owner: { name: "Bridal Collection" },
    available: true,
    isNew: false,
    type: "Wedding"
  },

  // More Festival Collection
  {
    _id: "12",
    name: "Yellow Dhaka Topi",
    category: "Festival",
    size: "M",
    color: "Yellow",
    pricePerDay: 1200,
    description: "Traditional yellow Dhaka Topi set for festival celebrations.",
    images: ["https://images.unsplash.com/photo-1556906781-9a412961b4f8?w=600&q=80"],
    owner: { name: "Dhaka Collection" },
    available: true,
    isNew: true,
    type: "Festival"
  }
];

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
  const [usingMockData, setUsingMockData] = useState(false);

  // Fetch dresses from backend with fallback to mock data
  useEffect(() => {
    const fetchDresses = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Build query string from filters
        const queryParams = new URLSearchParams();
        if (filters.category) queryParams.append("category", filters.category);
        if (filters.size) queryParams.append("size", filters.size);
        if (filters.color) queryParams.append("color", filters.color);

        // Using the browse endpoint from your backend
        const url = `/api/browse${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        
        console.log('Fetching from:', url); // Debug log
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Received data from backend:', data); // Debug log
        
        if (data.length === 0) {
          // No dresses found in backend
          setDresses([]);
          setUsingMockData(false);
        } else {
          // Transform backend data to match frontend structure
          const transformedDresses = data.map(dress => ({
            _id: dress._id,
            name: dress.name,
            category: dress.category,
            size: dress.size,
            color: dress.color,
            pricePerDay: dress.price, // Backend uses "price", frontend uses "pricePerDay"
            description: `${dress.category} - ${dress.color} traditional dress`,
            images: [dress.image || "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80"],
            owner: dress.owner || { name: "Heritage Rental" },
            available: dress.available !== undefined ? dress.available : true,
            isNew: false // You might want to add this field in backend
          }));
          
          setDresses(transformedDresses);
          setUsingMockData(false);
        }
        setError(null);
      } catch (err) {
        console.error('Backend connection failed:', err);
        setError("Backend connection failed. Showing sample collection.");
        
        // Fallback to mock data when backend is unavailable
        console.log('Using mock data as fallback');
        let filteredMock = [...mockDresses];
        
        // Apply filters to mock data
        if (filters.category) {
          filteredMock = filteredMock.filter(d => d.category === filters.category);
        }
        if (filters.size) {
          filteredMock = filteredMock.filter(d => d.size === filters.size);
        }
        if (filters.color) {
          filteredMock = filteredMock.filter(d => d.color.toLowerCase() === filters.color.toLowerCase());
        }
        
        setDresses(filteredMock);
        setUsingMockData(true);
      } finally {
        setLoading(false);
      }
    };

    fetchDresses();
  }, [filters.category, filters.size, filters.color]);

  // Auto-rotate videos in the hero banner
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveVideo((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({ category: "", size: "", color: "" });
  };

  const hasActiveFilters = filters.category || filters.size || filters.color;

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
      {/* Reusable Navbar */}
      <Navbar />

      {/* 🎥 MODERN VIDEO/GIF CONTAINER AT TOP */}
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
          <div className="video-badge">
            <i className="ri-camera-line"></i>
            <span>Nepali Heritage Collection</span>
          </div>
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
            <Link to="#collection" className="btn-primary btn-large">
              <span>Browse Collection</span>
              <i className="ri-arrow-right-line"></i>
            </Link>
            <Link to="/process" className="btn-outline btn-large">
              <span>How It Works</span>
              <i className="ri-information-line"></i>
            </Link>
          </div>
        </div>

        {/* Floating stats cards */}
        <div className="video-stats">
          <div className="stat-card glass-panel">
            <span className="stat-number">200+</span>
            <span className="stat-label">Nepali Dresses</span>
          </div>
          <div className="stat-card glass-panel">
            <span className="stat-number">50+</span>
            <span className="stat-label">Designers</span>
          </div>
          <div className="stat-card glass-panel">
            <span className="stat-number">1000+</span>
            <span className="stat-label">Happy Customers</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="listing-header">
        <div className="container">
          <h1 className="listing-title">Browse Our Nepali Collection</h1>
          <p className="listing-subtitle">
            Discover the perfect traditional Nepali dress for your special occasion
          </p>
          {usingMockData && (
            <div className="mock-data-badge">
              <i className="ri-information-line"></i>
              <span>Showing sample collection (Backend not connected)</span>
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
              aria-label="Grid view"
            >
              <i className="ri-grid-line"></i>
            </button>
            <button 
              className={`view-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
              aria-label="List view"
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
              <option value="Yellow">Yellow</option>
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
            <span className="results-count">{dresses.length}</span> Nepali traditional dresses found
            {hasActiveFilters && " with selected filters"}
            {usingMockData && <span className="mock-indicator"> (Sample Data)</span>}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading beautiful Nepali dresses...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && dresses.length === 0 && (
          <div className="error-state">
            <i className="ri-error-warning-line"></i>
            <p>{error}</p>
            <button className="retry-btn" onClick={() => window.location.reload()}>
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && dresses.length === 0 && (
          <div className="empty-state">
            <i className="ri-inbox-line"></i>
            <h3>No dresses found</h3>
            <p>Try adjusting your filters or check back later</p>
            {hasActiveFilters && (
              <button className="clear-filters-btn large" onClick={clearFilters}>
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Dress Grid/List */}
        {!loading && dresses.length > 0 && (
          <div className={`dress-results ${viewMode}`}>
            {dresses.map((dress) => (
              <Link to={`/dress/${dress._id}`} key={dress._id} className="dress-item-link">
                {viewMode === "grid" ? (
                  // Grid View Card
                  <div className="dress-card">
                    <div className="dress-image-wrapper">
                      <img 
                        src={dress.images[0]} 
                        alt={dress.name}
                        className="dress-image"
                      />
                      {!dress.available && (
                        <div className="dress-badge unavailable">Rented</div>
                      )}
                      {dress.isNew && (
                        <div className="dress-badge new">New</div>
                      )}
                      <button className="wishlist-btn" onClick={(e) => {
                        e.preventDefault();
                        alert('Add to wishlist functionality coming soon!');
                      }}>
                        <i className="ri-heart-line"></i>
                      </button>
                      <div className="dress-type-badge">
                        <i className="ri-map-pin-line"></i>
                        <span>Nepali</span>
                      </div>
                    </div>
                    <div className="dress-info">
                      <h3 className="dress-name">{dress.name}</h3>
                      <p className="dress-category">{dress.category}</p>
                      <div className="dress-details">
                        <span className="dress-price">₹{dress.pricePerDay}<span>/day</span></span>
                        <div className="dress-meta">
                          <span className="dress-size">{dress.size}</span>
                          <span className="dress-color" style={{ backgroundColor: dress.color.toLowerCase() }}></span>
                        </div>
                      </div>
                      {dress.owner && (
                        <p className="dress-owner">
                          <i className="ri-user-line"></i> {dress.owner.name}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  // List View Card
                  <div className="dress-list-card">
                    <div className="list-image-wrapper">
                      <img 
                        src={dress.images[0]} 
                        alt={dress.name}
                        className="list-image"
                      />
                      {!dress.available && (
                        <div className="dress-badge unavailable">Rented</div>
                      )}
                      <div className="dress-type-badge list">
                        <i className="ri-map-pin-line"></i>
                        <span>Nepali</span>
                      </div>
                    </div>
                    <div className="list-content">
                      <div className="list-header">
                        <h3 className="list-name">{dress.name}</h3>
                        <button className="list-wishlist" onClick={(e) => {
                          e.preventDefault();
                          alert('Add to wishlist functionality coming soon!');
                        }}>
                          <i className="ri-heart-line"></i>
                        </button>
                      </div>
                      <p className="list-category">{dress.category}</p>
                      <p className="list-description">
                        {dress.description}
                      </p>
                      <div className="list-details">
                        <div className="list-specs">
                          <span><i className="ri-ruler-line"></i> Size: {dress.size}</span>
                          <span><i className="ri-palette-line"></i> Color: {dress.color}</span>
                        </div>
                        <div className="list-price-section">
                          <span className="list-price">₹{dress.pricePerDay}<span>/day</span></span>
                          <button className="rent-now-btn" onClick={(e) => {
                            e.preventDefault();
                            alert('Booking functionality coming soon!');
                          }}>Rent Now</button>
                        </div>
                      </div>
                      {dress.owner && (
                        <p className="list-owner">
                          <i className="ri-user-line"></i> {dress.owner.name}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Reusable Footer */}
      <Footer />
    </div>
  );
};

export default DressListing;