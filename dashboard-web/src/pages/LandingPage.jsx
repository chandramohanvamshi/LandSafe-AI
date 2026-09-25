import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

import {
  ArrowDown,
  ArrowRight,
  BellRing,
  BrainCircuit,
  CheckCircle2,
  CloudRain,
  Code2,
  GitBranch,
  Globe2,
  Layers3,
  Map,
  Mountain,
  Radio,
  Satellite,
  ShieldAlert,
  ShieldCheck,
  Target,
  Zap,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import "../styles/LandingPage.css";

const GITHUB_URL =
  "https://github.com/chandramohanvamshi/LandSafe-AI";

/* =========================================================
   REVEAL ANIMATION
========================================================= */

function Reveal({
  children,
  className = "",
  delay = 0,
}) {
  const ref = useRef(null);

  const inView = useInView(ref, {
    once: true,
    amount: 0.18,
  });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{
        opacity: 0,
        y: 32,
      }}
      animate={
        inView
          ? {
              opacity: 1,
              y: 0,
            }
          : {}
      }
      transition={{
        duration: 0.7,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

/* =========================================================
   COUNTER
========================================================= */

function Counter({
  value,
  suffix = "",
  prefix = "",
}) {
  const ref = useRef(null);
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    const target = Number(value);

    if (!Number.isFinite(target)) {
      setDisplay(value);
      return;
    }

    const duration = 1100;
    const start = performance.now();

    let frameId = null;

    const tick = (now) => {
      const progress = Math.min(
        (now - start) / duration,
        1
      );

      const eased =
        1 - Math.pow(1 - progress, 3);

      setDisplay(
        Math.round(
          target * eased
        ).toLocaleString()
      );

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [value]);

  return (
    <span ref={ref}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

/* =========================================================
   TERRAIN VISUAL
========================================================= */

function TerrainVisual({
  large = false,
}) {
  return (
    <div
      className={`terrain-visual ${
        large
          ? "terrain-visual-large"
          : ""
      }`}
    >
      <div className="terrain-stars" />

      <div className="terrain-grid" />

      <div className="mountain mountain-back" />

      <div className="mountain mountain-mid" />

      <div className="mountain mountain-front" />

      <div className="terrain-river" />

      <div className="terrain-risk risk-a" />

      <div className="terrain-risk risk-b" />

      <div className="terrain-risk risk-c" />

      <div className="terrain-beacon">
        <span />
      </div>

      <div className="terrain-scan" />
    </div>
  );
}

/* =========================================================
   HOW IT WORKS DATA
========================================================= */

const steps = [
  {
    icon: Satellite,
    number: "01",
    title: "Raw DEM Terrain",
    text:
      "Digital elevation data is transformed into terrain geometry and environmental features.",
    accent: "cyan",
  },

  {
    icon: BrainCircuit,
    number: "02",
    title: "ML Analysis",
    text:
      "A Random Forest model evaluates elevation, slope and rainfall conditions.",
    accent: "teal",
  },

  {
    icon: Layers3,
    number: "03",
    title: "3D Visualization",
    text:
      "Risk information is projected onto an interactive geospatial terrain view.",
    accent: "gold",
  },

  {
    icon: BellRing,
    number: "04",
    title: "Real-Time Alerts",
    text:
      "Risk states can be surfaced for monitoring and early-warning workflows.",
    accent: "red",
  },
];

/* =========================================================
   FEATURES
========================================================= */

const features = [
  {
    icon: Mountain,
    title: "3D Terrain Visualization",
    accent: "cyan",

    text:
      "Explore terrain geometry with interactive rotation, zoom, inspection and spatial risk overlays.",

    visual: <TerrainVisual />,

    bullets: [
      "Interactive terrain",
      "Risk overlays",
      "Location inspection",
    ],
  },

  {
    icon: BrainCircuit,
    title: "AI Risk Prediction",
    accent: "gold",

    text:
      "Environmental inputs are passed through the project's Random Forest prediction pipeline.",

    visual: (
      <div className="feature-risk-visual">

        <div className="risk-ring">
          <div>
            <strong>82%</strong>
            <span>DEMO SCORE</span>
          </div>
        </div>

        <div className="risk-bars">
          <span>
            <i
              style={{
                width: "82%",
              }}
            />
          </span>

          <small>
            Risk probability visualization
          </small>
        </div>

      </div>
    ),

    bullets: [
      "Random Forest",
      "FastAPI inference",
      "Risk classification",
    ],
  },

  {
    icon: CloudRain,
    title: "Environmental Monitoring",
    accent: "teal",

    text:
      "Monitor rainfall and environmental scenario inputs and see their influence on the terrain risk view.",

    visual: (
      <div className="monitor-visual">

        <div className="monitor-value">
          <CloudRain size={22} />

          <strong>
            120
            <small>mm</small>
          </strong>

          <span>
            RAIN / 24H
          </span>
        </div>

        <div className="monitor-row">
          <span>
            Soil moisture
          </span>

          <b>50%</b>

          <i>
            <em
              style={{
                width: "50%",
              }}
            />
          </i>
        </div>

        <div className="monitor-row">
          <span>
            Risk threshold
          </span>

          <b>50%</b>

          <i>
            <em
              style={{
                width: "50%",
              }}
            />
          </i>
        </div>

      </div>
    ),

    bullets: [
      "Rainfall scenarios",
      "Environmental inputs",
      "Live visual response",
    ],
  },

  {
    icon: Map,
    title: "Geospatial Analysis",
    accent: "red",

    text:
      "Turn terrain and environmental data into a spatial view that makes risk easier to inspect.",

    visual: (
      <div className="geo-visual">

        <div className="geo-map">

          <span className="geo-line line-1" />

          <span className="geo-line line-2" />

          <span className="geo-zone zone-1" />

          <span className="geo-zone zone-2" />

          <span className="geo-zone zone-3" />

          <span className="geo-pin pin-1" />

          <span className="geo-pin pin-2" />

        </div>

        <div className="geo-caption">
          <strong>
            1,245m
          </strong>

          <span>
            elevation analyzed
          </span>
        </div>

      </div>
    ),

    bullets: [
      "Spatial risk zones",
      "Elevation & slope",
      "Interactive inspection",
    ],
  },
];

/* =========================================================
   TECHNOLOGY
========================================================= */

const tech = [
  {
    icon: Code2,
    name: "React + Vite",
    type: "Frontend",
  },

  {
    icon: Globe2,
    name: "Three.js",
    type: "3D Visualization",
  },

  {
    icon: BrainCircuit,
    name: "Scikit-learn",
    type: "Machine Learning",
  },

  {
    icon: Zap,
    name: "FastAPI",
    type: "Prediction API",
  },

  {
    icon: Layers3,
    name: "Rasterio / SciPy",
    type: "Geospatial",
  },

  {
    icon: Radio,
    name: "Cloud Deployment",
    type: "Delivery",
  },
];

/* =========================================================
   LANDING PAGE
========================================================= */

export default function LandingPage() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] =
    useState(false);

  /* =======================================================
     DASHBOARD
  ======================================================= */

  const goDashboard = () => {
    setMenuOpen(false);

    navigate("/dashboard");
  };

  /* =======================================================
     SCROLL
  ======================================================= */

  const scrollTo = (id) => {
    setMenuOpen(false);

    document
      .getElementById(id)
      ?.scrollIntoView({
        behavior: "smooth",
      });
  };

  return (
    <div className="ls-page">

      <div className="ls-noise" />

      {/* ===================================================
          NAVBAR
      =================================================== */}

      <header className="ls-nav">

        <button
          className="ls-brand"
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            })
          }
        >

          <span className="brand-mark">
            <Mountain size={20} />
          </span>

          <span>
            LandSafe <b>AI</b>
          </span>

        </button>

        <nav
          className={
            menuOpen
              ? "ls-nav-links open"
              : "ls-nav-links"
          }
        >

          <button
            onClick={() =>
              scrollTo("problem")
            }
          >
            Problem
          </button>

          <button
            onClick={() =>
              scrollTo("workflow")
            }
          >
            How It Works
          </button>

          <button
            onClick={() =>
              scrollTo("features")
            }
          >
            Features
          </button>

          <button
            onClick={() =>
              scrollTo("architecture")
            }
          >
            Technology
          </button>

          <button
            onClick={() =>
              scrollTo("impact")
            }
          >
            Impact
          </button>

        </nav>

        <div className="ls-nav-actions">

          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="nav-github"
          >
            <GitBranch size={17} />
            GitHub
          </a>

          <button
            className="nav-demo"
            onClick={goDashboard}
          >
            Live Demo
            <ArrowRight size={16} />
          </button>

        </div>

        <button
          className="ls-menu"
          onClick={() =>
            setMenuOpen(!menuOpen)
          }
          aria-label="Toggle navigation"
        >
          <span />
          <span />
          <span />
        </button>

      </header>

      <main>

        {/* =================================================
            HERO
        ================================================= */}

        <section className="ls-hero">

          <div className="hero-orb orb-one" />

          <div className="hero-orb orb-two" />

          <div className="hero-particles" />

          <div className="hero-copy">

            <motion.div
              className="hero-kicker"
              initial={{
                opacity: 0,
                y: 15,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.6,
              }}
            >

              <span className="live-dot" />

              SMART INDIA HACKATHON
              · GEOSPATIAL AI

            </motion.div>

            <motion.h1
              initial={{
                opacity: 0,
                y: 25,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.75,
                delay: 0.1,
              }}
            >

              Predicting Landslides.

              <span>
                {" "}Saving Lives.
              </span>

            </motion.h1>

            <motion.p
              className="hero-sub"
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.7,
                delay: 0.2,
              }}
            >
              An AI-powered 3D geospatial
              risk engine for early warning,
              terrain analysis and environmental
              risk monitoring.
            </motion.p>

            <motion.div
              className="hero-actions"
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.7,
                delay: 0.3,
              }}
            >

              <button
                className="btn btn-primary"
                onClick={goDashboard}
              >
                View Live Demo
                <ArrowRight size={18} />
              </button>

              <button
                className="btn btn-outline"
                onClick={() =>
                  scrollTo("architecture")
                }
              >
                View Documentation
                <ArrowDown size={17} />
              </button>

            </motion.div>

            <div className="hero-proof">

              <div>
                <ShieldCheck size={18} />
                <span>
                  ML-powered
                </span>
              </div>

              <div>
                <Mountain size={18} />
                <span>
                  3D terrain
                </span>
              </div>

              <div>
                <Radio size={18} />
                <span>
                  Real-time ready
                </span>
              </div>

            </div>

          </div>

          {/* HERO VISUAL */}

          <motion.div
            className="hero-terrain"
            initial={{
              opacity: 0,
              scale: 0.92,
              x: 30,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              x: 0,
            }}
            transition={{
              duration: 1,
              delay: 0.25,
            }}
          >

            <div className="terrain-label terrain-label-one">
              <span />
              HIGH RISK ZONE
            </div>

          <div className="terrain-label terrain-label-two">
  <span />
  MONITORING ACTIVE
</div>

<div className="hero-real-terrain">

 <img
  src="/images/prototype.jpeg"
  alt="LandSafe AI 3D terrain risk visualization"
  className="hero-terrain-image"
/>

  <div className="terrain-image-overlay" />

  <div className="terrain-data-panel">

    <div className="terrain-data-item">
      <span>RISK PROBABILITY</span>
      <strong className="risk-value">82%</strong>
    </div>

    <div className="terrain-data-item">
      <span>ELEVATION</span>
      <strong>1,245 m</strong>
    </div>

    <div className="terrain-data-item">
      <span>RAINFALL / 24H</span>
      <strong>182 mm</strong>
    </div>

  </div>

</div>

            <div className="hero-terrain-footer">
              <span>
                RUDRAPRAYAG · UTTARAKHAND
              </span>

              <span>
                3D GEO ENGINE
              </span>
            </div>

          </motion.div>

          <button
            className="scroll-cue"
            onClick={() =>
              scrollTo("problem")
            }
          >

            <span>
              SCROLL TO EXPLORE
            </span>

            <ArrowDown size={16} />

          </button>

        </section>

        {/* =================================================
            PROBLEM
        ================================================= */}

        <section
          id="problem"
          className="ls-section problem-section"
        >

          <div className="section-glow" />

          <Reveal className="section-heading">

            <span className="eyebrow red">
              THE CHALLENGE
            </span>

            <h2>
              When the mountain moves,
              <span>
                {" "}every second matters.
              </span>
            </h2>

            <p>
              Landslides can evolve quickly
              while conventional monitoring
              can leave decision-makers without
              a unified view of terrain,
              rainfall and risk.
            </p>

          </Reveal>

          <div className="problem-grid">

            <Reveal className="problem-copy">

              <div className="problem-icon">
                <ShieldAlert size={28} />
              </div>

              <h3>
                From scattered data to
                actionable intelligence.
              </h3>

              <p>
                LandSafe AI brings elevation,
                slope and rainfall-driven
                prediction into one interactive
                geospatial experience. Instead
                of treating terrain as a flat map,
                it turns the landscape into a
                system that can be inspected in 3D.
              </p>

              <div className="problem-points">

                <div>
                  <CheckCircle2 size={17} />
                  Terrain-aware risk analysis
                </div>

                <div>
                  <CheckCircle2 size={17} />
                  Machine-learning prediction pipeline
                </div>

                <div>
                  <CheckCircle2 size={17} />
                  Designed for early-warning workflows
                </div>

              </div>

            </Reveal>

            <Reveal
              className="impact-infographic"
              delay={0.12}
            >

              <div className="impact-map">

                <div className="impact-contour contour-1" />
                <div className="impact-contour contour-2" />
                <div className="impact-contour contour-3" />

                <div className="impact-hotspot hotspot-a">
                  <span />
                </div>

                <div className="impact-hotspot hotspot-b">
                  <span />
                </div>

                <div className="impact-hotspot hotspot-c">
                  <span />
                </div>

                <div className="impact-legend">

                  <span>
                    <i className="green-dot" />
                    Lower
                  </span>

                  <span>
                    <i className="gold-dot" />
                    Moderate
                  </span>

                  <span>
                    <i className="red-dot" />
                    High
                  </span>

                </div>

              </div>

              <div className="infographic-caption">
                <span>
                  RISK SURFACE
                </span>

                <strong>
                  Terrain × Environment × AI
                </strong>
              </div>

            </Reveal>

          </div>

          <div className="stat-strip">

            <Reveal>
              <strong>
                <Counter value="3" />D
              </strong>

              <span>
                Terrain intelligence
              </span>
            </Reveal>

            <Reveal delay={0.08}>
              <strong>
                <Counter value="4" />
              </strong>

              <span>
                Core prediction inputs
              </span>
            </Reveal>

            <Reveal delay={0.16}>
              <strong>
                <Counter value="100" />
                <small>%</small>
              </strong>

              <span>
                Interactive inspection
              </span>
            </Reveal>

            <Reveal delay={0.24}>
              <strong>
                <Counter value="1" />
                <small> API</small>
              </strong>

              <span>
                Prediction service
              </span>
            </Reveal>

          </div>

        </section>

        {/* =================================================
            HOW IT WORKS
        ================================================= */}

        <section
          id="workflow"
          className="ls-section workflow-section"
        >

          <Reveal
            className="section-heading center"
          >

            <span className="eyebrow cyan">
              THE ENGINE
            </span>

            <h2>
              From raw terrain to
              <span>
                {" "}early warning.
              </span>
            </h2>

            <p>
              Four connected stages turn
              environmental data into an
              inspectable risk surface.
            </p>

          </Reveal>

          <div className="workflow">

            {steps.map((step, index) => {

              const Icon = step.icon;

              return (
                <React.Fragment
                  key={step.number}
                >

                  <Reveal
                    className={`workflow-card ${step.accent}`}
                    delay={index * 0.08}
                  >

                    <div className="step-top">

                      <span className="step-number">
                        {step.number}
                      </span>

                      <Icon size={25} />

                    </div>

                    <h3>
                      {step.title}
                    </h3>

                    <p>
                      {step.text}
                    </p>

                  </Reveal>

                  {index <
                    steps.length - 1 && (
                    <div className="workflow-connector">
                      <ArrowRight size={18} />
                    </div>
                  )}

                </React.Fragment>
              );
            })}

          </div>

        </section>

        {/* =================================================
            FEATURES
        ================================================= */}

        <section
          id="features"
          className="ls-section features-section"
        >

          <Reveal className="section-heading">

            <span className="eyebrow teal">
              LIVE CAPABILITIES
            </span>

            <h2>
              See the intelligence
              <span>
                {" "}inside the terrain.
              </span>
            </h2>

            <p>
              Designed to make complex
              geospatial signals understandable
              at a glance.
            </p>

          </Reveal>

          <div className="feature-grid">

            {features.map(
              (feature, index) => {

                const Icon = feature.icon;

                return (
                  <Reveal
                    key={feature.title}
                    className={`feature-card ${feature.accent}`}
                    delay={index * 0.06}
                  >

                    <div className="feature-head">

                      <div className="feature-icon">
                        <Icon size={21} />
                      </div>

                      <span>
                        0{index + 1}
                      </span>

                    </div>

                    <div className="feature-visual">
                      {feature.visual}
                    </div>

                    <h3>
                      {feature.title}
                    </h3>

                    <p>
                      {feature.text}
                    </p>

                    <div className="feature-bullets">

                      {feature.bullets.map(
                        (bullet) => (
                          <span
                            key={bullet}
                          >
                            <CheckCircle2
                              size={14}
                            />
                            {bullet}
                          </span>
                        )
                      )}

                    </div>

                  </Reveal>
                );
              }
            )}

          </div>

        </section>

        {/* =================================================
            ARCHITECTURE
        ================================================= */}

        <section
          id="architecture"
          className="ls-section architecture-section"
        >

          <Reveal
            className="section-heading center"
          >

            <span className="eyebrow gold">
              TECHNICAL ARCHITECTURE
            </span>

            <h2>
              Built with
              <span>
                {" "}serious engineering.
              </span>
            </h2>

            <p>
              A modular pipeline connects
              the frontend, geospatial processing
              and prediction service.
            </p>

          </Reveal>

          <div className="architecture-shell">

            <div className="architecture-core">

              <div className="core-pulse" />

              <BrainCircuit size={30} />

              <strong>
                LandSafe AI
              </strong>

              <span>
                Geospatial Risk Engine
              </span>

            </div>

            <div className="architecture-lines">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>

            <div className="tech-grid">

              {tech.map(
                (item, index) => {

                  const Icon = item.icon;

                  return (
                    <Reveal
                      key={item.name}
                      className="tech-node"
                      delay={index * 0.05}
                    >

                      <div className="tech-node-icon">
                        <Icon size={21} />
                      </div>

                      <div>

                        <span>
                          {item.type}
                        </span>

                        <strong>
                          {item.name}
                        </strong>

                      </div>

                    </Reveal>
                  );
                }
              )}

            </div>

          </div>

          <div className="architecture-pipeline">

            <span>DEM</span>
            <b>→</b>

            <span>
              Terrain Processing
            </span>

            <b>→</b>

            <span>
              Feature Vector
            </span>

            <b>→</b>

            <span>
              Random Forest
            </span>

            <b>→</b>

            <span>
              FastAPI
            </span>

            <b>→</b>

            <span>
              3D Risk View
            </span>

          </div>

        </section>

        {/* =================================================
            METRICS
        ================================================= */}

        <section className="ls-section metrics-section">

          <Reveal
            className="section-heading center"
          >

            <span className="eyebrow cyan">
              AT A GLANCE
            </span>

            <h2>
              One system.
              <span>
                {" "}Multiple signals.
              </span>
            </h2>

          </Reveal>

          <div className="metrics-grid">

            <Reveal className="metric-card cyan">

              <Target size={22} />

              <strong>
                82
                <small>%</small>
              </strong>

              <span>
                Demo risk metric
              </span>

            </Reveal>

            <Reveal
              className="metric-card teal"
              delay={0.08}
            >

              <Mountain size={22} />

              <strong>
                1,245
                <small>m</small>
              </strong>

              <span>
                Example elevation
              </span>

            </Reveal>

            <Reveal
              className="metric-card gold"
              delay={0.16}
            >

              <Zap size={22} />

              <strong>
                Real
                <span>-Time</span>
              </strong>

              <span>
                Prediction workflow
              </span>

            </Reveal>

            <Reveal
              className="metric-card red"
              delay={0.24}
            >

              <Globe2 size={22} />

              <strong>
                3D
              </strong>

              <span>
                Interactive visualization
              </span>

            </Reveal>

          </div>

        </section>

        {/* =================================================
            IMPACT
        ================================================= */}

        <section
          id="impact"
          className="ls-section why-section"
        >

          <div className="why-backdrop">
            <TerrainVisual large />
          </div>

          <div className="why-overlay" />

          <Reveal
            className="section-heading center"
          >

            <span className="eyebrow teal">
              WHY LANDSAFE AI
            </span>

            <h2>
              Engineering that points toward
              <span>
                {" "}action.
              </span>
            </h2>

          </Reveal>

          <div className="why-grid">

            <Reveal className="why-card">

              <div className="why-icon cyan">
                <Mountain />
              </div>

              <h3>
                Terrain-first intelligence
              </h3>

              <p>
                Interactive 3D terrain keeps
                the geography visible instead
                of hiding risk inside a table.
              </p>

            </Reveal>

            <Reveal
              className="why-card"
              delay={0.1}
            >

              <div className="why-icon gold">
                <BrainCircuit />
              </div>

              <h3>
                ML-driven predictions
              </h3>

              <p>
                Environmental features are
                passed through a Random Forest
                classification workflow.
              </p>

            </Reveal>

            <Reveal
              className="why-card"
              delay={0.2}
            >

              <div className="why-icon red">
                <BellRing />
              </div>

              <h3>
                Actionable monitoring
              </h3>

              <p>
                The architecture is designed
                around risk visibility and
                early-warning decision support.
              </p>

            </Reveal>

          </div>

          <div className="sih-banner">

            <div>

              <span className="eyebrow cyan">
                SMART INDIA HACKATHON
              </span>

              <h3>
                Solving India's challenge
                with a geospatial AI workflow.
              </h3>

              <p>
                LandSafe AI connects terrain
                data, machine learning and
                visualization into a prototype
                built for real-world
                disaster-management scenarios.
              </p>

            </div>

            <ShieldCheck size={44} />

          </div>

        </section>

        {/* =================================================
            TEAM / SIH
        ================================================= */}

        <section className="ls-section team-section">

          <Reveal className="team-card">

            <div>

              <span className="eyebrow gold">
                BUILT FOR SIH
              </span>

              <h2>
                Built by innovators
                <span>
                  {" "}for Smart India Hackathon.
                </span>
              </h2>

              <p>
                A focused prototype combining
                frontend engineering, geospatial
                processing, machine learning
                and deployment.
              </p>

            </div>

            <div className="team-stack">

              <span>
                <Code2 />
                Frontend
              </span>

              <span>
                <BrainCircuit />
                ML
              </span>

              <span>
                <Map />
                Geospatial
              </span>

              <span>
                <Radio />
                Deployment
              </span>

            </div>

          </Reveal>

        </section>

        {/* =================================================
            CTA
        ================================================= */}

        <section className="ls-cta">

          <div className="cta-grid" />

          <Reveal className="cta-inner">

            <span className="eyebrow cyan">
              EARLY WARNING STARTS WITH VISIBILITY
            </span>

            <h2>
              Ready to predict the
              <span>
                {" "}unpredictable?
              </span>
            </h2>

            <p>
              Explore the live terrain engine
              and see how LandSafe AI turns
              environmental data into spatial
              risk intelligence.
            </p>

            <div className="cta-actions">

              <button
                className="btn btn-primary"
                onClick={goDashboard}
              >
                View Live Dashboard
                <ArrowRight size={18} />
              </button>

              <a
                className="btn btn-outline"
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
              >
                Explore Code on GitHub
                <GitBranch size={18} />
              </a>

              <button
                className="text-cta"
                onClick={() =>
                  scrollTo("architecture")
                }
              >
                Read Technical Docs
                <ArrowDown size={16} />
              </button>

            </div>

          </Reveal>

        </section>

      </main>

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="ls-footer">

        <div className="footer-brand">

          <div className="ls-brand static">

            <span className="brand-mark">
              <Mountain size={20} />
            </span>

            <span>
              LandSafe <b>AI</b>
            </span>

          </div>

          <p>
            3D geospatial intelligence
            for landslide risk monitoring.
          </p>

        </div>

        <div className="footer-links">

          <button
            onClick={() =>
              scrollTo("problem")
            }
          >
            Problem
          </button>

          <button
            onClick={() =>
              scrollTo("features")
            }
          >
            Features
          </button>

          <button
            onClick={() =>
              scrollTo("workflow")
            }
          >
            How It Works
          </button>

          <button
            onClick={() =>
              scrollTo("architecture")
            }
          >
            Technology
          </button>

          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>

        </div>

        <div className="footer-bottom">

          <span>
            © 2026 LandSafe AI · Smart India Hackathon
          </span>

          <span>
            Built for safer, smarter terrain monitoring.
          </span>

        </div>

      </footer>

    </div>
  );
}