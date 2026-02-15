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
  const [cameraInitialized, setCameraInitialized] = useState(false);
  
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

  const testimonials = [
    {
      name: "Priya S.",
      role: "Bride's Sister",
      text: "The AI recommendation was spot on! Found the perfect lehenga for my sister's wedding.",
      rating: 5,
      avatar: "P"
    },
    {
      name: "Rahul K.",
      role: "Groom",
      text: "Never knew what colors suited me best until I tried this. Game changer!",
      rating: 5,
      avatar: "R"
    },
    {
      name: "Anjali M.",
      role: "Festival Goer",
      text: "Amazing experience! The color suggestions were perfect for Teej celebrations.",
      rating: 5,
      avatar: "A"
    }
  ];

  useEffect(() => {
    if (step === 2) {
      tipsIntervalRef.current = setInterval(() => {
        setActiveTip((prev) => (prev + 1) % tips.length);
      }, 4000);
    }
    return () => {
      if (tipsIntervalRef.current) {
        clearInterval(tipsIntervalRef.current);
      }
    };
  }, [step, tips.length]);

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
      // Give time for DOM to render
      setTimeout(() => {
        setCameraInitialized(!!videoRef.current);
        console.log("Video element exists:", !!videoRef.current);
      }, 500);
    }
  }, [step]);

  const startCamera = async () => {
    setCameraError(null);
    
    // Check if video element exists
    if (!videoRef.current) {
      setCameraError("Camera not ready. Please try again.");
      return;
    }
    
    try {
      console.log("Starting camera...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        },
        audio: false 
      });
      
      console.log("Camera access granted");
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      
      // Wait for video to be ready
      videoRef.current.onloadedmetadata = () => {
        console.log("Video metadata loaded");
        videoRef.current.play()
          .then(() => {
            console.log("Video playing");
            setCameraActive(true);
          })
          .catch(err => {
            console.error("Play error:", err);
            setCameraError(err.message);
          });
      };
      
    } catch (err) {
      console.error("Camera error:", err);
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
      streamRef.current.getTracks().forEach(track => track.stop());
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
  };

  const analyzeSkinTone = async () => {
    if (!window.capturedImageBlob) {
      setError("No image captured");
      return;
    }

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const tones = ["Light", "Medium", "Dark"];
      const randomTone = tones[Math.floor(Math.random() * tones.length)];
      setSkinTone(randomTone);
      
      setRecommendedDresses([
        {
          _id: "1",
          name: "Royal Silk Lehenga",
          category: "Wedding",
          size: "M",
          color: "Red",
          pricePerDay: 2500,
          image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80"
        },
        {
          _id: "2",
          name: "Festive Saree",
          category: "Festival",
          size: "L",
          color: "Green",
          pricePerDay: 1800,
          image: "https://images.unsplash.com/photo-1588357716680-17909c80b91d?w=600&q=80"
        },
        {
          _id: "3",
          name: "Contemporary Gown",
          category: "Party",
          size: "S",
          color: "Blue",
          pricePerDay: 2200,
          image: "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=600&q=80"
        }
      ]);
      
      setStep(3);
      setLoading(false);
    }, 2000);
  };

  const getSkinToneInfo = (tone) => {
    switch(tone?.toLowerCase()) {
      case "light":
        return {
          gradient: "linear-gradient(135deg, #f5e6d3, #e6d5b8)",
          description: "Light skin tones look stunning in jewel tones like emerald green, sapphire blue, and rich purples.",
          recommendedColors: ["Emerald Green", "Sapphire Blue", "Rich Purple", "Rose Pink", "Terracotta"],
          celebrities: ["Deepika Padukone", "Alia Bhatt", "Kareena Kapoor"]
        };
      case "medium":
        return {
          gradient: "linear-gradient(135deg, #d9b99b, #c4a484)",
          description: "Medium skin tones glow in warm colors like burnt orange, mustard yellow, and coral.",
          recommendedColors: ["Burnt Orange", "Mustard Yellow", "Coral", "Teal", "Burgundy"],
          celebrities: ["Priyanka Chopra", "Katrina Kaif", "Anushka Sharma"]
        };
      case "dark":
        return {
          gradient: "linear-gradient(135deg, #8d5524, #6b3e1a)",
          description: "Dark skin tones radiate in vibrant colors like fuchsia, electric blue, and emerald green.",
          recommendedColors: ["Fuchsia", "Electric Blue", "Emerald Green", "Gold", "Silver"],
          celebrities: ["Nayanthara", "Tamannaah", "Kajol"]
        };
      default:
        return {
          gradient: "linear-gradient(135deg, #e0e0e0, #c0c0c0)",
          description: "Every skin tone has its unique beauty.",
          recommendedColors: ["Explore Collection"],
          celebrities: ["You're unique!"]
        };
    }
  };

  const toneInfo = getSkinToneInfo(skinTone);

  // Function to handle going to camera page
  const goToCameraPage = () => {
    setStep(2);
    // Don't start camera automatically - user must click Start Camera button
  };

  return (
    <div className="ai-recommendation-page">
      <Navbar />
      
      <div className="ai-container">
        {/* Header */}
        <div className="ai-header">
          <h1>AI Skin Tone <span className="gradient-text">Recommendation</span></h1>
          <p>Discover the perfect dress colors that complement your unique skin tone</p>
        </div>

        {/* Progress Steps */}
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
              <div className="intro-animation">
                <div className="floating-icons">
                  <i className="ri-camera-line"></i>
                  <i className="ri-magic-line"></i>
                  <i className="ri-shirt-line"></i>
                </div>
              </div>
              
              <h2>Discover Your Perfect Match</h2>
              <p className="intro-description">
                Our AI-powered technology analyzes your skin tone and recommends the perfect dress colors that will make you shine
              </p>

              <button 
                className="btn-primary btn-large pulse-animation"
                onClick={goToCameraPage}
              >
                <i className="ri-camera-line"></i>
                Start Camera
              </button>
            </div>

            {/* How It Works Cards */}
            <div className="how-it-works">
              <h3>How It Works</h3>
              <div className="feature-cards">
                <div className="feature-card glass-panel">
                  <div className="feature-icon" style={{ background: "linear-gradient(135deg, #0284c7, #38bdf8)" }}>
                    <i className="ri-camera-line"></i>
                  </div>
                  <h4>1. Take a Selfie</h4>
                  <p>Use your camera to take a clear photo of your face in natural lighting</p>
                </div>
                <div className="feature-card glass-panel">
                  <div className="feature-icon" style={{ background: "linear-gradient(135deg, #38bdf8, #7dd3fc)" }}>
                    <i className="ri-ai-generate-line"></i>
                  </div>
                  <h4>2. AI Analysis</h4>
                  <p>Our advanced AI analyzes your skin tone with 95% accuracy</p>
                </div>
                <div className="feature-card glass-panel">
                  <div className="feature-icon" style={{ background: "linear-gradient(135deg, #7dd3fc, #bae6fd)" }}>
                    <i className="ri-shirt-line"></i>
                  </div>
                  <h4>3. Get Recommendations</h4>
                  <p>Receive personalized dress color recommendations instantly</p>
                </div>
              </div>
            </div>

            {/* Testimonials */}
            <div className="testimonials-section">
              <h3>What Our Users Say</h3>
              <div className="testimonials-grid">
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="testimonial-card glass-panel">
                    <div className="testimonial-stars">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <i key={i} className="ri-star-fill"></i>
                      ))}
                    </div>
                    <p>"{testimonial.text}"</p>
                    <div className="testimonial-user">
                      <div className="user-avatar">{testimonial.avatar}</div>
                      <div>
                        <strong>{testimonial.name}</strong>
                        <span>{testimonial.role}</span>
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
            </div>
          </div>
        )}

        {/* STEP 2: CAMERA */}
        {step === 2 && (
          <div className="camera-section glass-panel">
            {cameraError && (
              <div className="camera-error">
                <i className="ri-error-warning-line"></i>
                <p>{cameraError}</p>
                <button className="btn-outline" onClick={startCamera}>
                  <i className="ri-refresh-line"></i>
                  Try Again
                </button>
                <button 
                  className="btn-outline" 
                  onClick={() => setStep(1)}
                  style={{ marginLeft: '10px' }}
                >
                  Back
                </button>
              </div>
            )}

            {!cameraError && !capturedImage && (
              <>
                {!cameraActive ? (
                  <div className="camera-placeholder">
                    <i className="ri-camera-line"></i>
                    <h3>Ready to take a photo?</h3>
                    <p>Click the button below to start your camera</p>
                    <button className="btn-primary" onClick={startCamera}>
                      <i className="ri-camera-line"></i>
                      Start Camera
                    </button>
                    <button 
                      className="btn-outline" 
                      onClick={() => setStep(1)}
                      style={{ marginTop: '10px' }}
                    >
                      Back
                    </button>
                  </div>
                ) : (
                  <div className="camera-active">
                    <div className="camera-frame">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="camera-preview mirrored"
                      />
                      <canvas ref={canvasRef} style={{ display: "none" }} />
                      
                      {/* Face Guide Overlay */}
                      <div className="face-guide">
                        <div className="face-outline"></div>
                        <div className="guide-text">Center your face here</div>
                      </div>
                    </div>

                    <div className="camera-controls">
                      <button 
                        className="btn-primary btn-large capture-btn"
                        onClick={captureImage}
                      >
                        <i className="ri-camera-line"></i>
                        Capture Photo
                      </button>
                      
                      <button 
                        className="btn-outline"
                        onClick={() => {
                          stopCamera();
                          setStep(1);
                        }}
                      >
                        <i className="ri-arrow-left-line"></i>
                        Back
                      </button>
                    </div>

                    {/* Tips Carousel */}
                    <div className="tips-carousel">
                      <div 
                        className="tip-card" 
                        style={{ 
                          background: `linear-gradient(135deg, ${tips[activeTip].color}20, ${tips[activeTip].color}40)`,
                          borderColor: tips[activeTip].color
                        }}
                      >
                        <i className={tips[activeTip].icon} style={{ color: tips[activeTip].color }}></i>
                        <div className="tip-content">
                          <h4>{tips[activeTip].title}</h4>
                          <p>{tips[activeTip].description}</p>
                        </div>
                      </div>
                      <div className="tip-dots">
                        {tips.map((_, index) => (
                          <button
                            key={index}
                            className={`tip-dot ${activeTip === index ? "active" : ""}`}
                            onClick={() => setActiveTip(index)}
                            style={{ backgroundColor: tips[index].color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {capturedImage && (
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
                  
                  {/* Celebrity Match */}
                  <div className="celebrity-match">
                    <h4><i className="ri-star-line"></i> You have similar tone as:</h4>
                    <div className="celebrity-list">
                      {toneInfo.celebrities.map((celeb, index) => (
                        <span key={index} className="celebrity-tag">
                          <i className="ri-user-star-line"></i>
                          {celeb}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Color Palette */}
              <div className="color-palette-section">
                <h3>Your Perfect Color Palette</h3>
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

            {/* Recommended Dresses */}
            <div className="recommended-dresses">
              <div className="section-header-with-action">
                <h2>Recommended for You</h2>
                <Link to="/dresses" className="view-all-link">
                  View All <i className="ri-arrow-right-line"></i>
                </Link>
              </div>
              
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
                        <div className="dress-type-badge">
                          <i className="ri-magic-line"></i>
                          <span>Perfect Match</span>
                        </div>
                        <div className="match-percentage">
                          98% Match
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
                      </div>
                    </div>
                  </Link>
                ))}
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