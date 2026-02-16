import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./Auth.css";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || "/";

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

    try {
      console.log("Sending login request to:", "http://localhost:5000/api/auth/login");
      console.log("With data:", formData);

      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers.get("content-type"));

      // First check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response:", text);
        throw new Error(`Server returned ${response.status}: ${text || "Empty response"}`);
      }

      const data = await response.json();
      console.log("Response data:", data);

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Store token and user data
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify({
        _id: data._id,
        name: data.name,
        email: data.email,
        role: data.role
      }));

      console.log("Login successful, redirecting...");

      // Redirect based on role
      if (data.role === "admin") {
        navigate("/admin/dashboard");
      } else if (data.role === "owner") {
        navigate("/owner/dresses");
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error("Login error details:", err);
      setError(err.message || "Login failed. Please try again.");
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
            <h2>Welcome Back</h2>
            <p>Sign in to your account</p>
          </div>

          {error && (
            <div className="auth-error">
              <i className="ri-error-warning-line"></i>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
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
                  placeholder="Enter your password"
                  required
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

            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="forgot-link">
                Forgot Password?
              </Link>
            </div>

            <button 
              type="submit" 
              className="btn-primary btn-large"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Signing in...
                </>
              ) : (
                <>
                  <i className="ri-login-circle-line"></i>
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>Don't have an account?</p>
            <Link to="/register" className="auth-link">
              Create Account <i className="ri-arrow-right-line"></i>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Login;