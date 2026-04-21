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
  
  const [refundDetails, setRefundDetails] = useState({
    preferredMethod: "bank",
    bankDetails: { accountHolder: "", bankName: "", accountNumber: "" },
    digitalWallet: { provider: "", phoneNumber: "", qrCode: "" }
  });
  
  const [priceBreakdown, setPriceBreakdown] = useState({
    days: 0, subtotal: 0, serviceFee: 0, deliveryFee: 0, securityDeposit: 1000, total: 0
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

  // Check backend status
  useEffect(() => {
    const checkBackend = async () => {
      try {
        await fetch('http://localhost:5000/api/browse', { method: 'HEAD', signal: AbortSignal.timeout(2000) });
        setBackendStatus('online');
      } catch { 
        setBackendStatus('offline'); 
      }
    };
    checkBackend();
  }, []);

  // Load user data
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      if (parsedUser.phone) setBookingData(prev => ({ ...prev, phone: parsedUser.phone }));
      fetchUserRefundDetails(token);
    }
  }, []);

  const fetchUserRefundDetails = async (token) => {
    try {
      const res = await fetch("http://localhost:5000/api/profile", { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (res.ok) {
        const data = await res.json();
        if (data.preferredRefundMethod) {
          setRefundDetails({
            preferredMethod: data.preferredRefundMethod || "bank",
            bankDetails: {
              accountHolder: data.bankDetails?.accountHolder || "",
              bankName: data.bankDetails?.bankName || "",
              accountNumber: data.bankDetails?.accountNumber || ""
            },
            digitalWallet: {
              provider: data.digitalWallet?.provider || "",
              phoneNumber: data.digitalWallet?.phoneNumber || "",
              qrCode: data.digitalWallet?.qrCode || ""
            }
          });
          if (data.digitalWallet?.qrCode) setQrPreview(data.digitalWallet.qrCode);
        }
      }
    } catch (err) { 
      console.error(err); 
    }
  };

  // Fetch dress details
  useEffect(() => {
    const fetchDress = async () => {
      try {
        setLoading(true);
        if (backendStatus === 'online') {
          const res = await fetch('http://localhost:5000/api/browse');
          const data = await res.json();
          const found = data.find(d => d._id === dressId);
          if (found) {
            setDress({
              _id: found._id, 
              name: found.name, 
              category: found.category,
              size: found.size, 
              color: found.color, 
              pricePerDay: found.price,
              description: found.description || `${found.category} - ${found.color} dress`,
              images: [found.image || "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80"],
              owner: found.owner || { name: "Heritage Rental" }, 
              available: found.available !== undefined ? found.available : true
            });
          } else {
            setError("Dress not found");
          }
        } else {
          setError("Cannot connect to server");
        }
      } catch (err) { 
        setError(err.message); 
      } finally { 
        setLoading(false); 
      }
    };
    if (dressId && backendStatus !== 'checking') fetchDress();
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
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      if (days > 0 && days <= 30) {
        const subtotal = dress.pricePerDay * days;
        const serviceFee = Math.round(subtotal * 0.05);
        const deliveryFee = bookingData.deliveryMethod === 'delivery' ? 100 : 0;
        setPriceBreakdown({ 
          days, 
          subtotal, 
          serviceFee, 
          deliveryFee, 
          securityDeposit: 1000, 
          total: subtotal + serviceFee + 1000 + deliveryFee 
        });
        setDateError("");
      } else if (days > 30) {
        setDateError("Maximum rental period is 30 days");
      }
    }
  }, [bookingData.startDate, bookingData.endDate, bookingData.deliveryMethod, dress]);

  const handleChange = (e) => setBookingData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleRefundMethodChange = (method) => setRefundDetails(prev => ({ ...prev, preferredMethod: method }));
  const handleBankChange = (e) => setRefundDetails(prev => ({ 
    ...prev, 
    bankDetails: { ...prev.bankDetails, [e.target.name]: e.target.value } 
  }));
  const handleWalletChange = (e) => setRefundDetails(prev => ({ 
    ...prev, 
    digitalWallet: { ...prev.digitalWallet, [e.target.name]: e.target.value } 
  }));

  const handleQRUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { 
      setError("Please select an image file"); 
      return; 
    }
    if (file.size > 2 * 1024 * 1024) { 
      setError("Image should be less than 2MB"); 
      return; 
    }
    setQrUploading(true);
    const reader = new FileReader();
    reader.onload = () => setQrPreview(reader.result);
    reader.readAsDataURL(file);
    const base64 = await new Promise((resolve) => { 
      const r = new FileReader(); 
      r.readAsDataURL(file); 
      r.onload = () => resolve(r.result); 
    });
    setRefundDetails(prev => ({ 
      ...prev, 
      digitalWallet: { ...prev.digitalWallet, qrCode: base64 } 
    }));
    setQrUploading(false);
  };

  const removeQRCode = () => { 
    setQrPreview(null); 
    setRefundDetails(prev => ({ 
      ...prev, 
      digitalWallet: { ...prev.digitalWallet, qrCode: "" } 
    })); 
    if (qrFileInputRef.current) qrFileInputRef.current.value = ""; 
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = today.toISOString().split('T')[0];

  const validateRefund = () => {
    if (refundDetails.preferredMethod === "bank") {
      if (!refundDetails.bankDetails.accountHolder.trim()) { 
        setError("Enter account holder name"); 
        return false; 
      }
      if (!refundDetails.bankDetails.bankName.trim()) { 
        setError("Enter bank name"); 
        return false; 
      }
      if (!refundDetails.bankDetails.accountNumber.trim()) { 
        setError("Enter account number"); 
        return false; 
      }
    } else if (refundDetails.preferredMethod === "digital_wallet") {
      if (!refundDetails.digitalWallet.provider) { 
        setError("Select wallet provider"); 
        return false; 
      }
      if (!refundDetails.digitalWallet.phoneNumber.trim()) { 
        setError("Enter wallet phone number"); 
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
      setError("Dress is not available for rental"); 
      return; 
    }
    if (dateError) return;
    if (!bookingData.address.trim()) { 
      setError("Enter delivery address"); 
      return; 
    }
    if (!bookingData.city.trim()) { 
      setError("Enter city"); 
      return; 
    }
    if (!bookingData.phone.trim()) { 
      setError("Enter phone number"); 
      return; 
    }
    if (!/^\d{10}$/.test(bookingData.phone.replace(/\D/g, ''))) { 
      setError("Enter a valid 10-digit phone number"); 
      return; 
    }
    if (!validateRefund()) return;
    if (!agreedToTerms) { 
      setError("Please agree to the terms and conditions"); 
      return; 
    }
    if (!agreedToDigitalAgreement) { 
      setError("Please agree to the digital rental agreement"); 
      return; 
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const deliveryFee = bookingData.deliveryMethod === 'delivery' ? 100 : 0;
      const res = await fetch("http://localhost:5000/api/booking/create", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}` 
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
          deliveryFee,
          totalAmount: priceBreakdown.total, 
          agreedToTerms, 
          agreedToDigitalAgreement,
          refundDetails: {
            preferredMethod: refundDetails.preferredMethod,
            bankDetails: refundDetails.bankDetails,
            digitalWallet: refundDetails.digitalWallet
          }
        })
      });
      if (!res.ok) throw new Error((await res.json()).message || "Booking failed");
      setBookingSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) { 
      setError(err.message); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  if (loading) return (
    <div className="booking-page">
      <Navbar />
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
      <Footer />
    </div>
  );

  if (!dress && error) return (
    <div className="booking-page">
      <Navbar />
      <div className="error-box">
        <i className="ri-error-warning-line"></i>
        <h3>Error</h3>
        <p>{error}</p>
        <Link to="/dresses" className="btn-primary">Browse Collection</Link>
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="booking-page">
      <Navbar />
      
      {bookingSuccess && (
        <div className="success-toast">
          <div className="success-content">
            <i className="ri-checkbox-circle-line"></i>
            <div>
              <h3>Booking Request Sent!</h3>
              <p>You'll be notified once confirmed</p>
            </div>
            <div className="success-actions">
              <button onClick={() => navigate("/my-bookings")} className="btn-outline">My Bookings</button>
              <button onClick={() => navigate("/dresses")} className="btn-primary">Continue</button>
            </div>
          </div>
        </div>
      )}
      
      <div className="container">
        <div className="page-header">
          <h1>Complete Your Booking</h1>
          <p>Review and confirm your rental details</p>
        </div>
        
        <div className="two-columns">
          {/* Form Column */}
          <div className="form-card">
            <h2>Rental Details</h2>
            
            {backendStatus === 'offline' && (
              <div className="alert alert-warning">
                <i className="ri-server-line"></i> Backend server is not running
              </div>
            )}
            
            {!user && (
              <div className="alert alert-info">
                <i className="ri-information-line"></i> Please <Link to="/login">login</Link> to continue
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="field">
                  <label><i className="ri-calendar-line"></i> Start Date</label>
                  <input 
                    type="date" 
                    name="startDate" 
                    value={bookingData.startDate} 
                    onChange={handleChange} 
                    min={minDate} 
                    required 
                    disabled={!user || !dress.available || bookingSuccess} 
                  />
                </div>
                <div className="field">
                  <label><i className="ri-calendar-line"></i> End Date</label>
                  <input 
                    type="date" 
                    name="endDate" 
                    value={bookingData.endDate} 
                    onChange={handleChange} 
                    min={bookingData.startDate || minDate} 
                    required 
                    disabled={!user || !dress.available || bookingSuccess} 
                  />
                </div>
              </div>
              
              {dateError && (
                <div className="alert alert-error">
                  <i className="ri-error-warning-line"></i> {dateError}
                </div>
              )}
              
              <div className="field">
                <label><i className="ri-map-pin-line"></i> Delivery Address</label>
                <input 
                  type="text" 
                  name="address" 
                  value={bookingData.address} 
                  onChange={handleChange} 
                  placeholder="Street address" 
                  required 
                  disabled={!user || !dress.available || bookingSuccess} 
                />
              </div>
              
              <div className="row">
                <div className="field">
                  <label><i className="ri-building-line"></i> City</label>
                  <input 
                    type="text" 
                    name="city" 
                    value={bookingData.city} 
                    onChange={handleChange} 
                    required 
                    disabled={!user || !dress.available || bookingSuccess} 
                  />
                </div>
                <div className="field">
                  <label><i className="ri-phone-line"></i> Phone Number</label>
                  <input 
                    type="tel" 
                    name="phone" 
                    value={bookingData.phone} 
                    onChange={handleChange} 
                    placeholder="10-digit number" 
                    required 
                    disabled={!user || !dress.available || bookingSuccess} 
                  />
                </div>
              </div>
              
              <div className="field">
                <label>Delivery Method</label>
                <div className="delivery-options">
                  <label className={`delivery-option ${bookingData.deliveryMethod === 'pickup' ? 'active' : ''}`}>
                    <input 
                      type="radio" 
                      name="deliveryMethod" 
                      value="pickup" 
                      checked={bookingData.deliveryMethod === 'pickup'} 
                      onChange={handleChange} 
                      disabled={!user || !dress.available || bookingSuccess} 
                    />
                    <i className="ri-store-line"></i>
                    <div>
                      <strong>Self Pickup</strong>
                      <span>Free</span>
                    </div>
                  </label>
                  <label className={`delivery-option ${bookingData.deliveryMethod === 'delivery' ? 'active' : ''}`}>
                    <input 
                      type="radio" 
                      name="deliveryMethod" 
                      value="delivery" 
                      checked={bookingData.deliveryMethod === 'delivery'} 
                      onChange={handleChange} 
                      disabled={!user || !dress.available || bookingSuccess} 
                    />
                    <i className="ri-truck-line"></i>
                    <div>
                      <strong>Home Delivery</strong>
                      <span>+NPR 100</span>
                    </div>
                  </label>
                </div>
              </div>
              
              {/* Refund Information Box */}
              <div className="refund-box">
                <h3>Refund Information</h3>
                <p className="hint">Security deposit (NPR 1000) will be refunded to these details</p>
                
                <div className="method-tabs">
                  <button 
                    type="button" 
                    className={`method-tab ${refundDetails.preferredMethod === 'bank' ? 'active' : ''}`} 
                    onClick={() => handleRefundMethodChange('bank')}
                  >
                    <i className="ri-bank-line"></i> Bank Transfer
                  </button>
                  <button 
                    type="button" 
                    className={`method-tab ${refundDetails.preferredMethod === 'digital_wallet' ? 'active' : ''}`} 
                    onClick={() => handleRefundMethodChange('digital_wallet')}
                  >
                    <i className="ri-wallet-line"></i> Digital Wallet
                  </button>
                </div>
                
                {refundDetails.preferredMethod === 'bank' && (
                  <div className="bank-fields">
                    <input 
                      type="text" 
                      name="accountHolder" 
                      placeholder="Account Holder Name" 
                      value={refundDetails.bankDetails.accountHolder} 
                      onChange={handleBankChange} 
                      disabled={bookingSuccess} 
                    />
                    <div className="row">
                      <input 
                        type="text" 
                        name="bankName" 
                        placeholder="Bank Name" 
                        value={refundDetails.bankDetails.bankName} 
                        onChange={handleBankChange} 
                        disabled={bookingSuccess} 
                      />
                      <input 
                        type="text" 
                        name="accountNumber" 
                        placeholder="Account Number" 
                        value={refundDetails.bankDetails.accountNumber} 
                        onChange={handleBankChange} 
                        disabled={bookingSuccess} 
                      />
                    </div>
                  </div>
                )}
                
                {refundDetails.preferredMethod === 'digital_wallet' && (
                  <div className="wallet-fields">
                    <select 
                      name="provider" 
                      value={refundDetails.digitalWallet.provider} 
                      onChange={handleWalletChange} 
                      disabled={bookingSuccess}
                    >
                      <option value="">Select Provider</option>
                      <option value="esewa">eSewa</option>
                      <option value="fonepay">Fonepay</option>
                      <option value="khalti">Khalti</option>
                    </select>
                    <input 
                      type="tel" 
                      name="phoneNumber" 
                      placeholder="Phone Number" 
                      value={refundDetails.digitalWallet.phoneNumber} 
                      onChange={handleWalletChange} 
                      disabled={bookingSuccess} 
                    />
                    <div className="qr-upload">
                      <input 
                        type="file" 
                        ref={qrFileInputRef} 
                        onChange={handleQRUpload} 
                        accept="image/*" 
                        hidden 
                        disabled={bookingSuccess} 
                      />
                      {qrPreview ? (
                        <div className="qr-preview">
                          <img src={qrPreview} alt="QR Code" />
                          <button type="button" onClick={removeQRCode}>✕</button>
                        </div>
                      ) : (
                        <button 
                          type="button" 
                          className="qr-btn" 
                          onClick={() => qrFileInputRef.current?.click()} 
                          disabled={qrUploading || bookingSuccess}
                        >
                          Upload QR Code (Optional)
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="alert alert-error">
                  <i className="ri-error-warning-line"></i> {error}
                </div>
              )}
              
              {!dress.available && (
                <div className="alert alert-warning">
                  <i className="ri-information-line"></i> This dress is not available for rental
                </div>
              )}
              
              <div className="terms">
                <label>
                  <input 
                    type="checkbox" 
                    checked={agreedToTerms} 
                    onChange={(e) => setAgreedToTerms(e.target.checked)} 
                    disabled={backendStatus === 'offline'} 
                  /> 
                  I agree to the <Link to="/terms">terms and conditions</Link>
                </label>
                <label>
                  <input 
                    type="checkbox" 
                    checked={agreedToDigitalAgreement} 
                    onChange={(e) => setAgreedToDigitalAgreement(e.target.checked)} 
                    disabled={backendStatus === 'offline'} 
                  /> 
                  I agree to the <Link to="/rental-agreement">digital rental agreement</Link>
                </label>
              </div>
              
              <button 
                type="submit" 
                className="btn-submit" 
                disabled={!user || !dress.available || isSubmitting || dateError || !bookingData.startDate || !bookingData.endDate || !bookingData.address || !bookingData.city || !bookingData.phone || bookingSuccess || !agreedToTerms || !agreedToDigitalAgreement || backendStatus === 'offline'}
              >
                {isSubmitting ? "Processing..." : "Send Booking Request"}
              </button>
            </form>
          </div>

          {/* Summary Column */}
          <div className="summary-column">
            <div className="summary-card">
              <h2>Your Selection</h2>
              <div className="dress-summary">
                <img src={dress.images[0]} alt={dress.name} />
                <div>
                  <h3>{dress.name}</h3>
                  <p>{dress.category}</p>
                  <div className="specs">
                    <span><i className="ri-ruler-line"></i> {dress.size}</span>
                    <span><i className="ri-palette-line"></i> {dress.color}</span>
                  </div>
                  <div className="price">NPR {dress.pricePerDay}<span>/day</span></div>
                </div>
              </div>
              <div className="owner">
                <i className="ri-user-line"></i> Owner: {dress.owner.name}
              </div>
            </div>
            
            <div className="price-card">
              <h2>Price Details</h2>
              {bookingData.startDate && bookingData.endDate && !dateError ? (
                <>
                  <div className="price-row">
                    <span>Rental Period</span>
                    <span>{priceBreakdown.days} days</span>
                  </div>
                  <div className="price-row">
                    <span>Subtotal</span>
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
                    <span>Security Deposit</span>
                    <span>NPR {priceBreakdown.securityDeposit}</span>
                  </div>
                  <div className="price-divider"></div>
                  <div className="price-row total">
                    <span>Total Amount</span>
                    <span>NPR {priceBreakdown.total}</span>
                  </div>
                  <div className="payment-note">
                    <i className="ri-information-line"></i> Pay when you receive the dress
                  </div>
                </>
              ) : (
                <div className="no-dates">
                  <i className="ri-calendar-todo-line"></i>
                  <p>Select rental dates to see price breakdown</p>
                </div>
              )}
            </div>
            
            <div className="policy-card">
              <h3>Booking Policy</h3>
              <ul>
                <li><i className="ri-check-line"></i> Owner confirms within 24 hours</li>
                <li><i className="ri-check-line"></i> Free cancellation up to 48 hours before</li>
                <li><i className="ri-check-line"></i> Professional cleaning included</li>
                <li><i className="ri-check-line"></i> NPR 1000 refundable security deposit</li>
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