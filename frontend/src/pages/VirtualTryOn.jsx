import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./VirtualTryOn.css";

const VirtualTryOn = () => {
  const navigate = useNavigate();

  // Step Management
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Dress States
  const [dresses, setDresses] = useState([]);
  const [filteredDresses, setFilteredDresses] = useState([]);
  const [selectedDress, setSelectedDress] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Person Upload (file upload only)
  const [uploadedPersonPreview, setUploadedPersonPreview] = useState(null);
  const [uploadedPersonFile, setUploadedPersonFile] = useState(null);
  const [personUploadError, setPersonUploadError] = useState(null);
  const [isDetectingFace, setIsDetectingFace] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);

  // Alignment – moved higher (offsetY smaller) and wider
  const [offsetY, setOffsetY] = useState(18);     // moved up significantly for neck alignment
  const [offsetX, setOffsetX] = useState(50);     // centered
  const [dressWidth, setDressWidth] = useState(125); // wider to cover shoulders
  const [showPreview, setShowPreview] = useState(false);
  
  // Single source of truth for final result
  const [finalResultImage, setFinalResultImage] = useState(null);

  // Backend status
  const [flaskStatus, setFlaskStatus] = useState("checking");
  const [nodeStatus, setNodeStatus] = useState("checking");

  // Refs
  const personImgRef = useRef(null);
  const dressImgRef = useRef(null);
  const resultCanvasRef = useRef(null);
  const personFileInputRef = useRef(null);

  const categories = [
    { value: "all", label: "All", icon: "ri-apps-line" },
    { value: "wedding", label: "Wedding", icon: "ri-rings-line" },
    { value: "festival", label: "Festival", icon: "ri-fire-line" },
    { value: "party", label: "Party", icon: "ri-music-line" },
    { value: "traditional", label: "Traditional", icon: "ri-temple-line" },
    { value: "modern", label: "Modern", icon: "ri-flashlight-line" },
  ];

  // Fetch dresses from backend
  useEffect(() => {
    const checkBackends = async () => {
      try {
        const flaskRes = await fetch("http://localhost:5001/health", { signal: AbortSignal.timeout(2000) });
        setFlaskStatus(flaskRes.ok ? "online" : "offline");
      } catch {
        setFlaskStatus("offline");
      }
      try {
        const nodeRes = await fetch("http://localhost:5000/api/browse", { signal: AbortSignal.timeout(2000) });
        if (nodeRes.ok) {
          setNodeStatus("online");
          const data = await nodeRes.json();
          setDresses(data);
          setFilteredDresses(data);
        } else {
          setNodeStatus("offline");
        }
      } catch {
        setNodeStatus("offline");
      }
    };
    checkBackends();
  }, []);

  const filterByCategory = (category) => {
    setSelectedCategory(category);
    if (category === "all") setFilteredDresses(dresses);
    else setFilteredDresses(dresses.filter(d => d.category?.toLowerCase() === category.toLowerCase()));
  };

  const selectDress = (dress) => {
    setSelectedDress(dress);
    if (dressImgRef.current) dressImgRef.current.src = dress.image;
    setUploadedPersonPreview(null);
    setUploadedPersonFile(null);
    setShowPreview(false);
    setFinalResultImage(null);
    setError(null);
  };

  // Handle person photo upload
  const handlePersonPhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(file.type)) {
      setPersonUploadError("Please upload JPG, JPEG, or PNG");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setPersonUploadError("File size must be less than 10MB");
      return;
    }
    setPersonUploadError(null);
    setUploadedPersonFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedPersonPreview(reader.result);
      if (personImgRef.current) personImgRef.current.src = reader.result;
      detectFaceAndPosition(file);
    };
    reader.readAsDataURL(file);
  };

  // Auto face detection (fine‑tunes alignment)
  const detectFaceAndPosition = async (imageFile) => {
    if (!selectedDress) {
      setError("Please select a dress first");
      return;
    }
    setIsDetectingFace(true);
    const formData = new FormData();
    formData.append("image", imageFile);
    try {
      const res = await fetch("http://localhost:5001/detect-face-position", { method: "POST", body: formData });
      const data = await res.json();
      if (data.face_detected) {
        setOffsetY(Math.max(12, data.neck_y_percent - 6)); // move significantly higher
        setOffsetX(data.neck_x_percent);
        setDressWidth(Math.min(150, data.shoulder_width_percent + 15));
        setFaceDetected(true);
        setTimeout(() => setFaceDetected(false), 3000);
        setTimeout(() => drawPreview(), 500);
      } else {
        // fallback to very high position
        setOffsetY(18);
        setOffsetX(50);
        setDressWidth(125);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDetectingFace(false);
    }
  };

  // Draw composition on resultCanvasRef 
  const drawPreview = () => {
    if (!resultCanvasRef.current || !personImgRef.current || !dressImgRef.current) return;
    if (!personImgRef.current.complete || !dressImgRef.current.complete) {
      setTimeout(drawPreview, 100);
      return;
    }
    const canvas = resultCanvasRef.current;
    const ctx = canvas.getContext("2d");
    const size = personImgRef.current.naturalWidth;
    if (!size) return;
    canvas.width = size;
    canvas.height = size;
    // Draw person photo (square)
    ctx.drawImage(personImgRef.current, 0, 0, size, size);
    // Dress dimensions – maintain aspect ratio
    const widthPx = size * (dressWidth / 100);
    const heightPx = (dressImgRef.current.naturalHeight * widthPx) / dressImgRef.current.naturalWidth;
    const x = (size - widthPx) * (offsetX / 100);
    const y = size * (offsetY / 100);
    ctx.drawImage(dressImgRef.current, x, y, widthPx, heightPx);
    setShowPreview(true);
  };

  // Apply: capture canvas output and go to step 3
  const applyResult = () => {
    if (resultCanvasRef.current && showPreview) {
      const capturedImage = resultCanvasRef.current.toDataURL("image/png");
      setFinalResultImage(capturedImage);
      setStep(3);
    }
  };

  const resetAlignment = () => {
    setOffsetY(18);
    setOffsetX(50);
    setDressWidth(125);
    setTimeout(drawPreview, 100);
  };

  const resetPersonUpload = () => {
    setUploadedPersonPreview(null);
    setUploadedPersonFile(null);
    setShowPreview(false);
    resetAlignment();
    if (personImgRef.current) personImgRef.current.src = "";
  };

  const resetTryOn = () => {
    setStep(1);
    setSelectedDress(null);
    setUploadedPersonPreview(null);
    setUploadedPersonFile(null);
    setShowPreview(false);
    setFinalResultImage(null);
    setSelectedCategory("all");
    setOffsetY(18);
    setOffsetX(50);
    setDressWidth(125);
    setError(null);
    setPersonUploadError(null);
    if (personImgRef.current) personImgRef.current.src = "";
    if (dressImgRef.current) dressImgRef.current.src = "";
  };

  const saveImage = () => {
    if (finalResultImage) {
      const link = document.createElement("a");
      link.download = `virtual-tryon-${Date.now()}.jpg`;
      link.href = finalResultImage;
      link.click();
    }
  };

  const formatPrice = (price) => new Intl.NumberFormat("en-IN").format(price);

  // Redraw when alignment or image changes (only in step 2)
  useEffect(() => {
    if (step === 2 && uploadedPersonPreview && selectedDress && personImgRef.current?.src && dressImgRef.current?.src) {
      drawPreview();
    }
  }, [offsetY, offsetX, dressWidth, uploadedPersonPreview, selectedDress, step]);

  const selectedCategoryInfo = categories.find(c => c.value === selectedCategory) || categories[0];

  return (
    <div className="vt-page">
      <Navbar />
      <img ref={personImgRef} style={{ display: "none" }} crossOrigin="anonymous" alt="" />
      <img ref={dressImgRef} style={{ display: "none" }} crossOrigin="anonymous" alt="" />

      <div className="vt-container">
        <div className="vt-header">
          <h1>Virtual <span>Try-On</span></h1>
          <p>Select a dress, upload your photo, and see how it looks</p>
          <div className="status-indicators">
            <div className={`status ${flaskStatus === "online" ? "online" : "offline"}`}>
              <span></span> AI: {flaskStatus === "online" ? "Online" : "Offline"}
            </div>
            <div className={`status ${nodeStatus === "online" ? "online" : "offline"}`}>
              <span></span> DB: {nodeStatus === "online" ? "Online" : "Offline"}
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="vt-steps">
          <div className={`step ${step >= 1 ? "active" : ""}`}><div className="step-num">1</div><span>Dress</span></div>
          <div className={`step-line ${step >= 2 ? "active" : ""}`}></div>
          <div className={`step ${step >= 2 ? "active" : ""}`}><div className="step-num">2</div><span>Photo</span></div>
          <div className={`step-line ${step >= 3 ? "active" : ""}`}></div>
          <div className={`step ${step >= 3 ? "active" : ""}`}><div className="step-num">3</div><span>Result</span></div>
        </div>

        {/* STEP 1: Select Dress (only from collection) */}
        {step === 1 && (
          <div className="card step-card">
            <h2>Choose Your Dress</h2>
            <div className="category-filter">
              <div className="category-buttons">
                {categories.map(cat => (
                  <button key={cat.value} className={`category-chip ${selectedCategory === cat.value ? "active" : ""}`} onClick={() => filterByCategory(cat.value)}>
                    <i className={cat.icon}></i><span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <p className="results-count">{filteredDresses.length} dress{filteredDresses.length !== 1 ? "es" : ""}{selectedCategory !== "all" && ` in ${selectedCategoryInfo.label}`}</p>
            {filteredDresses.length === 0 ? (
              <div className="empty-dresses"><i className="ri-inbox-line"></i><p>No dresses found</p></div>
            ) : (
              <div className="dresses-grid">
                {filteredDresses.map(dress => (
                  <div key={dress._id} className={`dress-item ${selectedDress?._id === dress._id ? "selected" : ""}`} onClick={() => selectDress(dress)}>
                    <img src={dress.image} alt={dress.name} />
                    <div><h3>{dress.name}</h3><p>NPR {formatPrice(dress.price)}/day</p></div>
                    {selectedDress?._id === dress._id && <div className="selected-check"><i className="ri-checkbox-circle-fill"></i></div>}
                  </div>
                ))}
              </div>
            )}
            {selectedDress && <button className="btn-primary" onClick={() => setStep(2)}>Continue <i className="ri-arrow-right-line"></i></button>}
          </div>
        )}

        {/* STEP 2: Upload Person Photo & Align */}
        {step === 2 && (
          <div className="card step-card">
            <h2>Upload Your Photo</h2>
            <p className="instruction">Upload a clear photo from shoulders up for best results</p>
            {selectedDress && (
              <div className="selected-dress-info">
                <img src={selectedDress.image} alt={selectedDress.name} />
                <div><strong>{selectedDress.name}</strong><span>Selected Dress</span></div>
              </div>
            )}
            <div className="upload-person-box" onClick={() => personFileInputRef.current?.click()}>
              {!uploadedPersonPreview ? (
                <><i className="ri-user-upload-line"></i><p>Click to upload your photo</p><small>JPG, PNG up to 10MB</small></>
              ) : (
                <img src={uploadedPersonPreview} alt="Your Photo" className="uploaded-preview" />
              )}
              <input type="file" ref={personFileInputRef} onChange={handlePersonPhotoUpload} hidden accept="image/jpeg,image/jpg,image/png" />
            </div>
            {personUploadError && <div className="error-box"><i className="ri-error-warning-line"></i><p>{personUploadError}</p></div>}
            {isDetectingFace && <div className="processing-indicator"><div className="spinner-small"></div><p>Detecting face...</p></div>}
            {faceDetected && <div className="success-badge"><i className="ri-checkbox-circle-line"></i> Dress auto-aligned!</div>}

            {uploadedPersonPreview && (
              <>
                <canvas ref={resultCanvasRef} style={{ display: "none" }} />
                <div className="alignment-controls">
                  <h3>Adjust Dress Position</h3>
                  <div className="control"><label>Vertical (Neck)</label><input type="range" min="10" max="60" value={offsetY} onChange={e => setOffsetY(parseInt(e.target.value))} /><span className="value">{offsetY}%</span></div>
                  <div className="control"><label>Horizontal</label><input type="range" min="0" max="100" value={offsetX} onChange={e => setOffsetX(parseInt(e.target.value))} /><span className="value">{offsetX}%</span></div>
                  <div className="control"><label>Dress Size</label><input type="range" min="60" max="180" value={dressWidth} onChange={e => setDressWidth(parseInt(e.target.value))} /><span className="value">{dressWidth}%</span></div>
                  <div className="control-buttons"><button className="btn-small" onClick={drawPreview}>Preview</button><button className="btn-small" onClick={resetAlignment}>Reset</button></div>
                </div>
                {showPreview && resultCanvasRef.current && (
                  <div className="preview-box">
                    <h3>Preview</h3>
                    <canvas ref={canvas => { if (canvas && resultCanvasRef.current) { canvas.width = resultCanvasRef.current.width; canvas.height = resultCanvasRef.current.height; canvas.getContext("2d").drawImage(resultCanvasRef.current, 0, 0); } }} className="preview-canvas" />
                  </div>
                )}
                <div className="action-buttons">
                  <button className="btn-primary" onClick={applyResult} disabled={!showPreview}>Apply & Continue</button>
                  <button className="btn-secondary" onClick={resetPersonUpload}>Change Photo</button>
                </div>
              </>
            )}
            {error && <div className="error-box"><i className="ri-error-warning-line"></i><p>{error}</p></div>}
            <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
          </div>
        )}

        {/* STEP 3: Result – uses EXACT same frame styling as Step 2 preview */}
        {step === 3 && finalResultImage && (
          <div className="card step-card">
            <h2>Your Virtual Try-On</h2>
            <div className="preview-box"> {/* same container as preview */}
              <img src={finalResultImage} alt="Result" className="preview-canvas" /> {/* same image styling */}
            </div>
            <div className="result-buttons">
              <button className="btn-primary" onClick={saveImage}><i className="ri-download-line"></i> Save Photo</button>
              {selectedDress && selectedDress._id !== "uploaded" && (
                <button className="btn-primary" onClick={() => navigate(`/booking/${selectedDress._id}`)}><i className="ri-shopping-bag-line"></i> Book This Dress</button>
              )}
              <button className="btn-secondary" onClick={resetTryOn}><i className="ri-refresh-line"></i> Try Another</button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default VirtualTryOn;