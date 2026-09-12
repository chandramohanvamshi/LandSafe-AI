import { forwardRef } from "react";
import "./Hero.css";

const Hero = forwardRef(({ onLaunch }, ref) => {
  return (
    <section className="hero" ref={ref}>
      <div className="hero-overlay"></div>

      <div className="hero-container">
        <div className="hero-left">
          <div className="hero-badge">
            <span className="pulse"></span>
            AI Powered • System Online
          </div>

          <h1 className="hero-title">
            LandSafe AI
            <span>Early Warning System</span>
          </h1>

          <p className="hero-description">
            An AI-powered landslide monitoring platform that combines terrain,
            elevation, slope, and rainfall analysis to identify high-risk zones
            and support faster disaster response.
          </p>

          <div className="hero-buttons">
            <button className="btn-primary" onClick={onLaunch}>
              Launch Dashboard →
            </button>

            <a href="#features" className="btn-secondary">
              Explore Features
            </a>
          </div>

          <div className="hero-stats">
            <div className="stat-card">
              <h3>3D</h3>
              <p>Terrain Visualization</p>
            </div>

            <div className="stat-card">
              <h3>AI</h3>
              <p>Random Forest Model</p>
            </div>

            <div className="stat-card">
              <h3>24/7</h3>
              <p>Risk Monitoring</p>
            </div>
          </div>
        </div>

        <div className="hero-right">
          <div className="intel-card">
            <h3>Risk Intelligence</h3>

            <div className="intel-row">
              <span>Elevation</span>
              <strong>1245 m</strong>
            </div>

            <div className="intel-row">
              <span>Slope</span>
              <strong>37°</strong>
            </div>

            <div className="intel-row">
              <span>Rainfall (24h)</span>
              <strong>182 mm</strong>
            </div>

            <div className="intel-row">
              <span>Model</span>
              <strong>Random Forest</strong>
            </div>

            <div className="risk-box">
              <p>Predicted Risk</p>
              <h2>HIGH</h2>

              <div className="risk-bar">
                <div className="risk-fill"></div>
              </div>

              <small>Demo visualization</small>
            </div>
          </div>

          <div className="floating-tag top">Terrain Ready</div>
          <div className="floating-tag bottom">Rainfall Active</div>
        </div>
      </div>
    </section>
  );
});

export default Hero;