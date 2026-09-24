import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {
  const navigate = useNavigate();

  return (

    <div className="home-page">


      <section className="hero-section">

        <div className="hero-content">

          <div className="hero-badge">
            ✨ BUILD YOUR FUTURE WITH CAREERFLOW
          </div>

          <h1 className="hero-title">
            Discover Your
            <br />
            <span className="gradient-text">
              Dream Career
            </span>
          </h1>

          <p className="hero-description">
            Connect with exciting opportunities, talented professionals,
            and companies that help you grow. Your next career journey
            starts here with CareerFlow.
          </p>

          <div className="hero-buttons">
            <button
              className="primary-button"
              onClick={() => navigate("/register")}
            >
              Get Started 🚀
            </button>

            <button
              className="secondary-button"
              onClick={() => navigate("/login")}
            >
              Login to Continue →
            </button>
          </div>

        </div>
      </section>

      {/* STATISTICS */}
      <section className="stats-section">

        <div className="stat-card">
          <div className="stat-number">🚀</div>
          <div className="stat-label">Start Your Journey</div>
        </div>

        <div className="stat-card">
          <div className="stat-number">🌍</div>
          <div className="stat-label">Discover Opportunities</div>
        </div>

        <div className="stat-card">
          <div className="stat-number">💜</div>
          <div className="stat-label">Grow Your Career</div>
        </div>

      </section>

      <section className="opportunities-section" id="career">

        <div className="section-label">
          ✨ YOUR FUTURE STARTS HERE
        </div>

        <h2>
          Explore Endless Possibilities
        </h2>

        <p className="section-description">
          Whether you are searching for your dream career or looking
          for talented professionals, CareerFlow connects you with
          new opportunities.
        </p>

        <div className="career-phrases-grid">

          <div className="career-phrase-card purple-card">
            <div className="phrase-icon">🚀</div>

            <h3>Dream Big</h3>

            <p>
              Discover opportunities that match your passion,
              skills, and ambitions.
            </p>
          </div>

          <div className="career-phrase-card blue-card">
            <div className="phrase-icon">🌱</div>

            <h3>Grow Together</h3>

            <p>
              Build meaningful connections and develop
              your professional journey.
            </p>
          </div>

          <div className="career-phrase-card pink-card">
            <div className="phrase-icon">✨</div>

            <h3>Create Your Future</h3>

            <p>
              Take the next step towards a brighter
              and successful career.
            </p>
          </div>

        </div>
      </section>


      {/* FOOTER */}
      <footer className="home-footer">
        <h3>CareerFlow 💜</h3>

        <p>
          Connect. Grow. Achieve your dreams.
        </p>
      </footer>

    </div>
  );
}

export default Home;