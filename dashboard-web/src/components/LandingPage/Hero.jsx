import { forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import {
  ArrowRight,
  Activity,
  Mountain,
  CloudRain,
  ShieldAlert,
  MapPin,
  Satellite,
  Play,
  Radio,
  ChevronDown,
} from "lucide-react";

import "./Hero.css";

const Hero = forwardRef((props, ref) => {
  const navigate = useNavigate();

  const handleExploreDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <section className="hero-v2" ref={ref}>

      {/* ================= BACKGROUND ================= */}

      <div className="hero-mountain"></div>
      <div className="hero-dark-overlay"></div>

      <div className="hero-top-glow"></div>

      {/* Animated fog */}
      <div className="hero-fog fog-one"></div>
      <div className="hero-fog fog-two"></div>

      {/* Rain */}
      <div className="rain-container">
        {Array.from({ length: 30 }).map((_, index) => (
          <span
            key={index}
            style={{
              left: `${(index * 37) % 100}%`,
              animationDelay: `${(index % 10) * 0.3}s`,
              animationDuration: `${1.2 + (index % 5) * 0.25}s`,
            }}
          />
        ))}
      </div>

      {/* ================= MAIN CONTENT ================= */}

      <div className="hero-content">

        {/* ================= LEFT ================= */}

        <motion.div
          className="hero-v2-left"
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9 }}
        >

          {/* Status */}
          <motion.div
            className="hero-status"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="status-light"></span>

            <Activity size={14} />

            <span>AI POWERED</span>

            <b>•</b>

            <span>REAL-TIME MONITORING</span>

            <b>•</b>

            <span>RUDRAPRAYAG</span>
          </motion.div>

          {/* Main title */}
          <motion.h1
            className="hero-v2-title"
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <span>Predict</span>

            <span>Landslides</span>

            <strong>
              Before They
              <br />
              Strike.
            </strong>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="hero-v2-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
          >
            AI-POWERED LANDSLIDE EARLY WARNING SYSTEM
          </motion.p>

          {/* Description */}
          <motion.p
            className="hero-v2-description"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
          >
            LandSafe AI combines terrain intelligence, elevation, slope,
            rainfall data and machine learning to identify potential
            landslide risk zones and support faster disaster response.
          </motion.p>

          {/* Buttons */}
          <motion.div
            className="hero-v2-buttons"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75 }}
          >

            {/* EXPLORE DASHBOARD */}
            <button
              className="hero-main-button"
              onClick={handleExploreDashboard}
            >
              <Mountain size={18} />

              Explore Dashboard

              <ArrowRight size={18} />
            </button>

            {/* HOW IT WORKS */}
            <a
              href="#how-it-works"
              className="hero-video-button"
            >
              <span className="play-circle">
                <Play size={12} fill="currentColor" />
              </span>

              How It Works
            </a>

          </motion.div>

          {/* Feature cards */}
          <motion.div
            className="hero-feature-row"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >

            {/* Terrain */}
            <div className="hero-feature">

              <div className="feature-icon">
                <Mountain size={20} />
              </div>

              <div>
                <strong>3D</strong>
                <span>Terrain Analysis</span>
              </div>

            </div>

            {/* AI */}
            <div className="hero-feature">

              <div className="feature-icon">
                <ShieldAlert size={20} />
              </div>

              <div>
                <strong>AI</strong>
                <span>Risk Prediction</span>
              </div>

            </div>

            {/* Monitoring */}
            <div className="hero-feature">

              <div className="feature-icon">
                <CloudRain size={20} />
              </div>

              <div>
                <strong>24/7</strong>
                <span>Monitoring</span>
              </div>

            </div>

          </motion.div>

        </motion.div>

        {/* ================= RIGHT ================= */}

        <motion.div
          className="hero-v2-right"
          initial={{ opacity: 0, x: 60, scale: 0.94 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{
            delay: 0.4,
            duration: 1,
          }}
        >

          {/* Location */}
          <motion.div
            className="location-marker"
            animate={{
              y: [0, -8, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >

            <div className="location-pin">
              <MapPin size={17} />
            </div>

            <div>
              <strong>Rudraprayag</strong>
              <span>Uttarakhand</span>
            </div>

          </motion.div>

          {/* Satellite card */}
          <motion.div
            className="satellite-card"
            animate={{
              y: [0, -7, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >

            <Satellite size={18} />

            <div>
              <span>SATELLITE MONITORING</span>
              <strong>Data Stream Active</strong>
            </div>

            <span className="satellite-live"></span>

          </motion.div>

          {/* Main risk card */}
          <motion.div
            className="risk-panel"
            animate={{
              y: [0, -6, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >

            {/* Header */}
            <div className="risk-panel-header">

              <div>
                <span>LIVE RISK ANALYSIS</span>
                <h3>Current Risk</h3>
              </div>

              <div className="live-status">
                <span></span>
                LIVE
              </div>

            </div>

            {/* Main risk */}
            <div className="risk-main">

              {/* Circle */}
              <div className="risk-meter">

                <div className="risk-meter-inner">

                  <strong>82%</strong>

                  <span>HIGH RISK</span>

                </div>

              </div>

              {/* Data */}
              <div className="risk-data">

                {/* Rainfall */}
                <div className="risk-data-row">

                  <div>
                    <CloudRain size={16} />
                    <span>Rainfall (24h)</span>
                  </div>

                  <strong>182 mm</strong>

                </div>

                {/* Elevation */}
                <div className="risk-data-row">

                  <div>
                    <Mountain size={16} />
                    <span>Elevation</span>
                  </div>

                  <strong>1,245 m</strong>

                </div>

                {/* Slope */}
                <div className="risk-data-row">

                  <div>
                    <Activity size={16} />
                    <span>Slope</span>
                  </div>

                  <strong>37°</strong>

                </div>

                {/* ML Model */}
                <div className="risk-data-row">

                  <div>
                    <Radio size={16} />
                    <span>ML Model</span>
                  </div>

                  <strong>Random Forest</strong>

                </div>

              </div>

            </div>

            {/* Warning */}
            <div className="risk-warning">

              <div className="warning-icon">
                <ShieldAlert size={18} />
              </div>

              <div>

                <strong>
                  High probability of landslide
                </strong>

                <span>
                  AI detected elevated risk conditions
                </span>

              </div>

            </div>

          </motion.div>

          {/* High risk floating badge */}
          <motion.div
            className="floating-risk-tag"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
            }}
          >

            <span className="danger-dot"></span>

            HIGH RISK ZONE

            <ShieldAlert size={15} />

          </motion.div>

          {/* Terrain contour */}
          <div className="terrain-scan">

            <span></span>
            <span></span>
            <span></span>
            <span></span>

          </div>

        </motion.div>

      </div>

      {/* ================= BOTTOM LOCATION ================= */}

      <motion.div
        className="bottom-location"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >

        <MapPin size={16} />

        <div>
          <strong>Rudraprayag, Uttarakhand</strong>

          <span>
            Monitoring high-risk terrain for a safer tomorrow.
          </span>
        </div>

        <ArrowRight size={17} />

      </motion.div>

      {/* ================= SCROLL ================= */}

      <motion.div
        className="hero-scroll"
        animate={{
          y: [0, 7, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
      >

        <span>SCROLL TO EXPLORE</span>

        <ChevronDown size={18} />

      </motion.div>

    </section>
  );
});

Hero.displayName = "Hero";

export default Hero;