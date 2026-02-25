import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./VirtualTryOn.css";

const VirtualTryOn = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: select dress, 2: camera, 3: result
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dresses, setDresses] = useState([]);
  const [selectedDress, setSelectedDress] = useState(null);
  const [uploadedDressImage, setUploadedDressImage] = useState(null);
  const [uploadedDressPreview, setUploadedDressPreview] = useState(null);
  const [dressSource, setDressSource] = useState('select');
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [videoElementCreated, setVideoElementCreated] = useState(false);
  const [flaskStatus, setFlaskStatus] = useState('checking');
  const [nodeStatus, setNodeStatus] = useState('checking');
  const [activeTip, setActiveTip] = useState(0);
  const [dressScale, setDressScale] = useState(1); // For resizing dress if needed
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const dressFileInputRef = useRef(null);
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
      description: "Take off glasses for clearer face detection",
      color: "#a78bfa"
    },
    {
      icon: "ri-emotion-happy-line",
      title: "Relax & Smile",
      description: "Keep a neutral expression for best results",
      color: "#f472b6"
    }
  ];

  // Check backend status
  useEffect(() => {
    const checkFlaskBackend = async () => {
      try {
        const response = await fetch('http://localhost:5001/health', {
          method: 'GET',
          signal: AbortSignal.timeout(2000)
        });
        if (response.ok) {
          const data = await response.json();
          setFlaskStatus(data.models?.virtual_tryon === 'loaded' ? 'online' : 'model_missing');
        } else {
          setFlaskStatus('offline');
        }
      } catch (err) {
        setFlaskStatus('offline');
      }
    };
    
    const checkNodeBackend = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/browse', {
          signal: AbortSignal.timeout(2000)
        });
        if (response.ok) {
          setNodeStatus('online');
          fetchDresses();
        } else {
          setNodeStatus('offline');
        }
      } catch (err) {
        setNodeStatus('offline');
      }
    };
    
    checkFlaskBackend();
    checkNodeBackend();
  }, []);

  // Auto-rotate tips
  useEffect(() => {
    if (step === 2 && cameraActive) {
      tipsIntervalRef.current = setInterval(() => {
        setActiveTip((prev) => (prev + 1) % tips.length);
      }, 4000);
    }
    return () => {
      if (tipsIntervalRef.current) {
        clearInterval(tipsIntervalRef.current);
      }
    };
  }, [step, cameraActive, tips.length]);

  // Fetch dresses from backend
  const fetchDresses = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/browse');
      if (!response.ok) throw new Error('Failed to fetch dresses');
      const data = await response.json();
      
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
      
      setDresses(transformedDresses);
    } catch (err) {
      console.error('Error fetching dresses:', err);
    }
  };

  // Cleanup camera on unmount
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
          console.log(" Video element created and ready");
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
      
      // Reset transform for dress overlay
      context.setTransform(1, 0, 0, 1, 0, 0);
      
      // Draw dress overlay FULL SCREEN (from neck down)
      const dressImg = new Image();
      dressImg.src = dressSource === 'select' ? selectedDress?.image : uploadedDressPreview;
      dressImg.onload = () => {
        // Make dress FULL SCREEN width
        const overlayWidth = canvas.width; // Full width
        const overlayHeight = canvas.height * 0.7; // 70% of canvas height (from neck down)
        const overlayX = 0; // Start from left edge
        const overlayY = canvas.height * 0.3; // Start from 30% down (neck area)
        
        // Draw with some transparency to blend
        context.globalAlpha = 0.9;
        context.drawImage(dressImg, overlayX, overlayY, overlayWidth, overlayHeight);
        context.globalAlpha = 1.0;
        
        // Convert to blob
        canvas.toBlob((blob) => {
          const imageUrl = URL.createObjectURL(blob);
          setCapturedImage(imageUrl);
          window.capturedImageBlob = blob;
          setStep(3);
        }, "image/jpeg", 0.9);
      };
      
      stopCamera();
    } else {
      setCameraError("Camera not ready. Please try again.");
    }
  };

  const handleDressUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size should be less than 10MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedDressPreview(event.target.result);
        setUploadedDressImage(file);
        setDressSource('upload');
        setSelectedDress({ 
          _id: 'uploaded',
          name: 'Your Dress',
          image: event.target.result,
          isUploaded: true
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const resetTryOn = () => {
    setStep(1);
    setSelectedDress(null);
    setUploadedDressImage(null);
    setUploadedDressPreview(null);
    setCapturedImage(null);
    setError(null);
    setDressSource('select');
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const saveImage = () => {
    if (capturedImage) {
      const link = document.createElement('a');
      link.download = `tryon-${Date.now()}.jpg`;
      link.href = capturedImage;
      link.click();
    }
  };

  const bookDress = () => {
    if (selectedDress && !selectedDress.isUploaded) {
      navigate(`/booking/${selectedDress._id}`);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN').format(price);
  };

  return (
    <div className="virtual-tryon-page">
      <Navbar />
      
      <div className="vt-container">
        {/* Header */}
        <div className="vt-header">
          <h1>Virtual <span className="gradient-text">Try-On</span></h1>
          <p>Position your face in the oval - dress will cover from neck down</p>
          
          {/* Server Status Indicators */}
          <div className="status-indicators">
            <div className={`status-badge ${flaskStatus === 'online' ? 'online' : flaskStatus === 'model_missing' ? 'warning' : 'offline'}`}>
              <span className="status-dot"></span>
              AI Model: {
                flaskStatus === 'online' ? 'Connected' : 
                flaskStatus === 'model_missing' ? 'Model Missing' : 
                'Offline'
              }
            </div>
            <div className={`status-badge ${nodeStatus === 'online' ? 'online' : 'offline'}`}>
              <span className="status-dot"></span>
              Database: {nodeStatus === 'online' ? 'Connected' : 'Offline'}
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="vt-steps">
          <div className={`step-item ${step >= 1 ? "active" : ""}`}>
            <div className="step-number">1</div>
            <span className="step-label">Choose Dress</span>
          </div>
          <div className={`step-line ${step >= 2 ? "active" : ""}`}></div>
          <div className={`step-item ${step >= 2 ? "active" : ""}`}>
            <div className="step-number">2</div>
            <span className="step-label">Position Face</span>
          </div>
          <div className={`step-line ${step >= 3 ? "active" : ""}`}></div>
          <div className={`step-item ${step >= 3 ? "active" : ""}`}>
            <div className="step-number">3</div>
            <span className="step-label">Result</span>
          </div>
        </div>

        {/* STEP 1: Select Dress */}
        {step === 1 && (
          <div className="step-content glass-panel">
            <h2>Choose Your Dress</h2>
            
            <div className="source-tabs">
              <button 
                className={`source-tab ${dressSource === 'select' ? 'active' : ''}`}
                onClick={() => setDressSource('select')}
              >
                <i className="ri-grid-line"></i>
                From Collection
              </button>
              <button 
                className={`source-tab ${dressSource === 'upload' ? 'active' : ''}`}
                onClick={() => setDressSource('upload')}
              >
                <i className="ri-upload-line"></i>
                Upload Your Own
              </button>
            </div>

            {dressSource === 'select' && (
              <>
                {nodeStatus === 'offline' && (
                  <div className="warning-message">
                    <i className="ri-error-warning-line"></i>
                    <span>Database offline. Showing sample collection.</span>
                  </div>
                )}

                <div className="dresses-grid">
                  {dresses.slice(0, 6).map((dress) => (
                    <div 
                      key={dress._id} 
                      className={`dress-card ${selectedDress?._id === dress._id ? 'selected' : ''}`}
                      onClick={() => setSelectedDress(dress)}
                    >
                      <div className="dress-image">
                        <img src={dress.image} alt={dress.name} />
                      </div>
                      <div className="dress-info">
                        <h3>{dress.name}</h3>
                        <p className="dress-category">{dress.category}</p>
                        <p className="dress-price">₹{formatPrice(dress.pricePerDay)}<span>/day</span></p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {dresses.length > 6 && (
                  <Link to="/dresses" className="view-more-link">
                    View All Dresses →
                  </Link>
                )}
              </>
            )}

            {dressSource === 'upload' && (
              <div className="upload-section">
                {!uploadedDressPreview ? (
                  <div 
                    className="upload-area"
                    onClick={() => dressFileInputRef.current?.click()}
                  >
                    <i className="ri-upload-cloud-line"></i>
                    <h3>Upload Your Dress Image</h3>
                    <p>Click to browse or drag and drop</p>
                    <p className="upload-hint">JPG, PNG up to 10MB</p>
                  </div>
                ) : (
                  <div className="uploaded-preview">
                    <img src={uploadedDressPreview} alt="Uploaded dress" />
                    <button 
                      className="change-photo-btn"
                      onClick={() => {
                        setUploadedDressPreview(null);
                        setUploadedDressImage(null);
                        setSelectedDress(null);
                      }}
                    >
                      <i className="ri-refresh-line"></i>
                      Change Dress
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  ref={dressFileInputRef}
                  onChange={handleDressUpload}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </div>
            )}

            {(selectedDress || uploadedDressPreview) && (
              <div className="selected-dress-bar">
                <div className="selected-dress-info">
                  {dressSource === 'select' && selectedDress && (
                    <>
                      <img src={selectedDress.image} alt={selectedDress.name} className="selected-thumb" />
                      <span>{selectedDress.name}</span>
                    </>
                  )}
                  {dressSource === 'upload' && uploadedDressPreview && (
                    <>
                      <img src={uploadedDressPreview} alt="Your dress" className="selected-thumb" />
                      <span>Your Dress</span>
                    </>
                  )}
                </div>
                <button 
                  className="btn-primary"
                  onClick={() => setStep(2)}
                >
                  Continue to Camera
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Camera with Full Screen Dress Preview */}
        {step === 2 && (selectedDress || uploadedDressPreview) && (
          <div className="step-content glass-panel">
            <h2>Position Your Face</h2>
            <p className="instruction-text">Center your face in the oval - dress will cover from neck down</p>

            {/* Dress Preview - Shows the dress that will be applied full screen */}
            <div className="fullscreen-dress-preview">
              <div className="preview-label">Dress to be applied:</div>
              <div className="preview-image">
                <img 
                  src={dressSource === 'select' ? selectedDress?.image : uploadedDressPreview} 
                  alt="Selected dress" 
                />
              </div>
            </div>

            {/* Camera Section */}
            <div className="camera-section">
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

              {/* Video Container with Face Guide */}
              <div className="camera-frame">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="camera-preview mirrored"
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                
                {/* Face Guide Overlay - Only for face/neck positioning */}
                {cameraActive && (
                  <div className="face-guide">
                    <div className="face-outline"></div>
                    <div className="guide-text">Keep face inside oval (neck only)</div>
                    
                    {/* Visual indicator of where dress will cover */}
                    <div className="dress-coverage-indicator">
                      <div className="coverage-line"></div>
                      <span className="coverage-text">Dress starts here ▼</span>
                    </div>
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

              {/* Tips Carousel */}
              {cameraActive && (
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
              )}
            </div>
          </div>
        )}

        {/* STEP 3: Result - Full Screen Dress */}
        {step === 3 && capturedImage && (
          <div className="step-content glass-panel">
            <h2>Your Virtual Try-On</h2>
            
            <div className="result-container">
              {/* Result Image with Full Screen Dress */}
              <div className="fullscreen-result">
                <img src={capturedImage} alt="Your try-on" className="result-image-full" />
              </div>

              {/* Dress Info */}
              <div className="dress-info-card">
                <div className="dress-info-content">
                  <img 
                    src={dressSource === 'select' ? selectedDress?.image : uploadedDressPreview} 
                    alt="Dress" 
                    className="result-dress-thumb" 
                  />
                  <div>
                    <h4>{dressSource === 'select' ? selectedDress?.name : 'Your Dress'}</h4>
                    {dressSource === 'select' && selectedDress && (
                      <>
                        <p>{selectedDress.category} • Size {selectedDress.size}</p>
                        <p className="result-price">₹{formatPrice(selectedDress.pricePerDay)}/day</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="result-actions">
                <button 
                  className="btn-outline btn-large"
                  onClick={retakePhoto}
                >
                  <i className="ri-refresh-line"></i>
                  Retake
                </button>
                
                <button 
                  className="btn-primary btn-large"
                  onClick={saveImage}
                >
                  <i className="ri-download-line"></i>
                  Save Photo
                </button>

                {dressSource === 'select' && selectedDress && !selectedDress.isUploaded && selectedDress.available && (
                  <button 
                    className="btn-primary btn-large"
                    onClick={bookDress}
                  >
                    <i className="ri-calendar-line"></i>
                    Book This Dress
                  </button>
                )}
              </div>

              <button 
                className="btn-outline"
                onClick={resetTryOn}
                style={{ marginTop: '20px' }}
              >
                Try Another Dress
              </button>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default VirtualTryOn;