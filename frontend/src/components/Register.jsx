import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./Auth.css";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "renter"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      console.log("Sending register request to:", "http://localhost:5000/api/auth/register");
      console.log("With data:", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });

      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role
        })
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers.get("content-type"));

      // Check if response is empty
      const responseText = await response.text();
      console.log("Raw response text:", responseText);

      if (!responseText) {
        throw new Error("Empty response from server");
      }

      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        throw new Error(`Server returned invalid JSON: ${responseText.substring(0, 100)}`);
      }

      console.log("Parsed response data:", data);

      if (!response.ok) {
        throw new Error(data.message || `Registration failed with status ${response.status}`);
      }

      // Store token and user data
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify({
        _id: data._id,
        name: data.name,
        email: data.email,
        role: data.role
      }));

      console.log("Registration successful, redirecting...");

      // Redirect based on role
      if (data.role === "owner") {
        navigate("/owner/dresses");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error("Registration error details:", err);
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Navbar />
      
      <div className="auth-container">
        <div className="auth-card glass-panel">
          <div className="auth-header">
            <h2>Create Account</h2>
            <p>Join GoTrad to start renting traditional dresses</p>
          </div>

          {error && (
            <div className="auth-error">
              <i className="ri-error-warning-line"></i>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="name">
                <i className="ri-user-line"></i>
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">
                <i className="ri-mail-line"></i>
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                <i className="ri-lock-line"></i>
                Password
              </label>
              <div className="password-input">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password (min. 6 characters)"
                  required
                  minLength="6"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={showPassword ? "ri-eye-off-line" : "ri-eye-line"}></i>
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                <i className="ri-lock-line"></i>
                Confirm Password
              </label>
              <div className="password-input">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <i className={showConfirmPassword ? "ri-eye-off-line" : "ri-eye-line"}></i>
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>
                <i className="ri-user-settings-line"></i>
                Account Type
              </label>
              <div className="role-selector">
                <label className={`role-option ${formData.role === "renter" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="role"
                    value="renter"
                    checked={formData.role === "renter"}
                    onChange={handleChange}
                  />
                  <div className="role-content">
                    <i className="ri-user-line"></i>
                    <div>
                      <strong>Renter</strong>
                      <small>I want to rent dresses</small>
                    </div>
                  </div>
                </label>
                <label className={`role-option ${formData.role === "owner" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="role"
                    value="owner"
                    checked={formData.role === "owner"}
                    onChange={handleChange}
                  />
                  <div className="role-content">
                    <i className="ri-store-line"></i>
                    <div>
                      <strong>Owner</strong>
                      <small>I want to list my dresses</small>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="terms-checkbox">
              <label>
                <input type="checkbox" required />
                <span>
                  I agree to the <Link to="/terms">Terms of Service</Link> and{" "}
                  <Link to="/privacy">Privacy Policy</Link>
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="btn-primary btn-large"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Creating Account...
                </>
              ) : (
                <>
                  <i className="ri-user-add-line"></i>
                  Create Account
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>Already have an account?</p>
            <Link to="/login" className="auth-link">
              Sign In <i className="ri-arrow-right-line"></i>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Register;