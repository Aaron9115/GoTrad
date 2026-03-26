import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./Booking.css";

const BookingPage = () => {
  const { dressId } = useParams();
  const navigate = useNavigate();
  const [dress, setDress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingData, setBookingData] = useState({
    startDate: "",
    endDate: "",
    address: "",
    city: "",
    phone: "",
    deliveryMethod: "pickup"
  });
  
  // Refund details state
  const [refundDetails, setRefundDetails] = useState({
    preferredMethod: "bank",
    bankDetails: {
      accountHolder: "",
      bankName: "",
      accountNumber: "",
      ifscCode: ""
    },
    digitalWallet: {
      provider: "",
      phoneNumber: "",
      qrCode: ""
    }
  });
  
  const [priceBreakdown, setPriceBreakdown] = useState({
    days: 0,
    subtotal: 0,
    serviceFee: 0,
    deliveryFee: 0,
    securityDeposit: 1000,
    total: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [user, setUser] = useState(null);
  const [dateError, setDateError] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToDigitalAgreement, setAgreedToDigitalAgreement] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [qrUploading, setQrUploading] = useState(false);
  const [qrPreview, setQrPreview] = useState(null);
  
  const qrFileInputRef = useRef(null);

  // Check if backend is running
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/browse', {
          method: 'HEAD',
          signal: AbortSignal.timeout(2000)
        });
        setBackendStatus('online');
      } catch (err) {
        setBackendStatus('offline');
      }
    };
    checkBackend();
  }, []);

  // Check if user is logged in and load saved refund details
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      if (parsedUser.phone) {
        setBookingData(prev => ({ ...prev, phone: parsedUser.phone }));
      }
      
      // Load saved refund details from user profile
      fetchUserRefundDetails(token);
    }
  }, []);

  const fetchUserRefundDetails = async (token) => {
    try {
      const response = await fetch("http://localhost:5000/api/profile", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        
        if (userData.preferredRefundMethod) {
          setRefundDetails({
            preferredMethod: userData.preferredRefundMethod || "bank",
            bankDetails: {
              accountHolder: userData.bankDetails?.accountHolder || "",
              bankName: userData.bankDetails?.bankName || "",
              accountNumber: userData.bankDetails?.accountNumber || "",
              ifscCode: userData.bankDetails?.ifscCode || ""
            },
            digitalWallet: {
              provider: userData.digitalWallet?.provider || "",
              phoneNumber: userData.digitalWallet?.phoneNumber || "",
              qrCode: userData.digitalWallet?.qrCode || ""
            }
          });
          
          if (userData.digitalWallet?.qrCode) {
            setQrPreview(userData.digitalWallet.qrCode);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching refund details:", err);
    }
  };

  // Fetch dress details by ID
  useEffect(() => {
    const fetchDressById = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (backendStatus === 'online') {
          const response = await fetch(`http://localhost:5000/api/browse`);
          
          if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
          }

          const data = await response.json();
          const foundDress = data.find(d => d._id === dressId);
          
          if (foundDress) {
            setDress({
              _id: foundDress._id,
              name: foundDress.name,
              category: foundDress.category,
              size: foundDress.size,
              color: foundDress.color,
              pricePerDay: foundDress.price,
              description: foundDress.description || `${foundDress.category} - ${foundDress.color} traditional dress`,
              images: [foundDress.image || "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80"],
              owner: foundDress.owner || { name: "Heritage Rental" },
              available: foundDress.available !== undefined ? foundDress.available : true
            });
          } else {
            setError("Dress not found");
          }
        } else {
          setError("Cannot connect to server. Please make sure backend is running.");
        }
      } catch (err) {
        setError(err.message || "Failed to load dress details");
      } finally {
        setLoading(false);
      }
    };

    if (dressId && backendStatus !== 'checking') {
      fetchDressById();
    }
  }, [dressId, backendStatus]);

  // Calculate price when dates change
  useEffect(() => {
    if (bookingData.startDate && bookingData.endDate && dress) {
      const start = new Date(bookingData.startDate);
      const end = new Date(bookingData.endDate);
      
      if (end < start) {
        setDateError("End date cannot be before start date");
        return;
      }
      
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      if (diffDays > 0 && diffDays <= 30) {
        const subtotal = dress.pricePerDay * diffDays;
        const serviceFee = Math.round(subtotal * 0.05);
        const securityDeposit = 1000;
        const deliveryFee = bookingData.deliveryMethod === 'delivery' ? 100 : 0;
        const total = subtotal + serviceFee + securityDeposit + deliveryFee;
        
        setPriceBreakdown({
          days: diffDays,
          subtotal,
          serviceFee,
          deliveryFee,
          securityDeposit,
          total
        });
        setDateError("");
      } else if (diffDays > 30) {
        setDateError("Maximum rental period is 30 days");
      }
    }
  }, [bookingData.startDate, bookingData.endDate, bookingData.deliveryMethod, dress]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRefundMethodChange = (method) => {
    setRefundDetails(prev => ({
      ...prev,
      preferredMethod: method
    }));
  };

  const handleBankChange = (e) => {
    const { name, value } = e.target;
    setRefundDetails(prev => ({
      ...prev,
      bankDetails: {
        ...prev.bankDetails,
        [name]: value
      }
    }));
  };

  const handleWalletChange = (e) => {
    const { name, value } = e.target;
    setRefundDetails(prev => ({
      ...prev,
      digitalWallet: {
        ...prev.digitalWallet,
        [name]: value
      }
    }));
  };

  const handleQRUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("QR code image should be less than 2MB");
      return;
    }

    setQrUploading(true);
    setError("");

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setQrPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Convert to base64 for storage
    const base64 = await convertToBase64(file);
    setRefundDetails(prev => ({
      ...prev,
      digitalWallet: {
        ...prev.digitalWallet,
        qrCode: base64
      }
    }));

    setQrUploading(false);
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const removeQRCode = () => {
    setQrPreview(null);
    setRefundDetails(prev => ({
      ...prev,
      digitalWallet: {
        ...prev.digitalWallet,
        qrCode: ""
      }
    }));
    if (qrFileInputRef.current) {
      qrFileInputRef.current.value = "";
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = today.toISOString().split('T')[0];

  const validateRefundDetails = () => {
    if (refundDetails.preferredMethod === "bank") {
      if (!refundDetails.bankDetails.accountHolder.trim()) {
        setError("Please enter account holder name for refund");
        return false;
      }
      if (!refundDetails.bankDetails.bankName.trim()) {
        setError("Please enter bank name for refund");
        return false;
      }
      if (!refundDetails.bankDetails.accountNumber.trim()) {
        setError("Please enter account number for refund");
        return false;
      }
    } else if (refundDetails.preferredMethod === "digital_wallet") {
      if (!refundDetails.digitalWallet.provider) {
        setError("Please select wallet provider for refund");
        return false;
      }
      if (!refundDetails.digitalWallet.phoneNumber.trim()) {
        setError("Please enter wallet phone number for refund");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      navigate("/login", { state: { from: `/booking/${dressId}` } });
      return;
    }

    if (!dress.available) {
      setError("This dress is no longer available for booking");
      return;
    }

    if (dateError) {
      return;
    }

    if (!bookingData.address.trim()) {
      setError("Please enter your delivery address");
      return;
    }
    if (!bookingData.city.trim()) {
      setError("Please enter your city");
      return;
    }
    if (!bookingData.phone.trim()) {
      setError("Please enter your phone number");
      return;
    }
    if (!/^\d{10}$/.test(bookingData.phone.replace(/\D/g, ''))) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    // Validate refund details
    if (!validateRefundDetails()) {
      return;
    }

    if (!agreedToTerms) {
      setError("Please agree to the terms and conditions");
      return;
    }

    if (!agreedToDigitalAgreement) {
      setError("Please agree to the digital rental agreement");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch("http://localhost:5000/api/booking/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          dressId: dress._id,
          startDate: bookingData.startDate,
          endDate: bookingData.endDate,
          address: bookingData.address,
          city: bookingData.city,
          phone: bookingData.phone,
          deliveryMethod: bookingData.deliveryMethod,
          securityDeposit: 1000,
          deliveryFee: priceBreakdown.deliveryFee,
          totalAmount: priceBreakdown.total,
          refundDetails: {
            preferredMethod: refundDetails.preferredMethod,
            bankDetails: refundDetails.bankDetails,
            digitalWallet: refundDetails.digitalWallet
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Booking failed");
      }

      setBookingSuccess(true);
      setBookingData(prev => ({ 
        ...prev,
        startDate: "", 
        endDate: "",
        address: "",
        city: "",
        deliveryMethod: "pickup"
      }));
      window.scrollTo({ top: 0, behavior: "smooth" });

    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewMyBookings = () => {
    navigate("/my-bookings");
  };

  const continueShopping = () => {
    navigate("/dresses");
  };

  if (loading) {
    return (
      <div className="booking-page">
        <Navbar />
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading dress details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!dress && !loading && error) {
    return (
      <div className="booking-page">
        <Navbar />
        <div className="error-state">
          <i className="ri-error-warning-line"></i>
          <h3>Error Loading Dress</h3>
          <p>{error}</p>
          <Link to="/dresses" className="btn-primary">
            Browse Collection
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  if (!dress && !loading) {
    return (
      <div className="booking-page">
        <Navbar />
        <div className="error-state">
          <i className="ri-error-warning-line"></i>
          <h3>Dress Not Found</h3>
          <p>The dress you're looking for doesn't exist or has been removed.</p>
          <Link to="/dresses" className="btn-primary">
            Browse Collection
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="booking-page">
      <Navbar />

      {bookingSuccess && (
        <div className="booking-success-banner">
          <div className="success-content">
            <i className="ri-checkbox-circle-line"></i>
            <div>
              <h3>Booking Request Sent!</h3>
              <p>Your booking request has been sent to the owner. You'll be notified once they confirm.</p>
            </div>
            <div className="success-actions">
              <button onClick={viewMyBookings} className="btn-outline">
                View My Bookings
              </button>
              <button onClick={continueShopping} className="btn-primary">
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="booking-container">
        <div className="booking-header">
          <h1>Complete Your Booking</h1>
          <p>Review your details and confirm your rental</p>
        </div>

        <div className="booking-grid">
          {/* Left Column - Booking Form */}
          <div className="booking-form-section">
            <h2>Rental Details</h2>
            
            {backendStatus === 'offline' && (
              <div className="backend-offline-warning">
                <i className="ri-server-line"></i>
                <p>Backend server not running. Please start the server to book.</p>
              </div>
            )}

            {!user && (
              <div className="login-warning">
                <i className="ri-information-line"></i>
                <p>You need to be logged in to book a dress.</p>
                <Link to="/login" state={{ from: `/booking/${dressId}` }} className="btn-primary">
                  Login to Continue
                </Link>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Date Selection */}
              <div className="form-group">
                <label htmlFor="startDate">
                  <i className="ri-calendar-line"></i>
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={bookingData.startDate}
                  onChange={handleChange}
                  min={minDate}
                  required
                  disabled={!user || !dress.available || bookingSuccess || backendStatus === 'offline'}
                />
              </div>

              <div className="form-group">
                <label htmlFor="endDate">
                  <i className="ri-calendar-line"></i>
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={bookingData.endDate}
                  onChange={handleChange}
                  min={bookingData.startDate || minDate}
                  required
                  disabled={!user || !dress.available || bookingSuccess || backendStatus === 'offline'}
                />
              </div>

              {dateError && (
                <div className="date-error">
                  <i className="ri-error-warning-line"></i>
                  {dateError}
                </div>
              )}

              {/* Delivery Address */}
              <div className="form-group">
                <label htmlFor="address">
                  <i className="ri-map-pin-line"></i>
                  Delivery Address
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={bookingData.address}
                  onChange={handleChange}
                  placeholder="Street address, apartment, etc."
                  required
                  disabled={!user || !dress.available || bookingSuccess || backendStatus === 'offline'}
                />
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="city">
                    <i className="ri-building-line"></i>
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={bookingData.city}
                    onChange={handleChange}
                    placeholder="Your city"
                    required
                    disabled={!user || !dress.available || bookingSuccess || backendStatus === 'offline'}
                  />
                </div>

                <div className="form-group half">
                  <label htmlFor="phone">
                    <i className="ri-phone-line"></i>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={bookingData.phone}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    required
                    disabled={!user || !dress.available || bookingSuccess || backendStatus === 'offline'}
                  />
                </div>
              </div>

              {/* Delivery Method Options */}
              <div className="form-group">
                <label>Delivery Method</label>
                <div className="delivery-options">
                  <label className={`delivery-option ${bookingData.deliveryMethod === 'pickup' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="pickup"
                      checked={bookingData.deliveryMethod === 'pickup'}
                      onChange={handleChange}
                      disabled={!user || !dress.available || bookingSuccess || backendStatus === 'offline'}
                    />
                    <div className="delivery-option-content">
                      <span className="delivery-option-title">
                        <i className="ri-store-line"></i>
                        Self Pickup
                      </span>
                      <span className="delivery-option-price">Free</span>
                      <span className="delivery-option-desc">Pick up from owner's location</span>
                    </div>
                  </label>
                  
                  <label className={`delivery-option ${bookingData.deliveryMethod === 'delivery' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="delivery"
                      checked={bookingData.deliveryMethod === 'delivery'}
                      onChange={handleChange}
                      disabled={!user || !dress.available || bookingSuccess || backendStatus === 'offline'}
                    />
                    <div className="delivery-option-content">
                      <span className="delivery-option-title">
                        <i className="ri-truck-line"></i>
                        Home Delivery
                      </span>
                      <span className="delivery-option-price">+NPR 100</span>
                      <span className="delivery-option-desc">Delivered to your address</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Refund Details Section */}
              <div className="refund-details-section">
                <h3>Refund Information</h3>
                <p className="section-note">Your security deposit (NPR 1000) will be refunded to these details after return verification.</p>
                
                <div className="refund-method-selector">
                  <label className="method-label">Preferred Refund Method</label>
                  <div className="method-options">
                    <label className={`method-option ${refundDetails.preferredMethod === 'bank' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="refundMethod"
                        value="bank"
                        checked={refundDetails.preferredMethod === 'bank'}
                        onChange={() => handleRefundMethodChange('bank')}
                        disabled={bookingSuccess || backendStatus === 'offline'}
                      />
                      <i className="ri-bank-line"></i>
                      <span>Bank Transfer</span>
                    </label>
                    
                    <label className={`method-option ${refundDetails.preferredMethod === 'digital_wallet' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="refundMethod"
                        value="digital_wallet"
                        checked={refundDetails.preferredMethod === 'digital_wallet'}
                        onChange={() => handleRefundMethodChange('digital_wallet')}
                        disabled={bookingSuccess || backendStatus === 'offline'}
                      />
                      <i className="ri-wallet-line"></i>
                      <span>Digital Wallet</span>
                    </label>
                  </div>
                </div>

                {refundDetails.preferredMethod === 'bank' && (
                  <div className="bank-details-section">
                    <div className="form-group">
                      <label>Account Holder Name</label>
                      <input
                        type="text"
                        name="accountHolder"
                        value={refundDetails.bankDetails.accountHolder}
                        onChange={handleBankChange}
                        placeholder="As per bank records"
                        disabled={bookingSuccess || backendStatus === 'offline'}
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group half">
                        <label>Bank Name</label>
                        <input
                          type="text"
                          name="bankName"
                          value={refundDetails.bankDetails.bankName}
                          onChange={handleBankChange}
                          placeholder="e.g., Nabil Bank"
                          disabled={bookingSuccess || backendStatus === 'offline'}
                        />
                      </div>

                      <div className="form-group half">
                        <label>Account Number</label>
                        <input
                          type="text"
                          name="accountNumber"
                          value={refundDetails.bankDetails.accountNumber}
                          onChange={handleBankChange}
                          placeholder="Your account number"
                          disabled={bookingSuccess || backendStatus === 'offline'}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>IFSC Code (Optional)</label>
                      <input
                        type="text"
                        name="ifscCode"
                        value={refundDetails.bankDetails.ifscCode}
                        onChange={handleBankChange}
                        placeholder="e.g., NARBNPKA"
                        disabled={bookingSuccess || backendStatus === 'offline'}
                      />
                    </div>
                  </div>
                )}

                {refundDetails.preferredMethod === 'digital_wallet' && (
                  <div className="wallet-details-section">
                    <div className="form-group">
                      <label>Provider</label>
                      <select
                        name="provider"
                        value={refundDetails.digitalWallet.provider}
                        onChange={handleWalletChange}
                        disabled={bookingSuccess || backendStatus === 'offline'}
                      >
                        <option value="">Select Provider</option>
                        <option value="esewa">eSewa</option>
                        <option value="fonepay">Fonepay</option>
                        <option value="khalti">Khalti</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={refundDetails.digitalWallet.phoneNumber}
                        onChange={handleWalletChange}
                        placeholder="98XXXXXXXX"
                        disabled={bookingSuccess || backendStatus === 'offline'}
                      />
                    </div>

                    <div className="form-group">
                      <label>QR Code (Optional)</label>
                      <div className="qr-upload-section">
                        <input
                          type="file"
                          ref={qrFileInputRef}
                          onChange={handleQRUpload}
                          accept="image/*"
                          style={{ display: 'none' }}
                          disabled={bookingSuccess || backendStatus === 'offline'}
                        />
                        
                        {qrPreview || refundDetails.digitalWallet.qrCode ? (
                          <div className="qr-preview-container">
                            <img 
                              src={qrPreview || refundDetails.digitalWallet.qrCode} 
                              alt="QR Code"
                              className="qr-preview"
                            />
                            <button
                              type="button"
                              className="qr-remove-btn"
                              onClick={removeQRCode}
                              disabled={bookingSuccess}
                              title="Remove QR code"
                            >
                              <i className="ri-delete-bin-line"></i>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="qr-upload-btn"
                            onClick={() => qrFileInputRef.current?.click()}
                            disabled={qrUploading || bookingSuccess || backendStatus === 'offline'}
                          >
                            <i className="ri-qr-code-line"></i>
                            {qrUploading ? "Uploading..." : "Upload QR Code"}
                          </button>
                        )}
                        <p className="field-note">Upload a screenshot of your eSewa/Fonepay/Khalti QR code for faster refunds</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="refund-note">
                  <i className="ri-information-line"></i>
                  <p>
                    Your refund will be processed within 5-7 business days after the owner verifies your return.
                    You'll receive a notification once the refund is initiated.
                  </p>
                </div>
              </div>

              {error && (
                <div className="error-message">
                  <i className="ri-error-warning-line"></i>
                  {error}
                </div>
              )}

              {!dress.available && (
                <div className="unavailable-warning">
                  <i className="ri-information-line"></i>
                  This dress is currently not available for booking.
                </div>
              )}

              {/* Terms Agreement */}
              <div className="terms-agreement">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    disabled={backendStatus === 'offline'}
                  />
                  <span>
                    I agree to the <Link to="/terms">terms and conditions</Link>. I understand that NPR 1000 security deposit will be refunded upon safe return of the dress.
                  </span>
                </label>
              </div>

              {/* Digital Agreement */}
              <div className="digital-agreement">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={agreedToDigitalAgreement}
                    onChange={(e) => setAgreedToDigitalAgreement(e.target.checked)}
                    disabled={backendStatus === 'offline'}
                  />
                  <span>
                    I agree to the <Link to="/rental-agreement">digital rental agreement</Link> and understand that this agreement will be stored securely.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className={`btn-primary btn-large ${(!user || !dress.available || isSubmitting || dateError || !bookingData.startDate || !bookingData.endDate || !bookingData.address || !bookingData.city || !bookingData.phone || !bookingData.deliveryMethod || bookingSuccess || !agreedToTerms || !agreedToDigitalAgreement || backendStatus === 'offline') ? "disabled" : ""}`}
                disabled={!user || !dress.available || isSubmitting || dateError || !bookingData.startDate || !bookingData.endDate || !bookingData.address || !bookingData.city || !bookingData.phone || !bookingData.deliveryMethod || bookingSuccess || !agreedToTerms || !agreedToDigitalAgreement || backendStatus === 'offline'}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-small"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <i className="ri-check-line"></i>
                    Send Booking Request
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column - Dress Summary & Price Breakdown */}
          <div className="booking-summary-section">
            <div className="dress-summary-card">
              <h2>Your Selection</h2>
              
              <div className="summary-dress">
                <div className="summary-image">
                  <img src={dress.images[0]} alt={dress.name} />
                </div>
                <div className="summary-details">
                  <h3>{dress.name}</h3>
                  <p className="summary-category">{dress.category}</p>
                  <div className="summary-specs">
                    <span className="spec-badge">
                      <i className="ri-ruler-line"></i> {dress.size}
                    </span>
                    <span className="spec-badge">
                      <i className="ri-palette-line"></i> {dress.color}
                    </span>
                  </div>
                  <p className="summary-price">NPR {dress.pricePerDay}<span>/day</span></p>
                </div>
              </div>

              <div className="owner-info">
                <i className="ri-user-line"></i>
                <span>Owner: {dress.owner.name}</span>
              </div>
            </div>

            <div className="price-breakdown-card">
              <h2>Price Details</h2>
              
              {bookingData.startDate && bookingData.endDate && !dateError ? (
                <>
                  <div className="price-row">
                    <span>Rental Period</span>
                    <span className="price-days">{priceBreakdown.days} days</span>
                  </div>
                  <div className="price-row">
                    <span>Subtotal (NPR {dress.pricePerDay} × {priceBreakdown.days} days)</span>
                    <span>NPR {priceBreakdown.subtotal}</span>
                  </div>
                  <div className="price-row">
                    <span>Service Fee (5%)</span>
                    <span>NPR {priceBreakdown.serviceFee}</span>
                  </div>
                  
                  {priceBreakdown.deliveryFee > 0 && (
                    <div className="price-row">
                      <span>Delivery Fee</span>
                      <span>NPR {priceBreakdown.deliveryFee}</span>
                    </div>
                  )}
                  
                  <div className="price-row highlight">
                    <span>Security Deposit (Refundable)</span>
                    <span className="security-deposit">NPR {priceBreakdown.securityDeposit}</span>
                  </div>
                  <div className="price-divider"></div>
                  <div className="price-row total">
                    <span>Total Amount</span>
                    <span className="total-amount">NPR {priceBreakdown.total}</span>
                  </div>
                  
                  {/* Payment Information */}
                  <div className="payment-info">
                    <h4>Payment Instructions</h4>
                    <ul>
                      <li>Pay the total amount when you receive the dress</li>
                      <li>The delivery person will collect the payment</li>
                      <li>Security deposit will be refunded after return verification</li>
                    </ul>
                  </div>
                </>
              ) : (
                <div className="no-dates-selected">
                  <i className="ri-calendar-todo-line"></i>
                  <p>Select start and end dates to see price breakdown</p>
                </div>
              )}
            </div>

            <div className="policy-card">
              <h3>Booking Policy</h3>
              <ul className="policy-list">
                <li><i className="ri-check-line"></i> Owner confirms booking within 24 hours</li>
                <li><i className="ri-check-line"></i> Free cancellation up to 48 hours before rental</li>
                <li><i className="ri-check-line"></i> Professional dry cleaning included</li>
                <li><i className="ri-check-line"></i> Self pickup or home delivery available</li>
                <li><i className="ri-check-line"></i> NPR 1000 refundable security deposit</li>
                <li><i className="ri-check-line"></i> Digital agreement stored securely</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BookingPage;