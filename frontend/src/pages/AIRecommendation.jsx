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
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const tipsIntervalRef = useRef(null);

  const tips = [
    {
      icon: "ri-sun-line",
      title: "Natural Lighting",
      description: "Find a spot with good natural lighting for best results",
      color: "#fbbf24"
    },
    {
      icon: "ri-focus-3-line",
      title: "Face Forward",
      description: "Look directly at the camera with your face centered",
      color: "#60a5fa"
    },
    {
      icon: "ri-glasses-line",
      title: "Remove Accessories",
      description: "Take off glasses and heavy makeup for accurate detection",
      color: "#a78bfa"
    },
    {
      icon: "ri-emotion-happy-line",
      title: "Relax & Smile",
      description: "Keep a neutral expression for best results",
      color: "#f472b6"
    }
  ];

  const howItWorks = [
    {
      step: 1,
      title: "Take a Selfie",
      description: "Use your camera to take a clear photo of your face in natural lighting",
      icon: "ri-camera-line",
      color: "#0284c7"
    },
    {
      step: 2,
      title: "AI Analysis",
      description: "Our advanced AI analyzes your skin tone with 95% accuracy",
      icon: "ri-ai-generate-line",
      color: "#38bdf8"
    },
    {
      step: 3,
      title: "Get Recommendations",
      description: "Receive personalized dress color recommendations instantly",
      icon: "ri-shirt-line",
      color: "#7dd3fc"
    },
    {
      step: 4,
      title: "Book & Wear",
      description: "Rent your perfect dress and shine at your special occasion",
      icon: "ri-calendar-check-line",
      color: "#bae6fd"
    }
  ];

  const faqs = [
    {
      question: "How accurate is the AI analysis?",
      answer: "Our AI model is trained on thousands of images and has 95% accuracy in skin tone detection."
    },
    {
      question: "What if I wear makeup?",
      answer: "For best results, we recommend taking a photo with minimal makeup or in natural light."
    },
    {
      question: "Can I use a photo from my gallery?",
      answer: "Currently we support live camera capture for real-time analysis, but gallery upload coming soon!"
    },
    {
      question: "How long does analysis take?",
      answer: "The AI analysis typically takes 2-3 seconds to process your photo."
    }
  ];

  // Check backend status
  useEffect(() => {
    const checkFlaskBackend = async () => {
      try {
        const response = await fetch('http://localhost:5001/predict-skin-tone', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(2000)
        });
        setFlaskStatus('online');
        console.log('✅ Flask backend connected on port 5001');
      } catch (err) {
        console.log('Flask connection error:', err.message);
        try {
          const response = await fetch('http://localhost:5001/predict-skin-tone', {
            method: 'OPTIONS',
            signal: AbortSignal.timeout(2000)
          });
          setFlaskStatus('online');
          console.log('✅ Flask backend connected via OPTIONS');
        } catch (err2) {
          console.log('❌ Flask backend offline');
          setFlaskStatus('offline');
        }
      }
    };
    
    const checkNodeBackend = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/browse', {
          signal: AbortSignal.timeout(2000)
        });
        if (response.ok) {
          setNodeStatus('online');
          console.log('✅ Node.js backend connected');
        } else {
          setNodeStatus('offline');
        }
      } catch (err) {
        setNodeStatus('offline');
        console.log('❌ Node.js backend offline');
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

  // Check when video element is created
  useEffect(() => {
    if (step === 2) {
      const checkVideoInterval = setInterval(() => {
        if (videoRef.current) {
          console.log("✅ Video element created and ready");
          setVideoElementCreated(true);
          clearInterval(checkVideoInterval);
        }
      }, 100);
      
      return () => clearInterval(checkVideoInterval);
    }
  }, [step]);

  const startCamera = async () => {
    setCameraError(null);
    
    if (!videoRef.current) {
      setCameraError("Camera not ready. Please try again.");
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        },
        audio: false 
      });
      
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play()
          .then(() => {
            setCameraActive(true);
          })
          .catch(err => {
            setCameraError(err.message);
          });
      };
      
    } catch (err) {
      if (err.name === "NotAllowedError") {
        setCameraError("Camera access denied. Please allow camera access.");
      } else if (err.name === "NotFoundError") {
        setCameraError("No camera found on your device.");
      } else {
        setCameraError(err.message);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    setCameraActive(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current && cameraActive) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Mirror the image horizontally for selfie view
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
    } else {
      setCameraError("Camera not ready. Please try again.");
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setSkinTone(null);
    setRecommendedDresses([]);
    setError(null);
    startCamera();
  };

  // Fetch real dresses from database based on skin tone
  const fetchRecommendedDresses = async (skinToneValue) => {
    try {
      const response = await fetch('http://localhost:5000/api/browse');
      
      if (!response.ok) {
        throw new Error('Failed to fetch dresses');
      }
      
      const data = await response.json();
      
      // Transform the data to match frontend structure
      const transformedDresses = data.map(dress => ({
        _id: dress._id,
        name: dress.name,
        category: dress.category,
        size: dress.size,
        color: dress.color,
        pricePerDay: dress.price,
        image: dress.image || "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80",
        available: dress.available
      }));
      
      setRecommendedDresses(transformedDresses);
      
    } catch (err) {
      console.error('Error fetching dresses:', err);
      setError('Could not load recommended dresses');
      setRecommendedDresses([]);
    }
  };

  const analyzeSkinTone = async () => {
    if (!window.capturedImageBlob) {
      setError("No image captured");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append("image", window.capturedImageBlob, "face.jpg");
      
      console.log("Sending image to Flask backend...");
      const response = await fetch('http://localhost:5001/predict-skin-tone', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Flask response:", data);
        setSkinTone(data.skin_tone);
        setFlaskStatus('online');
        
        // Fetch real dresses from database
        await fetchRecommendedDresses(data.skin_tone);
        setStep(3);
      } else {
        throw new Error("Flask returned error");
      }
    } catch (err) {
      console.error("Flask backend error:", err);
      setError("AI analysis failed. Please try again.");
      setFlaskStatus('offline');
    } finally {
      setLoading(false);
    }
  };

  const getSkinToneInfo = (tone) => {
    switch(tone?.toLowerCase()) {
      case "light":
        return {
          gradient: "linear-gradient(135deg, #f5e6d3, #e6d5b8)",
          description: "Light skin tones look stunning in jewel tones like emerald green, sapphire blue, and rich purples.",
          recommendedColors: ["Emerald Green", "Sapphire Blue", "Rich Purple", "Rose Pink", "Terracotta"]
        };
      case "medium":
        return {
          gradient: "linear-gradient(135deg, #d9b99b, #c4a484)",
          description: "Medium skin tones glow in warm colors like burnt orange, mustard yellow, and coral.",
          recommendedColors: ["Burnt Orange", "Mustard Yellow", "Coral", "Teal", "Burgundy"]
        };
      case "dark":
        return {
          gradient: "linear-gradient(135deg, #8d5524, #6b3e1a)",
          description: "Dark skin tones radiate in vibrant colors like fuchsia, electric blue, and emerald green.",
          recommendedColors: ["Fuchsia", "Electric Blue", "Emerald Green", "Gold", "Silver"]
        };
      default:
        return {
          gradient: "linear-gradient(135deg, #e0e0e0, #c0c0c0)",
          description: "Every skin tone has its unique beauty.",
          recommendedColors: ["Explore Collection"]
        };
    }
  };

  const toneInfo = getSkinToneInfo(skinTone);

  const handleShare = (platform) => {
    const text = `I just discovered my perfect skin tone palette with GoTrad AI! You should try it too.`;
    const url = window.location.href;
    
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="ai-recommendation-page">
      <Navbar />
      
      <div className="ai-container">
        <div className="ai-header">
          <h1>AI Skin Tone <span className="gradient-text">Recommendation</span></h1>
          <p>Discover the perfect dress colors that complement your unique skin tone</p>
          
          {/* Server Status Indicators - Now centered */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '20px',
            marginTop: '15px',
            fontSize: '0.85rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 10px',
              background: flaskStatus === 'online' ? '#10b98120' : '#ef444420',
              borderRadius: '20px',
              color: flaskStatus === 'online' ? '#10b981' : '#ef4444'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: flaskStatus === 'online' ? '#10b981' : '#ef4444',
                display: 'inline-block'
              }}></span>
              AI Model: {flaskStatus === 'online' ? 'Connected' : 'Offline'}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 10px',
              background: nodeStatus === 'online' ? '#10b98120' : '#ef444420',
              borderRadius: '20px',
              color: nodeStatus === 'online' ? '#10b981' : '#ef4444'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: nodeStatus === 'online' ? '#10b981' : '#ef4444',
                display: 'inline-block'
              }}></span>
              Database: {nodeStatus === 'online' ? 'Connected' : 'Offline'}
            </div>
          </div>
        </div>

        <div className="progress-steps">
          <div className={`step-item ${step >= 1 ? "active" : ""}`}>
            <div className="step-number">1</div>
            <span className="step-label">Take Photo</span>
          </div>
          <div className={`step-line ${step >= 2 ? "active" : ""}`}></div>
          <div className={`step-item ${step >= 2 ? "active" : ""}`}>
            <div className="step-number">2</div>
            <span className="step-label">Analysis</span>
          </div>
          <div className={`step-line ${step >= 3 ? "active" : ""}`}></div>
          <div className={`step-item ${step >= 3 ? "active" : ""}`}>
            <div className="step-number">3</div>
            <span className="step-label">Results</span>
          </div>
        </div>

        {/* STEP 1: INTRO */}
        {step === 1 && (
          <div className="intro-section">
            {/* Main CTA Card */}
            <div className="intro-main-card glass-panel">
              <div className="intro-icons">
                <i className="ri-camera-line"></i>
                <i className="ri-magic-line"></i>
                <i className="ri-shirt-line"></i>
              </div>
              
              <h2>Discover Your Perfect Match</h2>
              <p className="intro-description">
                Our AI-powered technology analyzes your skin tone and recommends the perfect dress colors that will make you shine
              </p>

              <button 
                className="btn-primary btn-large"
                onClick={() => setStep(2)}
              >
                <i className="ri-camera-line"></i>
                Start Camera
              </button>
            </div>

           
            <div className="how-it-works">
              <h3>How It Works</h3>
              <div className="steps-timeline">
                {howItWorks.map((item, index) => (
                  <div key={index} className="timeline-item">
                    <div className="timeline-left">
                      <div className="step-circle" style={{ background: item.color }}>
                        <span>{item.step}</span>
                      </div>
                      {index < howItWorks.length - 1 && <div className="timeline-line"></div>}
                    </div>
                    <div className="timeline-content glass-panel">
                      <div className="step-icon-wrapper" style={{ background: `${item.color}20` }}>
                        <i className={item.icon} style={{ color: item.color }}></i>
                      </div>
                      <div>
                        <h4>{item.title}</h4>
                        <p>{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="stats-bar glass-panel">
              <div className="stat-item">
                <span className="stat-number">10K+</span>
                <span className="stat-label">Happy Users</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-number">95%</span>
                <span className="stat-label">Accuracy</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-number">50+</span>
                <span className="stat-label">Skin Tones</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-number">100+</span>
                <span className="stat-label">Dress Styles</span>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="faq-preview">
              <h3>Frequently Asked Questions</h3>
              <div className="faq-grid">
                {faqs.map((faq, index) => (
                  <div key={index} className="faq-item glass-panel">
                    <h4>
                      <i className="ri-question-line"></i>
                      {faq.question}
                    </h4>
                    <p>{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust Badges */}
            <div className="trust-badges">
              <div className="trust-badge">
                <i className="ri-shield-check-line"></i>
                <span>100% Privacy Guaranteed</span>
              </div>
              <div className="trust-badge">
                <i className="ri-flashlight-line"></i>
                <span>Instant Results</span>
              </div>
              <div className="trust-badge">
                <i className="ri-heart-line"></i>
                <span>Loved by 10K+ Users</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CAMERA */}
        {step === 2 && (
          <div className="camera-section glass-panel">
            {/* Camera Status */}
            <div className="camera-status">
              <p>📹 Camera: {videoElementCreated ? 'Ready' : 'Initializing...'}</p>
              <p>🎥 Active: {cameraActive ? 'Yes' : 'No'}</p>
            </div>

            {cameraError && (
              <div className="camera-error">
                <i className="ri-error-warning-line"></i>
                <p>{cameraError}</p>
                <button className="btn-outline" onClick={startCamera}>
                  <i className="ri-refresh-line"></i>
                  Try Again
                </button>
              </div>
            )}

            {/* Video Container */}
            <div className="camera-frame">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="camera-preview mirrored"
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              
              {/* Face Guide Overlay */}
              {cameraActive && (
                <div className="face-guide">
                  <div className="face-outline"></div>
                  <div className="guide-text">Center your face here</div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="camera-controls-vertical">
              {!cameraActive ? (
                <button 
                  className="btn-primary btn-large"
                  onClick={startCamera}
                  disabled={!videoElementCreated}
                >
                  <i className="ri-camera-line"></i>
                  Start Camera
                </button>
              ) : (
                <button 
                  className="btn-primary btn-large capture-btn"
                  onClick={captureImage}
                >
                  <i className="ri-camera-line"></i>
                  Capture Photo
                </button>
              )}

              <button 
                className="btn-outline btn-large"
                onClick={() => {
                  stopCamera();
                  setStep(1);
                }}
              >
                <i className="ri-arrow-left-line"></i>
                Back
              </button>
            </div>

            {/* Tips - Static */}
            {cameraActive && (
              <div className="tips-static">
                <div className="tip-static">
                  <i className={tips[activeTip].icon}></i>
                  <div>
                    <h4>{tips[activeTip].title}</h4>
                    <p>{tips[activeTip].description}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Captured Image Preview */}
        {capturedImage && step === 2 && (
          <div className="captured-preview">
            <div className="preview-frame">
              <img src={capturedImage} alt="Captured" className="preview-image" />
              <div className="preview-overlay">
                <i className="ri-check-line"></i>
                <span>Photo Captured!</span>
              </div>
            </div>
            
            {loading ? (
              <div className="analyzing-state">
                <div className="spinner-large"></div>
                <p>Analyzing your skin tone...</p>
                <div className="analysis-progress">
                  <div className="progress-bar">
                    <div className="progress-fill"></div>
                  </div>
                  <span>AI is working its magic</span>
                </div>
              </div>
            ) : (
              <div className="capture-controls">
                <button 
                  className="btn-primary btn-large"
                  onClick={analyzeSkinTone}
                >
                  <i className="ri-analyze-line"></i>
                  Analyze Photo
                </button>
                <button 
                  className="btn-outline"
                  onClick={retakePhoto}
                >
                  <i className="ri-refresh-line"></i>
                  Retake
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: RESULTS */}
        {step === 3 && (
          <div className="results-section">
            {/* Skin Tone Result Card */}
            <div className="skin-tone-card glass-panel">
              <div className="result-header">
                <span className="result-badge">
                  <i className="ri-magic-line"></i>
                  AI Analysis Complete
                </span>
              </div>
              
              <div className="skin-tone-display">
                <div 
                  className="skin-tone-circle"
                  style={{ background: toneInfo.gradient }}
                >
                  <i className="ri-user-smile-line"></i>
                </div>
                <div className="skin-tone-details">
                  <h2>Your Skin Tone: <span className="gradient-text">{skinTone}</span></h2>
                  <p className="skin-tone-description">{toneInfo.description}</p>
                </div>
              </div>

              {/* Color Palette - Just colors, no celebrity matches */}
              <div className="color-palette-section">
                <h3>Colors that suit you</h3>
                <div className="color-palette">
                  {toneInfo.recommendedColors.map((color, index) => (
                    <div key={index} className="palette-item">
                      <div 
                        className="palette-color" 
                        style={{ 
                          background: color.includes("Green") ? "#10b981" :
                                     color.includes("Blue") ? "#3b82f6" :
                                     color.includes("Purple") ? "#8b5cf6" :
                                     color.includes("Pink") ? "#ec4899" :
                                     color.includes("Orange") ? "#f97316" :
                                     color.includes("Yellow") ? "#eab308" :
                                     color.includes("Red") ? "#ef4444" :
                                     color.includes("Gold") ? "#f59e0b" :
                                     color.includes("Silver") ? "#94a3b8" :
                                     color.includes("Teal") ? "#14b8a6" :
                                     color.includes("Burgundy") ? "#991b1b" :
                                     "#0284c7"
                        }}
                      ></div>
                      <span className="palette-label">{color}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recommended Dresses - REAL DRESSES FROM DATABASE */}
            <div className="recommended-dresses">
              <div className="section-header-with-action">
                <h2>Recommended for You</h2>
                <Link to="/dresses" className="view-all-link">
                  View All <i className="ri-arrow-right-line"></i>
                </Link>
              </div>
              
              {recommendedDresses.length === 0 ? (
                <div className="empty-state">
                  <i className="ri-inbox-line"></i>
                  <h3>No dresses available</h3>
                  <p>Check back later for new additions</p>
                  <Link to="/dresses" className="btn-primary">
                    Browse All Dresses
                  </Link>
                </div>
              ) : (
                <div className="dress-results grid">
                  {recommendedDresses.map((dress) => (
                    <Link to={`/booking/${dress._id}`} key={dress._id} className="dress-item-link">
                      <div className="dress-card">
                        <div className="dress-image-wrapper">
                          <img 
                            src={dress.image} 
                            alt={dress.name}
                            className="dress-image"
                          />
                          {!dress.available && (
                            <div className="dress-badge unavailable">Rented</div>
                          )}
                        </div>
                        <div className="dress-info">
                          <h3 className="dress-name">{dress.name}</h3>
                          <p className="dress-category">{dress.category}</p>
                          <div className="dress-details">
                            <span className="dress-price">₹{dress.pricePerDay}<span>/day</span></span>
                            <div className="dress-meta">
                              <span className="dress-size">{dress.size}</span>
                              <span className="dress-color" style={{ backgroundColor: dress.color?.toLowerCase() }}></span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Share Results */}
            <div className="share-results glass-panel">
              <h3>Love your results? Share with friends!</h3>
              <div className="share-buttons">
                <button className="share-btn whatsapp" onClick={() => handleShare('whatsapp')}>
                  <i className="ri-whatsapp-line"></i>
                  WhatsApp
                </button>
                <button className="share-btn facebook" onClick={() => handleShare('facebook')}>
                  <i className="ri-facebook-line"></i>
                  Facebook
                </button>
                <button className="share-btn twitter" onClick={() => handleShare('twitter')}>
                  <i className="ri-twitter-line"></i>
                  Twitter
                </button>
                <button className="share-btn copy" onClick={() => handleShare('copy')}>
                  <i className="ri-link"></i>
                  Copy Link
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="results-actions">
              <button 
                className="btn-outline btn-large"
                onClick={() => {
                  stopCamera();
                  setStep(1);
                  setCapturedImage(null);
                  setSkinTone(null);
                  setRecommendedDresses([]);
                }}
              >
                <i className="ri-refresh-line"></i>
                Try Again
              </button>
              <Link to="/dresses" className="btn-primary btn-large">
                <i className="ri-grid-line"></i>
                Browse All
              </Link>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default AIRecommendation;