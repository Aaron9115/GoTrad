import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./VirtualTryOn.css";

const VirtualTryOn = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dresses, setDresses] = useState([]);
  const [filteredDresses, setFilteredDresses] = useState([]);
  const [selectedDress, setSelectedDress] = useState(null);
  const [uploadedDressPreview, setUploadedDressPreview] = useState(null);
  const [uploadedDressImage, setUploadedDressImage] = useState(null);
  const [dressSource, setDressSource] = useState('select');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [flaskStatus, setFlaskStatus] = useState('checking');
  const [nodeStatus, setNodeStatus] = useState('checking');
  
  const [offsetY, setOffsetY] = useState(30);
  const [offsetX, setOffsetX] = useState(50);
  const [dressWidth, setDressWidth] = useState(100);
  const [showPreview, setShowPreview] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const dressFileInputRef = useRef(null);
  const personImgRef = useRef(null);
  const dressImgRef = useRef(null);
  const resultCanvasRef = useRef(null);

  // Category options
  const categories = [
    { value: "all", label: "All", icon: "ri-apps-line" },
    { value: "wedding", label: "Wedding", icon: "ri-rings-line" },
    { value: "festival", label: "Festival", icon: "ri-fire-line" },
    { value: "party", label: "Party", icon: "ri-music-line" },
    { value: "traditional", label: "Traditional", icon: "ri-temple-line" },
    { value: "modern", label: "Modern", icon: "ri-flashlight-line" }
  ];

  useEffect(() => {
    const checkBackends = async () => {
      try {
        const flaskRes = await fetch('http://localhost:5001/health', { signal: AbortSignal.timeout(2000) });
        setFlaskStatus(flaskRes.ok ? 'online' : 'offline');
      } catch {
        setFlaskStatus('offline');
      }
      try {
        const nodeRes = await fetch('http://localhost:5000/api/browse', { signal: AbortSignal.timeout(2000) });
        if (nodeRes.ok) {
          setNodeStatus('online');
          fetchDresses();
        } else {
          setNodeStatus('offline');
        }
      } catch {
        setNodeStatus('offline');
      }
    };
    checkBackends();
  }, []);

  const fetchDresses = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/browse');
      const data = await res.json();
      setDresses(data);
      setFilteredDresses(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Filter dresses by category
  const filterByCategory = (category) => {
    setSelectedCategory(category);
    if (category === 'all') {
      setFilteredDresses(dresses);
    } else {
      const filtered = dresses.filter(dress => 
        dress.category?.toLowerCase() === category.toLowerCase()
      );
      setFilteredDresses(filtered);
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setCameraActive(true);
      setCameraError(null);
    } catch (err) {
      setCameraError("Camera access denied. Please allow camera access.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video.videoWidth || !video.videoHeight) {
      setError("Camera not ready");
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const size = Math.min(canvas.width, canvas.height);
    const sx = (canvas.width - size) / 2;
    const sy = (canvas.height - size) / 2;
    const squareCanvas = document.createElement('canvas');
    squareCanvas.width = size;
    squareCanvas.height = size;
    const squareCtx = squareCanvas.getContext('2d');
    squareCtx.drawImage(canvas, sx, sy, size, size, 0, 0, size, size);
    
    const imageUrl = squareCanvas.toDataURL('image/jpeg');
    setCapturedImage(imageUrl);
    
    if (personImgRef.current) {
      personImgRef.current.src = imageUrl;
    }
    
    stopCamera();
  };

  const handleDressUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedDressPreview(reader.result);
        setUploadedDressImage(file);
        setDressSource('upload');
        setSelectedDress({ _id: 'uploaded', name: 'Your Dress', image: reader.result });
        
        if (dressImgRef.current) {
          dressImgRef.current.src = reader.result;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const selectDress = (dress) => {
    setSelectedDress(dress);
    if (dressImgRef.current) {
      dressImgRef.current.src = dress.image;
    }
  };

  const drawPreview = () => {
    if (!personImgRef.current || !dressImgRef.current) {
      setError("Please take a photo and select a dress first");
      return;
    }
    
    if (!personImgRef.current.complete || !dressImgRef.current.complete) {
      setError("Images still loading, please wait");
      return;
    }
    
    const canvas = resultCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = personImgRef.current.width;
    canvas.height = personImgRef.current.height;
    
    ctx.drawImage(personImgRef.current, 0, 0, canvas.width, canvas.height);
    
    const dressWidthPercent = dressWidth / 100;
    const dressWidthPx = canvas.width * dressWidthPercent;
    const dressHeightPx = (dressImgRef.current.height * dressWidthPx) / dressImgRef.current.width;
    
    const dressX = (canvas.width - dressWidthPx) * (offsetX / 100);
    const dressY = (canvas.height * offsetY) / 100;
    
    ctx.drawImage(dressImgRef.current, dressX, dressY, dressWidthPx, dressHeightPx);
    
    setShowPreview(true);
  };

  const applyResult = () => {
    if (resultCanvasRef.current) {
      const resultUrl = resultCanvasRef.current.toDataURL('image/jpeg');
      setCapturedImage(resultUrl);
      setStep(3);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setShowPreview(false);
    setOffsetY(30);
    setOffsetX(50);
    setDressWidth(100);
    if (personImgRef.current) {
      personImgRef.current.src = '';
    }
    startCamera();
  };

  const resetTryOn = () => {
    setStep(1);
    setSelectedDress(null);
    setUploadedDressPreview(null);
    setUploadedDressImage(null);
    setCapturedImage(null);
    setShowPreview(false);
    setDressSource('select');
    setSelectedCategory('all');
    setOffsetY(30);
    setOffsetX(50);
    setDressWidth(100);
    if (personImgRef.current) personImgRef.current.src = '';
    if (dressImgRef.current) dressImgRef.current.src = '';
  };

  const saveImage = () => {
    if (capturedImage) {
      const link = document.createElement('a');
      link.download = `virtual-tryon-${Date.now()}.jpg`;
      link.href = capturedImage;
      link.click();
    }
  };

  const formatPrice = (price) => new Intl.NumberFormat('en-IN').format(price);

  useEffect(() => {
    if (personImgRef.current && dressImgRef.current && personImgRef.current.src && dressImgRef.current.src) {
      drawPreview();
    }
  }, [offsetY, offsetX, dressWidth]);

  const selectedCategoryInfo = categories.find(c => c.value === selectedCategory) || categories[0];

  return (
    <div className="vt-page">
      <Navbar />
      
      <img ref={personImgRef} style={{ display: 'none' }} crossOrigin="anonymous" />
      <img ref={dressImgRef} style={{ display: 'none' }} crossOrigin="anonymous" />
      
      <div className="vt-container">
        <div className="vt-header">
          <h1>Virtual <span>Try-On</span></h1>
          <p>Take a photo, select a dress, and adjust position & size</p>
          <div className="status-indicators">
            <div className={`status ${flaskStatus === 'online' ? 'online' : 'offline'}`}>
              <span></span> AI Model: {flaskStatus === 'online' ? 'Connected' : 'Offline'}
            </div>
            <div className={`status ${nodeStatus === 'online' ? 'online' : 'offline'}`}>
              <span></span> Database: {nodeStatus === 'online' ? 'Connected' : 'Offline'}
            </div>
          </div>
        </div>

        <div className="vt-steps">
          <div className={`step ${step >= 1 ? "active" : ""}`}>
            <div className="step-num">1</div>
            <span>Dress</span>
          </div>
          <div className={`step-line ${step >= 2 ? "active" : ""}`}></div>
          <div className={`step ${step >= 2 ? "active" : ""}`}>
            <div className="step-num">2</div>
            <span>Photo & Position</span>
          </div>
          <div className={`step-line ${step >= 3 ? "active" : ""}`}></div>
          <div className={`step ${step >= 3 ? "active" : ""}`}>
            <div className="step-num">3</div>
            <span>Result</span>
          </div>
        </div>

        {/* Step 1: Choose Dress */}
        {step === 1 && (
          <div className="card step-card">
            <h2>Choose Your Dress</h2>
            <div className="tabs">
              <button className={dressSource === 'select' ? 'active' : ''} onClick={() => setDressSource('select')}>From Collection</button>
              <button className={dressSource === 'upload' ? 'active' : ''} onClick={() => setDressSource('upload')}>Upload Your Own</button>
            </div>
            
            {dressSource === 'select' && (
              <>
                {/* Category Filter */}
                <div className="category-filter">
                  <label>Filter by Category:</label>
                  <div className="category-buttons">
                    {categories.map(cat => (
                      <button
                        key={cat.value}
                        className={`category-chip ${selectedCategory === cat.value ? 'active' : ''}`}
                        onClick={() => filterByCategory(cat.value)}
                      >
                        <i className={cat.icon}></i>
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Results Count */}
                <p className="results-count">
                  Showing {filteredDresses.length} dress{filteredDresses.length !== 1 ? 'es' : ''}
                  {selectedCategory !== 'all' && ` in ${selectedCategoryInfo.label}`}
                </p>

                {/* Dress Grid */}
                {filteredDresses.length === 0 ? (
                  <div className="empty-dresses">
                    <i className="ri-inbox-line"></i>
                    <p>No dresses found in {selectedCategoryInfo.label} category</p>
                    <button className="btn-small" onClick={() => filterByCategory('all')}>View All</button>
                  </div>
                ) : (
                  <div className="dresses-grid">
                    {filteredDresses.slice(0, 6).map(dress => (
                      <div key={dress._id} className={`dress-item ${selectedDress?._id === dress._id ? 'selected' : ''}`} onClick={() => selectDress(dress)}>
                        <img src={dress.image} alt={dress.name} />
                        <div>
                          <h3>{dress.name}</h3>
                          <p>₹{formatPrice(dress.price)}/day</p>
                          {dress.category && (
                            <span className="dress-category-tag">
                              {dress.category}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            
            {dressSource === 'upload' && (
              <div className="upload-box" onClick={() => dressFileInputRef.current?.click()}>
                {!uploadedDressPreview ? (
                  <>
                    <i className="ri-upload-cloud-line"></i>
                    <p>Click to upload dress image</p>
                    <small>JPG, PNG up to 10MB</small>
                  </>
                ) : (
                  <img src={uploadedDressPreview} alt="Dress" />
                )}
                <input type="file" ref={dressFileInputRef} onChange={handleDressUpload} hidden accept="image/*" />
              </div>
            )}
            
            {(selectedDress || uploadedDressPreview) && (
              <button className="btn-primary" onClick={() => setStep(2)}>Continue</button>
            )}
          </div>
        )}

        {/* Step 2: Camera + Position */}
        {step === 2 && (
          <div className="card step-card">
            <h2>Take Your Photo</h2>
            <p className="instruction">Position your face near the top of the frame</p>
            
            {cameraError && (
              <div className="error-box">
                <p>{cameraError}</p>
                <button onClick={startCamera}>Allow Camera</button>
              </div>
            )}
            
            <div className="camera-box square">
              {!capturedImage ? (
                <video ref={videoRef} autoPlay playsInline className="video-preview mirror" />
              ) : (
                <img src={capturedImage} alt="Captured" className="image-preview" />
              )}
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
            
            <canvas ref={resultCanvasRef} style={{ display: 'none' }} />
            
            {!cameraActive && !capturedImage && (
              <button className="btn-primary" onClick={startCamera}>Start Camera</button>
            )}
            {cameraActive && !capturedImage && (
              <button className="btn-primary" onClick={capturePhoto}>Take Photo</button>
            )}
            
            {capturedImage && (
              <>
                <div className="controls">
                  <div className="control">
                    <label>Vertical Position</label>
                    <input type="range" min="0" max="100" value={offsetY} onChange={(e) => setOffsetY(parseInt(e.target.value))} />
                    <span className="value">{offsetY}% (0=Top, 100=Bottom)</span>
                  </div>
                  
                  <div className="control">
                    <label>Horizontal Position</label>
                    <input type="range" min="0" max="100" value={offsetX} onChange={(e) => setOffsetX(parseInt(e.target.value))} />
                    <span className="value">{offsetX}% (0=Left, 50=Center, 100=Right)</span>
                  </div>
                  
                  <div className="control">
                    <label>Dress Width</label>
                    <input type="range" min="50" max="200" value={dressWidth} onChange={(e) => setDressWidth(parseInt(e.target.value))} />
                    <span className="value">{dressWidth}% (50=Narrow, 100=Normal, 200=Wide)</span>
                  </div>
                  
                  <div className="control-buttons">
                    <button className="btn-small" onClick={drawPreview}>Preview</button>
                    <button className="btn-small" onClick={() => { setOffsetY(30); setOffsetX(50); setDressWidth(100); }}>Reset</button>
                  </div>
                </div>
                
                {showPreview && (
                  <div className="preview-box">
                    <h3>Preview</h3>
                    <canvas 
                      ref={(canvas) => {
                        if (canvas && resultCanvasRef.current) {
                          const ctx = canvas.getContext('2d');
                          canvas.width = resultCanvasRef.current.width;
                          canvas.height = resultCanvasRef.current.height;
                          ctx.drawImage(resultCanvasRef.current, 0, 0);
                        }
                      }}
                      className="preview-canvas"
                    />
                  </div>
                )}
                
                <div className="action-buttons">
                  <button className="btn-primary" onClick={applyResult} disabled={!showPreview}>
                    Apply & Continue
                  </button>
                  <button className="btn-secondary" onClick={retakePhoto}>Retake Photo</button>
                </div>
              </>
            )}
            
            <button className="btn-secondary" onClick={() => { stopCamera(); setStep(1); setCapturedImage(null); setShowPreview(false); }}>
              Back
            </button>
          </div>
        )}

        {/* Step 3: Result */}
        {step === 3 && capturedImage && (
          <div className="card step-card">
            <h2>Your Virtual Try-On</h2>
            <img src={capturedImage} alt="Result" className="result-image" />
            <div className="result-buttons">
              <button className="btn-secondary" onClick={() => { setCapturedImage(null); setShowPreview(false); setStep(2); startCamera(); }}>
                Try Again
              </button>
              <button className="btn-primary" onClick={saveImage}>Save Photo</button>
              {selectedDress && !selectedDress.isUploaded && (
                <button className="btn-primary" onClick={() => navigate(`/booking/${selectedDress._id}`)}>Book This Dress</button>
              )}
              <button className="btn-secondary" onClick={resetTryOn}>Try Another Dress</button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default VirtualTryOn;