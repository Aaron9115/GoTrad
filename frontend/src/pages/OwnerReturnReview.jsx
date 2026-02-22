import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./OwnerReturnReview.css";

const OwnerReturnReview = () => {
  const { returnId } = useParams();
  const navigate = useNavigate();
  const [returnData, setReturnData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Review form state
  const [condition, setCondition] = useState("good");
  const [hasDamage, setHasDamage] = useState(false);
  const [damageDetails, setDamageDetails] = useState("");
  const [damagePhotos, setDamagePhotos] = useState([]);
  const [damagePreviews, setDamagePreviews] = useState([]);
  const [deductAmount, setDeductAmount] = useState(0);
  const [refundAmount, setRefundAmount] = useState(1000);
  const [resolution, setResolution] = useState("full_refund");
  const [ownerAddress, setOwnerAddress] = useState("");
  const [returnMethod, setReturnMethod] = useState("pickup");
  const [additionalNotes, setAdditionalNotes] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
    fetchReturnDetails();
  }, [returnId]);

  const fetchReturnDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch(`http://localhost:5000/api/return/${returnId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Failed to fetch return details");
      
      const data = await response.json();
      setReturnData(data);
      setRefundAmount(data.securityDeposit || 1000);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDamagePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (damagePhotos.length + files.length > 5) {
      setError("You can only upload up to 5 damage photos");
      return;
    }

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

    setDamagePhotos([...damagePhotos, ...validFiles]);

    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setDamagePreviews([...damagePreviews, ...newPreviews]);
  };

  const removeDamagePhoto = (index) => {
    const newPhotos = [...damagePhotos];
    const newPreviews = [...damagePreviews];
    
    URL.revokeObjectURL(newPreviews[index]);
    
    newPhotos.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setDamagePhotos(newPhotos);
    setDamagePreviews(newPreviews);
  };

  const handleConditionChange = (value) => {
    setCondition(value);
    setHasDamage(value !== "excellent" && value !== "good");
    
    // Auto-calculate deduction based on condition
    if (value === "excellent" || value === "good") {
      setDeductAmount(0);
      setResolution("full_refund");
    } else if (value === "fair") {
      setDeductAmount(300);
      setResolution("partial_refund");
    } else if (value === "damaged") {
      setDeductAmount(800);
      setResolution("renter_pays");
    }
  };

  const handleDeductChange = (e) => {
    const amount = parseInt(e.target.value) || 0;
    setDeductAmount(amount);
    setRefundAmount(1000 - amount);
    
    if (amount === 0) {
      setResolution("full_refund");
    } else if (amount < 500) {
      setResolution("partial_refund");
    } else {
      setResolution("renter_pays");
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!ownerAddress) {
      setError("Please provide your address for return shipping");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      
      formData.append("condition", condition);
      formData.append("hasDamage", hasDamage);
      formData.append("damageDetails", damageDetails);
      formData.append("deductAmount", deductAmount);
      formData.append("resolution", resolution);
      formData.append("ownerAddress", ownerAddress);
      formData.append("returnMethod", returnMethod);
      formData.append("additionalNotes", additionalNotes);
      
      damagePhotos.forEach(photo => {
        formData.append("damagePhotos", photo);
      });

      const response = await fetch(`http://localhost:5000/api/return/${returnId}/review`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit review");
      }

      setSuccess("Return verified successfully! Address sent to renter.");
      
      setTimeout(() => {
        navigate("/owner/dashboard");
      }, 3000);

    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="owner-return-page">
        <Navbar />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading return details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!returnData) {
    return (
      <div className="owner-return-page">
        <Navbar />
        <div className="error-state">
          <i className="ri-error-warning-line"></i>
          <h3>Return Not Found</h3>
          <Link to="/owner/dashboard" className="btn-primary">Back to Dashboard</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="owner-return-page">
      <Navbar />
      
      <div className="owner-return-container">
        <div className="return-header">
          <h1>Verify <span className="gradient-text">Return</span></h1>
          <p>Review the returned dress and confirm condition</p>
        </div>

        {success && (
          <div className="success-message">
            <i className="ri-checkbox-circle-line"></i>
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="error-message">
            <i className="ri-error-warning-line"></i>
            <span>{error}</span>
          </div>
        )}

        <div className="return-review-grid">
          {/* Left Column - Renter's Return Photos */}
          <div className="renter-photos-section glass-panel">
            <h2>Renter's Return Photos</h2>
            <div className="renter-photos-grid">
              {returnData.photos?.map((photo, index) => (
                <div key={index} className="renter-photo">
                  <img src={`http://localhost:5000${photo.url}`} alt={`Return ${index + 1}`} />
                </div>
              ))}
            </div>
            
            <div className="renter-assessment">
              <h3>Renter's Assessment</h3>
              <p><strong>Condition:</strong> {returnData.renterAssessment?.condition}</p>
              {returnData.renterAssessment?.comments && (
                <p><strong>Comments:</strong> {returnData.renterAssessment.comments}</p>
              )}
            </div>
          </div>

          {/* Right Column - Owner Review Form */}
          <div className="owner-review-section glass-panel">
            <h2>Your Inspection</h2>
            
            <form onSubmit={handleSubmitReview}>
              {/* Dress Condition */}
              <div className="form-group">
                <label>Dress Condition *</label>
                <div className="condition-options">
                  {["excellent", "good", "fair", "damaged"].map((opt) => (
                    <label key={opt} className={`condition-option ${condition === opt ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="condition"
                        value={opt}
                        checked={condition === opt}
                        onChange={(e) => handleConditionChange(e.target.value)}
                      />
                      <span className="condition-label">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Damage Details */}
              {hasDamage && (
                <>
                  <div className="form-group">
                    <label htmlFor="damageDetails">Damage Description *</label>
                    <textarea
                      id="damageDetails"
                      rows="3"
                      value={damageDetails}
                      onChange={(e) => setDamageDetails(e.target.value)}
                      placeholder="Describe the damage in detail..."
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Damage Photos (Optional)</label>
                    <div className="damage-photo-upload">
                      <input
                        type="file"
                        id="damagePhotos"
                        accept="image/*"
                        multiple
                        onChange={handleDamagePhotoChange}
                        style={{ display: 'none' }}
                      />
                      
                      <div className="damage-photo-grid">
                        {damagePreviews.map((preview, index) => (
                          <div key={index} className="damage-photo-preview">
                            <img src={preview} alt={`Damage ${index + 1}`} />
                            <button
                              type="button"
                              className="remove-photo"
                              onClick={() => removeDamagePhoto(index)}
                            >
                              <i className="ri-close-line"></i>
                            </button>
                          </div>
                        ))}
                        
                        {damagePhotos.length < 5 && (
                          <button
                            type="button"
                            className="add-damage-photo"
                            onClick={() => document.getElementById('damagePhotos').click()}
                          >
                            <i className="ri-add-line"></i>
                            Add Photo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Deduction Amount */}
                  <div className="form-group">
                    <label htmlFor="deductAmount">Deduct from Security Deposit (₹)</label>
                    <input
                      type="number"
                      id="deductAmount"
                      value={deductAmount}
                      onChange={handleDeductChange}
                      min="0"
                      max="1000"
                    />
                    <p className="input-hint">
                      Refund amount after deduction: <strong>₹{refundAmount}</strong>
                    </p>
                  </div>
                </>
              )}

              {/* Return Shipping Address */}
              <div className="form-group">
                <label htmlFor="ownerAddress">Your Address for Return *</label>
                <textarea
                  id="ownerAddress"
                  rows="3"
                  value={ownerAddress}
                  onChange={(e) => setOwnerAddress(e.target.value)}
                  placeholder="Enter your complete address where the renter should return the dress"
                  required
                />
              </div>

              {/* Return Method */}
              <div className="form-group">
                <label>Return Method</label>
                <select value={returnMethod} onChange={(e) => setReturnMethod(e.target.value)}>
                  <option value="pickup">I will arrange pickup</option>
                  <option value="courier">Renter should courier to my address</option>
                  <option value="dropoff">Renter can drop off at my location</option>
                </select>
              </div>

              {/* Additional Notes */}
              <div className="form-group">
                <label htmlFor="additionalNotes">Additional Notes for Renter</label>
                <textarea
                  id="additionalNotes"
                  rows="2"
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Any special instructions for the renter..."
                />
              </div>

              {/* Resolution Summary */}
              <div className="resolution-summary">
                <h3>Resolution Summary</h3>
                <div className="resolution-details">
                  <p><strong>Security Deposit:</strong> ₹1000</p>
                  <p><strong>Deduction:</strong> ₹{deductAmount}</p>
                  <p><strong>Refund Amount:</strong> ₹{refundAmount}</p>
                  <p><strong>Resolution:</strong> {
                    resolution === "full_refund" ? "Full Refund" :
                    resolution === "partial_refund" ? "Partial Refund" :
                    "Renter Pays"
                  }</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => navigate("/owner/dashboard")}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-small"></span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <i className="ri-check-line"></i>
                      Verify & Send Address
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default OwnerReturnReview;