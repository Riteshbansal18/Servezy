import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import noImage from "../assets/Images/no-image.png";
import Slider from "./Slider";
import Loading from "./Loading";
import myAxios from "../Redux/myAxios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

function StarRating({ rating }) {
  return (
    <div className="pub-stars">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 576 512"
          className={star <= Math.round(rating) ? "star filled" : "star"}
        >
          <path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z" />
        </svg>
      ))}
      <span>{rating > 0 ? rating : "Not Rated"}</span>
    </div>
  );
}

export default function FreelancerPublicProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedService, setExpandedService] = useState(null);

  useEffect(() => {
    myAxios
      .get(`/freelancer/public/${username}`)
      .then((res) => {
        setTimeout(() => {
          if (res.data.status === 200) {
            setProfile(res.data.profile);
          } else {
            setError(res.data.msg || "Profile not found");
          }
          setLoading(false);
        }, 600);
      })
      .catch(() => {
        setLoading(false);
        setError("Could not load profile. Please try again.");
      });
  }, [username]);

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="pub-error-page">
        <div className="pub-error-box">
          <h2>😕 {error}</h2>
          <button onClick={() => navigate("/")}>Go Home</button>
        </div>
      </div>
    );
  }

  const { user, services, overallRating, totalServices } = profile;

  return (
    <div className="FreelancerPublicProfile">
      <div className="pub-container">

        {/* Hero / Profile Header */}
        <div className="pub-hero">
          <div className="pub-avatar-wrap">
            <img
              src={
                user.image === "no-image.png"
                  ? noImage
                  : `${API_URL}/ProfilePic/${user.image}`
              }
              alt={user.username}
              className="pub-avatar"
            />
          </div>
          <div className="pub-hero-info">
            <h1 className="pub-name">{user.fullName || user.username}</h1>
            <p className="pub-username">@{user.username}</p>
            <div className="pub-badges">
              <span className="pub-badge pub-badge-role">Freelancer</span>
              <span className="pub-badge pub-badge-services">
                {totalServices} {totalServices === 1 ? "Service" : "Services"}
              </span>
              {overallRating > 0 && (
                <span className="pub-badge pub-badge-rating">
                  ⭐ {overallRating} Overall
                </span>
              )}
            </div>
          </div>
          <div className="pub-hero-cta">
            <Link to="/signup">
              <button className="pub-btn-primary">Join & Order</button>
            </Link>
            <Link to="/login">
              <button className="pub-btn-secondary">Sign In</button>
            </Link>
          </div>
        </div>

        {/* Services */}
        <div className="pub-section">
          <h2 className="pub-section-title">Services</h2>

          {services.length === 0 ? (
            <div className="pub-empty">No services yet.</div>
          ) : (
            <div className="pub-services-grid">
              {services.map((service) => (
                <div key={service._id} className="pub-service-card">
                  <div className="pub-service-slider">
                    <Slider images={service.images.split("|")} />
                  </div>
                  <div className="pub-service-body">
                    <div className="pub-service-meta">
                      <span className="pub-category">{service.category}</span>
                      <span className="pub-delivery">
                        🕐 {service.deliveryTime}d delivery
                      </span>
                    </div>
                    <h3 className="pub-service-title">{service.title}</h3>
                    <p className="pub-service-desc">
                      {expandedService === service._id
                        ? service.description
                        : service.description.length > 120
                        ? service.description.slice(0, 120) + "..."
                        : service.description}
                      {service.description.length > 120 && (
                        <button
                          className="pub-read-more"
                          onClick={() =>
                            setExpandedService(
                              expandedService === service._id
                                ? null
                                : service._id
                            )
                          }
                        >
                          {expandedService === service._id
                            ? " Show less"
                            : " Read more"}
                        </button>
                      )}
                    </p>
                    <div className="pub-service-footer">
                      <StarRating rating={service.serviceRating} />
                      <span className="pub-price">₹{service.price}</span>
                    </div>
                  </div>

                  {/* Testimonials for this service */}
                  {service.testimonials && service.testimonials.length > 0 && (
                    <div className="pub-testimonials">
                      <h4 className="pub-testimonials-title">Reviews</h4>
                      {service.testimonials.map((t) => (
                        <div key={t._id} className="pub-testimonial">
                          <div className="pub-testimonial-header">
                            <img
                              src={
                                t.reviewer.image === "no-image.png"
                                  ? noImage
                                  : `${API_URL}/ProfilePic/${t.reviewer.image}`
                              }
                              alt={t.reviewer.username}
                              className="pub-reviewer-img"
                            />
                            <div>
                              <span className="pub-reviewer-name">
                                {t.reviewer.username}
                              </span>
                              <div className="pub-review-stars">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <svg
                                    key={s}
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 576 512"
                                    className={
                                      s <= t.rating ? "star filled" : "star"
                                    }
                                  >
                                    <path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z" />
                                  </svg>
                                ))}
                              </div>
                            </div>
                          </div>
                          <p className="pub-testimonial-text">{t.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA Banner */}
        <div className="pub-cta-banner">
          <div className="pub-cta-text">
            <h3>Want to work with {user.fullName || user.username}?</h3>
            <p>Create a free account and place your order in minutes.</p>
          </div>
          <Link to="/signup">
            <button className="pub-btn-primary">Get Started — It's Free</button>
          </Link>
        </div>

      </div>
    </div>
  );
}
