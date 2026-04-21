import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./AIRecommendation.css";

const AIRecommendation = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [skinTone, setSkinTone] = useState(null);
  const [recommendedDresses, setRecommendedDresses] = useState([]);
  const [capturedImage, setCapturedImage] = useState(null);
  const [activeTip, setActiveTip] = useState(0);
  const [cameraError, setCameraError] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [videoElementCreated, setVideoElementCreated] = useState(false);
  const [flaskStatus, setFlaskStatus] = useState('checking');
  const [nodeStatus, setNodeStatus] = useState('checking');
  const [selectedCategory, setSelectedCategory] = useState("");
  const [allDresses, setAllDresses] = useState([]);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const categories = [
    { value: "wedding", label: "Wedding", icon: "ri-rings-line" },
    { value: "festival", label: "Festival", icon: "ri-fire-line" },
    { value: "party", label: "Party", icon: "ri-music-line" },
    { value: "traditional", label: "Traditional", icon: "ri-temple-line" },
    { value: "modern", label: "Modern", icon: "ri-flashlight-line" }
  ];

  const tips = [
    { icon: "ri-sun-line", title: "Natural Lighting", description: "Find a spot with good natural lighting" },
    { icon: "ri-focus-3-line", title: "Face Forward", description: "Look directly at the camera" },
    { icon: "ri-glasses-line", title: "Remove Accessories", description: "Take off glasses for accurate detection" },
    { icon: "ri-emotion-happy-line", title: "Relax", description: "Keep a neutral expression" }
  ];

  useEffect(() => {
    const checkFlaskBackend = async () => {
      try {
        await fetch('http://localhost:5001/predict-skin-tone', { method: 'GET', signal: AbortSignal.timeout(2000) });
        setFlaskStatus('online');
      } catch (err) {
        setFlaskStatus('offline');
      }
    };
    
    const checkNodeBackend = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/browse', { signal: AbortSignal.timeout(2000) });
        setNodeStatus(response.ok ? 'online' : 'offline');
      } catch (err) {
        setNodeStatus('offline');
      }
    };
    
    checkFlaskBackend();
    checkNodeBackend();
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (step === 2) {
      const checkVideoInterval = setInterval(() => {
        if (videoRef.current) {
          setVideoElementCreated(true);
          clearInterval(checkVideoInterval);
        }
      }, 100);
      return () => clearInterval(checkVideoInterval);
    }
  }, [step]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" }, 
        audio: false 
      });
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play().then(() => setCameraActive(true)).catch(err => setCameraError(err.message));
      };
    } catch (err) {
      if (err.name === "NotAllowedError") setCameraError("Camera access denied");
      else if (err.name === "NotFoundError") setCameraError("No camera found");
      else setCameraError(err.message);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current && cameraActive) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      context.setTransform(1, 0, 0, 1, 0, 0);
      
      canvas.toBlob((blob) => {
        const imageUrl = URL.createObjectURL(blob);
        setCapturedImage(imageUrl);
        window.capturedImageBlob = blob;
      }, "image/jpeg", 0.9);
      
      stopCamera();
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setSkinTone(null);
    setRecommendedDresses([]);
    setError(null);
    startCamera();
  };

  const getSkinToneInfo = (tone) => {
    const colorMap = {
      "light": ["Red", "Maroon", "Pink", "Purple", "Blue", "Green", "Gold"],
      "medium": ["Red", "Maroon", "Orange", "Yellow", "Green", "Blue", "Gold"],
      "dark": ["Red", "Maroon", "Purple", "Blue", "Green", "Gold", "Silver"]
    };
    const descriptions = {
      "light": "Light skin tones look stunning in rich reds, maroons, pinks, and jewel tones.",
      "medium": "Medium skin tones glow in warm colors like red, maroon, orange, and yellow.",
      "dark": "Dark skin tones radiate in vibrant colors like red, maroon, purple, and blue."
    };
    const toneLower = tone?.toLowerCase();
    if (toneLower && colorMap[toneLower]) {
      return {
        description: descriptions[toneLower],
        recommendedColors: colorMap[toneLower]
      };
    }
    return {
      description: "Every skin tone has its unique beauty.",
      recommendedColors: ["Red", "Blue", "Green", "Gold"]
    };
  };

  const toneInfo = getSkinToneInfo(skinTone);

  const handleShare = (platform) => {
    const url = window.location.href;
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent('Check out GoTrad AI! ' + url)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent('Check out GoTrad AI!')}&url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      alert('Link copied!');
    }
  };

  const filterDressesByCategory = (dresses, category) => {
    if (!category) return dresses;
    return dresses.filter(dress => dress.category?.toLowerCase() === category.toLowerCase());
  };

  const analyzeSkinTone = async () => {
    if (!window.capturedImageBlob) {
      setError("No image captured");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", window.capturedImageBlob, "face.jpg");
      const token = localStorage.getItem("token");
      const response = await fetch('http://localhost:5000/api/recommend', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setSkinTone(data.skinTone);
        const transformedDresses = data.dresses.map(dress => ({
          _id: dress._id,
          name: dress.name,
          category: dress.category,
          size: dress.size,
          color: dress.color,
          pricePerDay: dress.price,
          available: dress.available,
          image: dress.image || "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80"
        }));
        setAllDresses(transformedDresses);
        setRecommendedDresses(selectedCategory ? filterDressesByCategory(transformedDresses, selectedCategory) : transformedDresses);
        setStep(3);
      } else {
        throw new Error(data.message || "Recommendation failed");
      }
    } catch (err) {
      setError("AI analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const applyCategoryFilter = (category) => {
    setSelectedCategory(category);
    const filtered = filterDressesByCategory(allDresses, category);
    setRecommendedDresses(filtered);
    if (filtered.length === 0) {
      setError(`No ${category} dresses found`);
      setTimeout(() => setError(null), 3000);
    }
  };

  const clearCategoryFilter = () => {
    setSelectedCategory("");
    setRecommendedDresses(allDresses);
  };

  const selectedCategoryInfo = categories.find(c => c.value === selectedCategory) || { label: "", icon: "ri-shirt-line" };

  if (loading) {
    return (
      <div className="ai-page">
        <Navbar />
        <div className="loading"><div className="spinner"></div><p>Loading...</p></div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="ai-page">
      <Navbar />
      <div className="container">
        <div className="header">
          <h1>AI Skin Tone <span>Recommendation</span></h1>
          <p>Find colors that complement your skin tone</p>
          <div className="status">
            <div className={`badge ${flaskStatus}`}>
              <span></span> AI Model: {flaskStatus === 'online' ? 'Online' : 'Offline'}
            </div>
            <div className={`badge ${nodeStatus}`}>
              <span></span> Database: {nodeStatus === 'online' ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>

        <div className="steps">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>
            <div className="num">1</div>
            <span>Category</span>
          </div>
          <div className={`line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <div className="num">2</div>
            <span>Photo</span>
          </div>
          <div className={`line ${step >= 3 ? 'active' : ''}`}></div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>
            <div className="num">3</div>
            <span>Results</span>
          </div>
        </div>

        {error && (
          <div className="error">
            <i className="ri-error-warning-line"></i>
            <p>{error}</p>
          </div>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <div>
            <div className="card select-card">
              <h2>Select a Category</h2>
              <p>Choose the type of outfit you're looking for</p>
              <div className="category-grid">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    className={`category ${selectedCategory === cat.value ? 'selected' : ''}`}
                    onClick={() => setSelectedCategory(cat.value)}
                  >
                    <i className={cat.icon}></i>
                    <div>
                      <strong>{cat.label}</strong>
                      <span>Occasion wear</span>
                    </div>
                    {selectedCategory === cat.value && <i className="ri-check-line"></i>}
                  </button>
                ))}
              </div>
              <div className="actions">
                <button className="btn-primary" onClick={() => { if (selectedCategory) setStep(2); else setError("Select a category"); setTimeout(() => setError(null), 2000); }}>
                  Continue <i className="ri-arrow-right-line"></i>
                </button>
                <button className="btn-secondary" onClick={() => setSelectedCategory("")}>Clear</button>
              </div>
            </div>

            <div className="how-it-works">
              <h3>How It Works</h3>
              <div className="timeline">
                {[
                  { step: 1, title: "Choose Category", desc: "Select your preferred dress category", icon: "ri-filter-line" },
                  { step: 2, title: "Take a Selfie", desc: "Take a clear photo of your face", icon: "ri-camera-line" },
                  { step: 3, title: "AI Analysis", desc: "Our AI analyzes your skin tone", icon: "ri-ai-generate-line" },
                  { step: 4, title: "Get Results", desc: "Receive personalized recommendations", icon: "ri-shirt-line" }
                ].map((item, i) => (
                  <div key={i} className="timeline-item">
                    <div className="timeline-left">
                      <div className="timeline-num">{item.step}</div>
                      {i < 3 && <div className="timeline-line"></div>}
                    </div>
                    <div className="timeline-right">
                      <i className={item.icon}></i>
                      <div>
                        <h4>{item.title}</h4>
                        <p>{item.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="stats">
              <div><span>10K+</span><label>Users</label></div>
              <div><span>95%</span><label>Accuracy</label></div>
              <div><span>50+</span><label>Skin Tones</label></div>
              <div><span>100+</span><label>Styles</label></div>
            </div>

            <div className="faq">
              <h3>FAQs</h3>
              <div className="faq-grid">
                {[
                  { q: "How accurate is the AI analysis?", a: "Our AI model has 95% accuracy." },
                  { q: "What if I wear makeup?", a: "For best results, take a photo with minimal makeup." },
                  { q: "Can I filter by multiple categories?", a: "You can select one category at a time." },
                  { q: "How long does analysis take?", a: "Typically 2-3 seconds." }
                ].map((faq, i) => (
                  <div key={i} className="faq-item">
                    <h4><i className="ri-question-line"></i> {faq.q}</h4>
                    <p>{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2 - Camera */}
        {step === 2 && (
          <div>
            <div className="card camera-card">
              {selectedCategory && (
                <div className="category-tag">
                  <i className={selectedCategoryInfo.icon}></i>
                  <span>{selectedCategoryInfo.label}</span>
                  <button onClick={() => setSelectedCategory("")}>✕</button>
                </div>
              )}
              {cameraError && (
                <div className="camera-error">
                  <i className="ri-error-warning-line"></i>
                  <p>{cameraError}</p>
                  <button onClick={startCamera}>Try Again</button>
                </div>
              )}
              <div className="camera-frame">
                <video ref={videoRef} autoPlay playsInline className="mirror" />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </div>
              <div className="camera-controls">
                {!cameraActive ? (
                  <button className="btn-primary" onClick={startCamera}>Start Camera</button>
                ) : (
                  <button className="btn-primary" onClick={captureImage}>Capture</button>
                )}
                <button className="btn-secondary" onClick={() => { stopCamera(); setStep(1); }}>Back</button>
              </div>
              {cameraActive && (
                <div className="tip">
                  <i className={tips[activeTip].icon}></i>
                  <div><strong>{tips[activeTip].title}</strong><p>{tips[activeTip].description}</p></div>
                </div>
              )}
            </div>

            {capturedImage && (
              <div className="captured">
                <div className="preview">
                  <img src={capturedImage} alt="Preview" />
                  <div className="overlay"><i className="ri-check-line"></i><span>Captured!</span></div>
                </div>
                <div className="capture-actions">
                  <button className="btn-primary" onClick={analyzeSkinTone}>Analyze</button>
                  <button className="btn-secondary" onClick={retakePhoto}>Retake</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div>
            <div className="card result-card">
              <div className="result-badge"> Analysis Complete</div>
              <div className="skin-tone">
                <div className="tone-circle"><i className="ri-user-smile-line"></i></div>
                <div>
                  <h2>Your Skin Tone: <span>{skinTone}</span></h2>
                  <p>{toneInfo.description}</p>
                  {selectedCategory && (
                    <div className="filter-tag">
                      <i className={selectedCategoryInfo.icon}></i>
                      <span>{selectedCategoryInfo.label}</span>
                      <button onClick={clearCategoryFilter}>✕</button>
                    </div>
                  )}
                </div>
              </div>
              <div className="colors">
                <h3>Colors that suit you</h3>
                <div className="color-list">
                  {toneInfo.recommendedColors.map((c, i) => {
                    let bg = "#0891b2";
                    if (c === "Red") bg = "#ef4444";
                    else if (c === "Maroon") bg = "#991b1b";
                    else if (c === "Pink") bg = "#ec4899";
                    else if (c === "Purple") bg = "#8b5cf6";
                    else if (c === "Blue") bg = "#3b82f6";
                    else if (c === "Green") bg = "#10b981";
                    else if (c === "Orange") bg = "#f97316";
                    else if (c === "Yellow") bg = "#eab308";
                    else if (c === "Gold") bg = "#f59e0b";
                    else if (c === "Silver") bg = "#94a3b8";
                    return (
                      <div key={i}>
                        <div className="color-dot" style={{ background: bg }}></div>
                        <span>{c}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="card filter-card">
              <h3>Filter by Category</h3>
              <div className="filter-buttons">
                {categories.map(cat => (
                  <button key={cat.value} className={`filter ${selectedCategory === cat.value ? 'active' : ''}`} onClick={() => applyCategoryFilter(cat.value)}>
                    <i className={cat.icon}></i> {cat.label}
                  </button>
                ))}
                {selectedCategory && <button className="filter clear" onClick={clearCategoryFilter}>Clear</button>}
              </div>
              {recommendedDresses.length > 0 && <p className="count">Found {recommendedDresses.length} dresses</p>}
            </div>

            <div className="dresses">
              <div className="dresses-header">
                <h2>{selectedCategory ? `${selectedCategoryInfo.label} Recommendations` : "Recommended for You"}</h2>
                <Link to="/dresses" className="view-all">View All <i className="ri-arrow-right-line"></i></Link>
              </div>
              {recommendedDresses.length === 0 ? (
                <div className="empty">
                  <i className="ri-inbox-line"></i>
                  <h3>No dresses found</h3>
                  <p>{selectedCategory ? `No ${selectedCategoryInfo.label} dresses available` : "No dresses available"}</p>
                  <div className="empty-actions">
                    {selectedCategory && <button className="btn-secondary" onClick={clearCategoryFilter}>Clear Filter</button>}
                    <Link to="/dresses" className="btn-primary">Browse All</Link>
                  </div>
                </div>
              ) : (
                <div className="dress-grid">
                  {recommendedDresses.map(dress => (
                    <Link to={`/booking/${dress._id}`} key={dress._id} className="dress-link">
                      <div className="dress-card">
                        <div className="dress-image">
                          <img src={dress.image} alt={dress.name} />
                          {dress.category && <div className="dress-cat-badge"><i className={categories.find(c => c.value === dress.category?.toLowerCase())?.icon || "ri-shirt-line"}></i><span>{dress.category}</span></div>}
                          {!dress.available && <div className="dress-unavailable">Rented</div>}
                        </div>
                        <div className="dress-info">
                          <h3>{dress.name}</h3>
                          <p>{dress.category}</p>
                          <div className="dress-price">NPR {dress.pricePerDay}<span>/day</span></div>
                          <div className="dress-meta">
                            <span className="dress-size">{dress.size}</span>
                            <span className="dress-color" style={{ backgroundColor: dress.color?.toLowerCase() }}></span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="results-actions">
              <button className="btn-secondary" onClick={() => { stopCamera(); setStep(1); setCapturedImage(null); setSkinTone(null); setRecommendedDresses([]); setAllDresses([]); setSelectedCategory(""); }}>Start Over</button>
              <button className="btn-secondary" onClick={() => setStep(2)}>Take Another Photo</button>
              <Link to="/dresses" className="btn-primary">Browse All</Link>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AIRecommendation;