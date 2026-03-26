import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./Profile.css";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [activeTab, setActiveTab] = useState("profile");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", address: "", city: "", bio: "", profileImage: "",
    currentPassword: "", newPassword: "", confirmPassword: ""
  });

  useEffect(() => {
    fetchUserData();
    fetchUserStats();
    fetchUserActivity();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/profile", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to fetch profile");
      const data = await response.json();
      setUser(data);
      setFormData({
        name: data.name || "", email: data.email || "", phone: data.phone || "",
        address: data.address || "", city: data.city || "", bio: data.bio || "",
        profileImage: data.profileImage || "", currentPassword: "", newPassword: "", confirmPassword: ""
      });
    } catch (err) {
      setError(err.message);
      if (err.message.includes("token")) navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/profile/stats", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) setStats(await response.json());
    } catch (err) { console.error(err); }
  };

  const fetchUserActivity = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/profile/activity", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) setActivity(await response.json());
    } catch (err) { console.error(err); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handlePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Image size should be less than 5MB"); return; }

    setUploading(true);
    setUploadProgress(0);
    setError("");

    const formDataFile = new FormData();
    formDataFile.append("profileImage", file);

    try {
      const token = localStorage.getItem("token");
      const interval = setInterval(() => setUploadProgress(p => p >= 90 ? (clearInterval(interval), 90) : p + 10), 200);
      
      const response = await fetch("http://localhost:5000/api/profile/upload-picture", {
        method: "POST", headers: { "Authorization": `Bearer ${token}` }, body: formDataFile
      });
      clearInterval(interval);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to upload image");
      
      setUploadProgress(100);
      setUser(prev => ({ ...prev, profileImage: data.profileImage }));
      const storedUser = JSON.parse(localStorage.getItem("user"));
      storedUser.profileImage = data.profileImage;
      localStorage.setItem("user", JSON.stringify(storedUser));
      setSuccess("Profile picture updated!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) { setError(err.message); }
    finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setError("New passwords do not match"); return;
    }
    if (formData.newPassword && formData.newPassword.length < 6) {
      setError("Password must be at least 6 characters"); return;
    }

    try {
      const token = localStorage.getItem("token");
      const updateData = {
        name: formData.name, email: formData.email, phone: formData.phone,
        address: formData.address, city: formData.city, bio: formData.bio
      };
      if (formData.newPassword) updateData.password = formData.newPassword;

      const response = await fetch("http://localhost:5000/api/profile", {
        method: "PUT", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(updateData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to update profile");

      localStorage.setItem("user", JSON.stringify(data));
      setUser(data);
      setSuccess("Profile updated!");
      setIsEditing(false);
      setFormData({ ...formData, currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) { setError(err.message); }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  if (loading) return (
    <div className="profile-page"><Navbar /><div className="loading-container"><div className="spinner"></div><p>Loading profile...</p></div><Footer /></div>
  );

  return (
    <div className="profile-page">
      <Navbar />
      <div className="profile-container">
        <div className="profile-header">
          <h1>My <span className="gradient-text">Profile</span></h1>
          <p>Manage your account information</p>
        </div>

        {error && <div className="error-message"><i className="ri-error-warning-line"></i> {error}</div>}
        {success && <div className="success-message"><i className="ri-checkbox-circle-line"></i> {success}</div>}

        <div className="profile-tabs">
          <button className={`tab-btn ${activeTab === "profile" ? "active" : ""}`} onClick={() => setActiveTab("profile")}>
            <i className="ri-user-line"></i> Profile
          </button>
          <button className={`tab-btn ${activeTab === "stats" ? "active" : ""}`} onClick={() => setActiveTab("stats")}>
            <i className="ri-bar-chart-line"></i> Statistics
          </button>
          <button className={`tab-btn ${activeTab === "activity" ? "active" : ""}`} onClick={() => setActiveTab("activity")}>
            <i className="ri-history-line"></i> Activity
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="profile-content">
            <div className="profile-card glass-panel">
              <div className="profile-avatar-section">
                <div className="profile-avatar-large">
                  {user?.profileImage && !user.profileImage.includes("placeholder") ? (
                    <img src={user.profileImage.startsWith('http') ? user.profileImage : `http://localhost:5000${user.profileImage}`} alt={user.name} onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/150"; }} />
                  ) : (
                    <span>{user?.name?.charAt(0).toUpperCase()}</span>
                  )}
                  <div className="avatar-upload-overlay">
                    <input type="file" ref={fileInputRef} onChange={handlePictureUpload} accept="image/*" style={{ display: 'none' }} />
                    <button className="upload-btn" onClick={() => fileInputRef.current?.click()} disabled={uploading} title="Change profile picture">
                      {uploading ? <div className="upload-progress"><div className="progress-circle"><span>{uploadProgress}%</span></div></div> : <i className="ri-camera-line"></i>}
                    </button>
                  </div>
                </div>
                {uploading && <div className="upload-status"><div className="progress-bar"><div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div></div><span>Uploading... {uploadProgress}%</span></div>}
                <div className="profile-role-badge"><i className={`ri-${user?.role === 'owner' ? 'store' : 'user'}-line`}></i>{user?.role}</div>
              </div>

              <div className="profile-info">
                {!isEditing ? (
                  <>
                    <h2>{user?.name}</h2>
                    <p className="profile-email">{user?.email}</p>
                    <div className="info-grid">
                      {user?.phone && <div className="info-item"><i className="ri-phone-line"></i><span>{user.phone}</span></div>}
                      {user?.city && <div className="info-item"><i className="ri-building-line"></i><span>{user.city}</span></div>}
                      {user?.address && <div className="info-item"><i className="ri-map-pin-line"></i><span>{user.address}</span></div>}
                      {user?.bio && <div className="info-item bio"><i className="ri-quote-line"></i><span>{user.bio}</span></div>}
                    </div>
                    <div className="profile-meta"><div className="meta-item"><i className="ri-calendar-line"></i><span>Joined {formatDate(user?.createdAt)}</span></div></div>
                    <button className="btn-primary" onClick={() => setIsEditing(true)}><i className="ri-edit-line"></i> Edit Profile</button>
                  </>
                ) : (
                  <form onSubmit={handleSubmit} className="profile-form">
                    <div className="form-group"><label><i className="ri-user-line"></i> Full Name</label><input type="text" name="name" value={formData.name} onChange={handleChange} required /></div>
                    <div className="form-group"><label><i className="ri-mail-line"></i> Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} required /></div>
                    <div className="form-row">
                      <div className="form-group half"><label><i className="ri-phone-line"></i> Phone</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Enter your phone number" /></div>
                      <div className="form-group half"><label><i className="ri-building-line"></i> City</label><input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Your city" /></div>
                    </div>
                    <div className="form-group"><label><i className="ri-map-pin-line"></i> Address</label><textarea name="address" value={formData.address} onChange={handleChange} placeholder="Enter your address" rows="2" /></div>
                    <div className="form-group"><label><i className="ri-quote-line"></i> Bio</label><textarea name="bio" value={formData.bio} onChange={handleChange} placeholder="Tell us about yourself" rows="3" /></div>
                    
                    <h3 className="password-section-title">Change Password (Optional)</h3>
                    <div className="form-group"><label><i className="ri-lock-line"></i> New Password</label><input type="password" name="newPassword" value={formData.newPassword} onChange={handleChange} placeholder="Leave blank to keep current" minLength="6" /></div>
                    <div className="form-group"><label><i className="ri-lock-line"></i> Confirm Password</label><input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm new password" /></div>
                    
                    <div className="form-actions">
                      <button type="button" className="btn-outline" onClick={() => { setIsEditing(false); setError(""); setSuccess(""); setFormData({ name: user?.name || "", email: user?.email || "", phone: user?.phone || "", address: user?.address || "", city: user?.city || "", bio: user?.bio || "", profileImage: user?.profileImage || "", currentPassword: "", newPassword: "", confirmPassword: "" }); }}>Cancel</button>
                      <button type="submit" className="btn-primary"><i className="ri-save-line"></i> Save Changes</button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === "stats" && stats && (
          <div className="stats-content">
            <div className="stats-grid">
              {user?.role === "renter" ? (
                <>
                  <div className="stat-card glass-panel"><i className="ri-calendar-line"></i><div><span className="stat-value">{stats.totalBookings || 0}</span><span className="stat-label">Total Bookings</span></div></div>
                  <div className="stat-card glass-panel"><i className="ri-hourglass-line"></i><div><span className="stat-value">{stats.activeBookings || 0}</span><span className="stat-label">Active Bookings</span></div></div>
                  <div className="stat-card glass-panel"><i className="ri-check-line"></i><div><span className="stat-value">{stats.completedBookings || 0}</span><span className="stat-label">Completed</span></div></div>
                  <div className="stat-card glass-panel"><i className="ri-close-line"></i><div><span className="stat-value">{stats.cancelledBookings || 0}</span><span className="stat-label">Cancelled</span></div></div>
                </>
              ) : (
                <>
                  <div className="stat-card glass-panel"><i className="ri-shirt-line"></i><div><span className="stat-value">{stats.totalDresses || 0}</span><span className="stat-label">Total Dresses</span></div></div>
                  <div className="stat-card glass-panel"><i className="ri-checkbox-circle-line"></i><div><span className="stat-value">{stats.availableDresses || 0}</span><span className="stat-label">Available</span></div></div>
                  <div className="stat-card glass-panel"><i className="ri-calendar-line"></i><div><span className="stat-value">{stats.rentedDresses || 0}</span><span className="stat-label">Rented Out</span></div></div>
                  <div className="stat-card glass-panel"><i className="ri-bookings-line"></i><div><span className="stat-value">{stats.totalBookings || 0}</span><span className="stat-label">Total Bookings</span></div></div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === "activity" && (
          <div className="activity-content">
            <div className="activity-timeline glass-panel">
              <h3><i className="ri-history-line"></i> Recent Activity</h3>
              {activity.length === 0 ? (
                <p className="no-activity">No recent activity</p>
              ) : (
                <div className="timeline">
                  {activity.map((item, index) => (
                    <div key={index} className="timeline-item">
                      <div className="timeline-icon"><i className={`ri-${item.type === 'booking' ? 'calendar' : 'shirt'}-line`}></i></div>
                      <div className="timeline-content">
                        <p className="timeline-action">{item.action}</p>
                        <div className="timeline-meta">
                          <span className="timeline-date"><i className="ri-time-line"></i>{formatDate(item.date)}</span>
                          {item.status && <span className={`status-badge ${item.status}`}>{item.status}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Profile;