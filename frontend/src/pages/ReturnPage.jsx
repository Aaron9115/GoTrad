import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./ReturnPage.css";

const ReturnPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form states
  const [condition, setCondition] = useState("good");
  const [comments, setComments] = useState("");
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Existing return check
  const [existingReturn, setExistingReturn] = useState(null);
  const [checkingReturn, setCheckingReturn] = useState(true);

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  // Fetch booking details
  useEffect(() => {
    fetchBookingDetails();
    checkExistingReturn();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/booking/my`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Failed to fetch bookings");

      const bookings = await response.json();
      const foundBooking = bookings.find(b => b._id === bookingId);

      if (!foundBooking) {
        throw new Error("Booking not found");
      }

      setBooking(foundBooking);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingReturn = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/return/booking/${bookingId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setExistingReturn(data);
      }
    } catch (err) {
      console.log("No existing return found");
    } finally {
      setCheckingReturn(false);
    }
  };

  // Handle photo selection
  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file count
    if (photos.length + files.length > 5) {
      setError("You can only upload up to 5 photos");
      return;
    }

    // Validate each file
    const validFiles = files.filter(file => {
      if (!file.type.startsWith("image/")) {
        setError(`${file.name} is not an image`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(`${file.name} is larger than 10MB`);
        return false;
      }
      return true;
    });

    setPhotos([...photos, ...validFiles]);

    // Create preview URLs
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setPhotoPreviews([...photoPreviews, ...newPreviews]);
  };

  const removePhoto = (index) => {
    const newPhotos = [...photos];
    const newPreviews = [...photoPreviews];
    
    // Revoke object URL to free memory
    URL.revokeObjectURL(newPreviews[index]);
    
    newPhotos.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setPhotos(newPhotos);
    setPhotoPreviews(newPreviews);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (photos.length === 0) {
      setError("Please upload at least one photo of the dress");
      return;
    }

    setSubmitting(true);
    setError(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("bookingId", bookingId);
    formData.append("condition", condition);
    formData.append("comments", comments);
    
    photos.forEach(photo => {
      formData.append("photos", photo);
    });

    try {
      const token = localStorage.getItem("token");
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const response = await fetch("http://localhost:5000/api/return/initiate", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to initiate return");
      }

      setSuccess(true);
      
      // Clean up preview URLs
      photoPreviews.forEach(url => URL.revokeObjectURL(url));

    } catch (err) {
      setError(err.message);
      setUploadProgress(0);
    } finally {
      setSubmitting(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading || checkingReturn) {
    return (
      <div className="return-page">
        <Navbar />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (existingReturn) {
    return (
      <div className="return-page">
        <Navbar />
        <div className="return-container">
          <div className="return-card glass-panel">
            <div className="return-header">
              <i className="ri-information-line"></i>
              <h2>Return Already Initiated</h2>
            </div>
            <p>You have already started the return process for this dress.</p>
            <p><strong>Status:</strong> {existingReturn.status}</p>
            <p><strong>Submitted on:</strong> {formatDate(existingReturn.returnInitiatedAt)}</p>
            <Link to={`/return-status/${bookingId}`} className="btn-primary">
              View Return Status
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="return-page">
        <Navbar />
        <div className="return-container">
          <div className="error-card glass-panel">
            <i className="ri-error-warning-line"></i>
            <h2>Booking Not Found</h2>
            <p>The booking you're trying to return doesn't exist.</p>
            <Link to="/my-bookings" className="btn-primary">
              Go to My Bookings
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (success) {
    return (
      <div className="return-page">
        <Navbar />
        <div className="return-container">
          <div className="success-card glass-panel">
            <div className="success-icon">✓</div>
            <h2>Return Initiated Successfully!</h2>
            <p>Your return request has been submitted. The owner will review the photos and verify the dress condition.</p>
            <div className="success-actions">
              <Link to={`/return-status/${bookingId}`} className="btn-primary">
                Track Return Status
              </Link>
              <Link to="/my-bookings" className="btn-outline">
                Back to My Bookings
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="return-page">
      <Navbar />

      <div className="return-container">
        <div className="return-header-section">
          <h1>Return Your <span className="gradient-text">Dress</span></h1>
          <p>Please take clear photos of the dress before returning</p>
        </div>

        {/* Booking Summary */}
        <div className="booking-summary-card glass-panel">
          <div className="summary-header">
            <h3>Booking Summary</h3>
            <span className={`status-badge ${booking.status}`}>
              {booking.status}
            </span>
          </div>

          <div className="summary-content">
            <div className="dress-info">
              <img 
                src={booking.dress?.image || "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=100&q=80"} 
                alt={booking.dress?.name}
                className="dress-thumbnail"
              />
              <div>
                <h4>{booking.dress?.name}</h4>
                <p>{booking.dress?.category} • Size {booking.dress?.size}</p>
              </div>
            </div>

            <div className="dates-info">
              <div className="date-item">
                <i className="ri-calendar-check-line"></i>
                <span>Rented: {formatDate(booking.startDate)}</span>
              </div>
              <div className="date-item">
                <i className="ri-calendar-close-line"></i>
                <span>Return by: {formatDate(booking.endDate)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Return Form */}
        <div className="return-form-card glass-panel">
          <h2>Return Details</h2>
          
          {error && (
            <div className="error-message">
              <i className="ri-error-warning-line"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Dress Condition */}
            <div className="form-group">
              <label>Dress Condition *</label>
              <div className="condition-options">
                <label className={`condition-option ${condition === "excellent" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="condition"
                    value="excellent"
                    checked={condition === "excellent"}
                    onChange={(e) => setCondition(e.target.value)}
                  />
                  <span className="condition-label">Excellent</span>
                  <span className="condition-desc">Like new, no wear</span>
                </label>

                <label className={`condition-option ${condition === "good" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="condition"
                    value="good"
                    checked={condition === "good"}
                    onChange={(e) => setCondition(e.target.value)}
                  />
                  <span className="condition-label">Good</span>
                  <span className="condition-desc">Minor wear, clean</span>
                </label>

                <label className={`condition-option ${condition === "fair" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="condition"
                    value="fair"
                    checked={condition === "fair"}
                    onChange={(e) => setCondition(e.target.value)}
                  />
                  <span className="condition-label">Fair</span>
                  <span className="condition-desc">Visible wear, needs cleaning</span>
                </label>

                <label className={`condition-option ${condition === "damaged" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="condition"
                    value="damaged"
                    checked={condition === "damaged"}
                    onChange={(e) => setCondition(e.target.value)}
                  />
                  <span className="condition-label">Damaged</span>
                  <span className="condition-desc">Torn, stained, or broken</span>
                </label>
              </div>
            </div>

            {/* Comments */}
            <div className="form-group">
              <label htmlFor="comments">Additional Comments (Optional)</label>
              <textarea
                id="comments"
                rows="4"
                placeholder="Tell us about the dress condition, any issues, or special notes..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>

            {/* Photo Upload */}
            <div className="form-group">
              <label>Photos * (Upload up to 5 photos)</label>
              <div className="upload-area">
                <input
                  type="file"
                  id="photos"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoChange}
                  style={{ display: 'none' }}
                />
                
                <div className="photo-grid">
                  {photoPreviews.map((preview, index) => (
                    <div key={index} className="photo-preview">
                      <img src={preview} alt={`Preview ${index + 1}`} />
                      <button
                        type="button"
                        className="remove-photo"
                        onClick={() => removePhoto(index)}
                      >
                        <i className="ri-close-line"></i>
                      </button>
                    </div>
                  ))}
                  
                  {photos.length < 5 && (
                    <button
                      type="button"
                      className="add-photo-btn"
                      onClick={() => document.getElementById('photos').click()}
                    >
                      <i className="ri-add-line"></i>
                      <span>Add Photo</span>
                    </button>
                  )}
                </div>
                
                <p className="upload-hint">
                  <i className="ri-information-line"></i>
                  Please take clear photos showing the dress condition, especially any stains or damages.
                </p>
              </div>
            </div>

            {/* Progress Bar (when uploading) */}
            {submitting && (
              <div className="upload-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <span>Uploading... {uploadProgress}%</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="form-actions">
              <Link to="/my-bookings" className="btn-outline">
                Cancel
              </Link>
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting || photos.length === 0}
              >
                {submitting ? (
                  <>
                    <span className="spinner-small"></span>
                    Submitting...
                  </>
                ) : (
                  <>
                    <i className="ri-upload-line"></i>
                    Submit Return
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Return Guidelines */}
        <div className="guidelines-card glass-panel">
          <h3>Return Guidelines</h3>
          <ul className="guidelines-list">
            <li>
              <i className="ri-check-line"></i>
              <span>Take photos in good lighting</span>
            </li>
            <li>
              <i className="ri-check-line"></i>
              <span>Show the entire dress, front and back</span>
            </li>
            <li>
              <i className="ri-check-line"></i>
              <span>Zoom in on any stains or damages</span>
            </li>
            <li>
              <i className="ri-check-line"></i>
              <span>Photos help owners verify condition quickly</span>
            </li>
            <li>
              <i className="ri-check-line"></i>
              <span>False claims may result in penalties</span>
            </li>
          </ul>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ReturnPage;