import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./ReviewsPage.css";

const ReviewsPage = () => {
  const { dressId } = useParams();
  const navigate = useNavigate();
  const [dress, setDress] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    console.log("User data exists:", !!userData);
    console.log("Token exists:", !!token);
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    fetchDressAndReviews();
  }, [dressId]);

  const fetchDressAndReviews = async () => {
    setLoading(true);
    try {
      // Fetch dress details
      const dressResponse = await fetch(`http://localhost:5000/api/browse`);
      const dressData = await dressResponse.json();
      const foundDress = dressData.find(d => d._id === dressId);
      
      if (foundDress) {
        setDress({
          _id: foundDress._id,
          name: foundDress.name,
          category: foundDress.category,
          image: foundDress.image || "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80",
          owner: foundDress.owner || { name: "Heritage Rental" }
        });
      }

      // Fetch reviews
      const reviewsResponse = await fetch(`http://localhost:5000/api/review/dress/${dressId}`);
      if (reviewsResponse.ok) {
        const reviewsData = await reviewsResponse.json();
        setReviews(reviewsData);
      }

    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem("token");
    console.log("Token exists:", !!token);
    
    if (!token) {
      setError("Please login first");
      navigate("/login");
      return;
    }

    if (!user) {
      setError("Please login first");
      navigate("/login");
      return;
    }

    if (!comment.trim()) {
      setError("Please write a review");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:5000/api/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          dressId,
          rating,
          comment
        })
      });

      const data = await response.json();
      console.log("Response status:", response.status);
      console.log("Response data:", data);

      if (!response.ok) {
        throw new Error(data.message || "Failed to add review");
      }

      setReviews([data, ...reviews]);
      setShowReviewForm(false);
      setRating(5);
      setComment("");
      
    } catch (err) {
      console.error("Submit review error:", err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const calculateAverage = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  if (loading) {
    return (
      <div className="reviews-page">
        <Navbar />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading reviews...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="reviews-page">
      <Navbar />

      <div className="reviews-container">
        <div className="reviews-header">
          <button onClick={() => navigate(-1)} className="back-btn">
            <i className="ri-arrow-left-line"></i> Back
          </button>
          <h1>Customer Reviews</h1>
        </div>

        {dress && (
          <div className="dress-info-card">
            <img src={dress.image} alt={dress.name} className="dress-thumb" />
            <div>
              <h2>{dress.name}</h2>
              <p className="dress-category">{dress.category}</p>
              <p className="dress-owner">Owner: {dress.owner.name}</p>
            </div>
          </div>
        )}

        <div className="reviews-summary">
          <div className="average-rating">
            <span className="big-rating">{calculateAverage()}</span>
            <div className="stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <i
                  key={star}
                  className={`ri-star${star <= Math.round(calculateAverage()) ? '-fill' : '-line'}`}
                ></i>
              ))}
            </div>
            <span className="total-reviews">{reviews.length} reviews</span>
          </div>

          {user && !showReviewForm && (
            <button className="write-review-btn" onClick={() => setShowReviewForm(true)}>
              <i className="ri-star-line"></i> Write a Review
            </button>
          )}

          {!user && (
            <Link to="/login" className="login-to-review-btn">
              <i className="ri-star-line"></i> Login to Write a Review
            </Link>
          )}
        </div>

        {error && (
          <div className="error-message">
            <i className="ri-error-warning-line"></i> {error}
          </div>
        )}

        {showReviewForm && (
          <div className="review-form-card">
            <h3>Write Your Review</h3>
            <form onSubmit={handleSubmitReview}>
              <div className="rating-input">
                <label>Your Rating *</label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <i
                      key={star}
                      className={`ri-star${star <= (hoverRating || rating) ? '-fill' : '-line'}`}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                    ></i>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="comment">Your Review *</label>
                <textarea
                  id="comment"
                  rows="4"
                  placeholder="Tell others about your experience with this dress..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                ></textarea>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowReviewForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="reviews-list">
          {reviews.length === 0 ? (
            <div className="no-reviews">
              <i className="ri-star-line"></i>
              <h3>No reviews yet</h3>
              <p>Be the first to review this dress!</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review._id} className="review-card">
                <div className="review-header">
                  <div>
                    <span className="reviewer-name">{review.user?.name || "Anonymous"}</span>
                    <div className="review-stars">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <i
                          key={star}
                          className={`ri-star${star <= review.rating ? '-fill' : '-line'}`}
                        ></i>
                      ))}
                    </div>
                  </div>
                  <span className="review-date">{formatDate(review.createdAt)}</span>
                </div>
                {review.comment && (
                  <p className="review-comment">{review.comment}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ReviewsPage;