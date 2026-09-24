import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import {
  MapPin,
  Mountain,
  CloudRain,
  BrainCircuit,
  ShieldAlert,
  BellRing,
  Database,
  Activity,
  CheckCircle2,
  Navigation,
  Gauge,
  Layers3,
  Radio,
  TrendingUp,
  Clock3,
  Crosshair,
} from "lucide-react";

import "./HowItWorks.css";


/* =========================================================
   RISK DATA
   ========================================================= */

const hotspots = [
  {
    id: 1,
    x: "58%",
    y: "35%",
    level: "HIGH",
    probability: "82%",
    slope: "37°",
    rainfall: "182 mm",
  },
  {
    id: 2,
    x: "31%",
    y: "61%",
    level: "MEDIUM",
    probability: "64%",
    slope: "29°",
    rainfall: "146 mm",
  },
  {
    id: 3,
    x: "72%",
    y: "65%",
    level: "LOW",
    probability: "31%",
    slope: "18°",
    rainfall: "91 mm",
  },
];


const workflowSteps = [
  {
    number: "01",
    icon: MapPin,
    title: "Select Location",
    category: "LOCATION",
    description:
      "Select the geographic region to be analyzed using the terrain monitoring interface.",
  },
  {
    number: "02",
    icon: Database,
    title: "Collect Environmental Data",
    category: "INPUT DATA",
    description:
      "Elevation, slope and rainfall observations are collected and prepared as model inputs.",
  },
  {
    number: "03",
    icon: Layers3,
    title: "Process Risk Features",
    category: "FEATURE PROCESSING",
    description:
      "Environmental measurements are transformed into structured features for machine-learning analysis.",
  },
  {
    number: "04",
    icon: BrainCircuit,
    title: "AI Risk Prediction",
    category: "MACHINE LEARNING",
    description:
      "The Random Forest classifier evaluates the environmental features and calculates landslide probability.",
  },
  {
    number: "05",
    icon: ShieldAlert,
    title: "Risk Assessment",
    category: "DECISION",
    description:
      "The predicted probability is converted into an understandable risk classification.",
  },
  {
    number: "06",
    icon: BellRing,
    title: "Early Warning",
    category: "RESPONSE",
    description:
      "Elevated-risk conditions can be surfaced as warnings for timely response and monitoring.",
  },
];


/* =========================================================
   COUNT UP HOOK
   ========================================================= */

function useCountUp(target, duration = 1800) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let startTime;
    let animationFrame;

    const animate = (timestamp) => {
      if (!startTime) {
        startTime = timestamp;
      }

      const progress = Math.min(
        (timestamp - startTime) / duration,
        1
      );

      const eased =
        1 - Math.pow(1 - progress, 3);

      setValue(Math.round(target * eased));

      if (progress < 1) {
        animationFrame =
          requestAnimationFrame(animate);
      }
    };

    animationFrame =
      requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [target, duration]);

  return value;
}


/* =========================================================
   TERRAIN MAP
   ========================================================= */

function TerrainMap() {
  const [activeHotspot, setActiveHotspot] =
    useState(1);

  return (
    <div className="how-terrain-panel">

      {/* MAP HEADER */}
      <div className="terrain-panel-header">

        <div className="terrain-title">
          <div className="terrain-title-icon">
            <Mountain size={16} />
          </div>

          <div>
            <span>LIVE TERRAIN ANALYSIS</span>
            <strong>
              RUDRAPRAYAG, UTTARAKHAND
            </strong>
          </div>
        </div>

        <div className="terrain-live-status">
          <span />
          LIVE
        </div>

      </div>


      {/* MAP */}
      <div className="terrain-map">

        <div className="terrain-image" />

        <div className="terrain-grid" />

        {/* mountain silhouettes */}
        <div className="terrain-mountain mountain-1" />
        <div className="terrain-mountain mountain-2" />
        <div className="terrain-mountain mountain-3" />

        {/* contour lines */}
        <div className="terrain-contour contour-1" />
        <div className="terrain-contour contour-2" />
        <div className="terrain-contour contour-3" />
        <div className="terrain-contour contour-4" />


        {/* LOCATION */}
        <div className="terrain-location-tag">
          <MapPin size={13} />
          ANALYZED TERRAIN
        </div>


        {/* COORDINATES */}
        <div className="terrain-coordinates">
          <span>30.2850° N</span>
          <span>78.9810° E</span>
        </div>


        {/* HOTSPOTS */}
        {hotspots.map((spot) => (
          <button
            key={spot.id}
            className={`hotspot hotspot-${spot.level.toLowerCase()} ${
              activeHotspot === spot.id
                ? "hotspot-active"
                : ""
            }`}
            style={{
              left: spot.x,
              top: spot.y,
            }}
            onMouseEnter={() =>
              setActiveHotspot(spot.id)
            }
            onClick={() =>
              setActiveHotspot(spot.id)
            }
          >

            <span className="hotspot-pulse" />
            <span className="hotspot-core" />

            <div className="hotspot-tooltip">

              <div className="tooltip-header">
                <span>
                  ZONE {String(spot.id).padStart(2, "0")}
                </span>

                <strong>
                  {spot.level}
                </strong>
              </div>

              <div className="tooltip-row">
                <span>Probability</span>
                <strong>
                  {spot.probability}
                </strong>
              </div>

              <div className="tooltip-row">
                <span>Slope</span>
                <strong>
                  {spot.slope}
                </strong>
              </div>

              <div className="tooltip-row">
                <span>Rainfall</span>
                <strong>
                  {spot.rainfall}
                </strong>
              </div>

            </div>

          </button>
        ))}


        {/* SCALE */}
        <div className="terrain-scale">
          <span>0</span>

          <div className="scale-line">
            <i />
            <i />
            <i />
          </div>

          <span>2 km</span>
        </div>


        {/* LEGEND */}
        <div className="terrain-legend">

          <div>
            <span className="legend-low" />
            LOW
          </div>

          <div>
            <span className="legend-medium" />
            MEDIUM
          </div>

          <div>
            <span className="legend-high" />
            HIGH
          </div>

        </div>


        {/* TERRAIN VALUE */}
        <div className="terrain-elevation">

          <span>ELEVATION</span>

          <strong>
            1,245
            <small> m</small>
          </strong>

        </div>


        {/* CROSSHAIR */}
        <div className="terrain-crosshair">
          <Crosshair size={17} />
        </div>

      </div>


      {/* MAP FOOTER */}
      <div className="terrain-panel-footer">

        <div>
          <Activity size={13} />
          <span>
            3 RISK ZONES DETECTED
          </span>
        </div>

        <div>
          <Navigation size={13} />
          <span>
            TERRAIN MODEL ACTIVE
          </span>
        </div>

      </div>

    </div>
  );
}


/* =========================================================
   RISK ANALYSIS
   ========================================================= */

function RiskAnalysis() {
  const risk = useCountUp(82, 1900);

  const circumference = 2 * Math.PI * 68;

  const offset =
    circumference -
    (risk / 100) * circumference;

  return (
    <div className="risk-analysis-card">

      <div className="analysis-card-header">

        <div>
          <span>PREDICTED CONDITION</span>

          <h3>
            Landslide Risk
          </h3>
        </div>

        <Activity size={18} />

      </div>


      <div className="risk-analysis-main">

        {/* GAUGE */}
        <motion.div
          className="risk-gauge"
          initial={{
            scale: 0.94,
            opacity: 0,
          }}
          animate={{
            scale: [0.94, 1.05, 1],
            opacity: 1,
          }}
          transition={{
            duration: 1.8,
            times: [0, 0.8, 1],
          }}
        >

          <svg
            viewBox="0 0 160 160"
          >

            <circle
              cx="80"
              cy="80"
              r="68"
              className="gauge-track"
            />

            <motion.circle
              cx="80"
              cy="80"
              r="68"
              className="gauge-progress"
              strokeDasharray={circumference}
              animate={{
                strokeDashoffset: offset,
              }}
              transition={{
                duration: 1.9,
                ease: "easeOut",
              }}
            />

          </svg>


          <div className="gauge-center">

            <strong>
              {risk}%
            </strong>

            <span>
              PROBABILITY
            </span>

          </div>

        </motion.div>


        {/* DESCRIPTION */}
        <div className="risk-information">

          <div className="high-risk-badge">
            <ShieldAlert size={15} />
            HIGH RISK
          </div>

          <p>
            Current environmental conditions indicate
            elevated landslide susceptibility in the
            analyzed terrain.
          </p>


          <motion.div
            className="confidence-box"
            initial={{
              opacity: 0,
              x: 30,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              delay: 1.4,
              duration: 0.6,
            }}
          >

            <div>
              <span>
                MODEL CONFIDENCE
              </span>

              <strong>
                94.2%
              </strong>
            </div>

            <CheckCircle2 size={17} />

          </motion.div>


          <div className="prediction-time">

            <Clock3 size={13} />

            <span>
              PREDICTION TIMESTAMP
            </span>

            <strong>
              12:42:58
            </strong>

          </div>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   RANDOM FOREST MODEL
   ========================================================= */

function ModelAnalysis() {
  return (
    <div className="model-analysis-card">

      <div className="model-card-header">

        <div>
          <span>
            MACHINE LEARNING MODEL
          </span>

          <h3>
            Random Forest Analysis
          </h3>
        </div>

        <div className="model-active">
          <span />
          ACTIVE
        </div>

      </div>


      {/* MODEL VISUAL */}
      <div className="model-visual">

        <div className="model-input-list">

          <div className="model-input-item">
            <span>01</span>
            <div>
              <small>ELEVATION</small>
              <strong>1,245 m</strong>
            </div>
          </div>

          <div className="model-input-item">
            <span>02</span>
            <div>
              <small>SLOPE</small>
              <strong>37°</strong>
            </div>
          </div>

          <div className="model-input-item">
            <span>03</span>
            <div>
              <small>RAINFALL 24H</small>
              <strong>182 mm</strong>
            </div>
          </div>

          <div className="model-input-item">
            <span>04</span>
            <div>
              <small>RAINFALL 72H</small>
              <strong>314 mm</strong>
            </div>
          </div>

        </div>


        {/* RF CORE */}
        <div className="rf-core">

          <div className="rf-ring rf-ring-one" />
          <div className="rf-ring rf-ring-two" />

          <div className="rf-center">

            <BrainCircuit size={24} />

            <strong>
              RF
            </strong>

            <small>
              100 TREES
            </small>

          </div>

        </div>


        {/* OUTPUT */}
        <div className="model-output">

          <span>
            MODEL OUTPUT
          </span>

          <strong>
            82%
          </strong>

          <div>
            <ShieldAlert size={12} />
            HIGH RISK
          </div>

          <small>
            Probability
          </small>

        </div>

      </div>


      {/* STATS */}
      <div className="model-stats">

        <div className="model-stat">
          <span>MODEL</span>
          <strong>Random Forest</strong>
        </div>

        <div className="model-stat">
          <span>ESTIMATORS</span>
          <strong>100</strong>
        </div>

        <div className="model-stat">
          <span>FEATURES</span>
          <strong>04</strong>
        </div>

        <div className="model-stat">
          <span>OUTPUT</span>
          <strong>Probability</strong>
        </div>

      </div>

    </div>
  );
}


/* =========================================================
   RISK TREND
   ========================================================= */

function RiskTrend() {
  return (
    <div className="risk-trend-card">

      <div className="trend-header">

        <div>
          <span>RISK TREND</span>

          <h3>
            7-day environmental risk progression
          </h3>
        </div>

        <div className="trend-current">
          <TrendingUp size={14} />
          <strong>+37%</strong>
          <span>7 DAYS</span>
        </div>

      </div>


      <div className="trend-chart">

        <div className="trend-y-axis">
          <span>100</span>
          <span>75</span>
          <span>50</span>
          <span>25</span>
          <span>0</span>
        </div>


        <div className="trend-graph">

          <div className="trend-grid-line" />
          <div className="trend-grid-line" />
          <div className="trend-grid-line" />
          <div className="trend-grid-line" />


          <svg
            viewBox="0 0 700 210"
            preserveAspectRatio="none"
            className="trend-svg"
          >

            <defs>

              <linearGradient
                id="trendFill"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >

                <stop
                  offset="0%"
                  stopColor="#ff5555"
                  stopOpacity="0.26"
                />

                <stop
                  offset="100%"
                  stopColor="#ff5555"
                  stopOpacity="0"
                />

              </linearGradient>

            </defs>


            <motion.path
              className="trend-fill"
              d="
                M0 150
                C80 142 100 137 150 130
                C210 122 240 116 300 108
                C355 100 390 95 445 82
                C505 69 550 61 590 48
                C630 38 665 31 700 22
                L700 210
                L0 210
                Z
              "
              initial={{
                opacity: 0,
              }}
              whileInView={{
                opacity: 1,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                duration: 1.2,
              }}
            />


            <motion.path
              className="trend-line"
              d="
                M0 150
                C80 142 100 137 150 130
                C210 122 240 116 300 108
                C355 100 390 95 445 82
                C505 69 550 61 590 48
                C630 38 665 31 700 22
              "
              initial={{
                pathLength: 0,
              }}
              whileInView={{
                pathLength: 1,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                duration: 1.8,
                ease: "easeOut",
              }}
            />

          </svg>


          {/* DATA POINTS */}

          <div
            className="trend-point"
            style={{ left: "0%", top: "71%" }}
          >
            <span>45%</span>
          </div>

          <div
            className="trend-point"
            style={{ left: "16%", top: "62%" }}
          >
            <span>51%</span>
          </div>

          <div
            className="trend-point"
            style={{ left: "33%", top: "54%" }}
          >
            <span>58%</span>
          </div>

          <div
            className="trend-point"
            style={{ left: "50%", top: "45%" }}
          >
            <span>62%</span>
          </div>

          <div
            className="trend-point"
            style={{ left: "67%", top: "32%" }}
          >
            <span>70%</span>
          </div>

          <div
            className="trend-point"
            style={{ left: "83%", top: "23%" }}
          >
            <span>77%</span>
          </div>

          <div
            className="trend-point trend-final"
            style={{ left: "100%", top: "10%" }}
          >
            <span>82%</span>
          </div>


          <div className="trend-x-axis">
            <span>SEP 18</span>
            <span>SEP 19</span>
            <span>SEP 20</span>
            <span>SEP 21</span>
            <span>SEP 22</span>
            <span>SEP 23</span>
            <span>SEP 24</span>
          </div>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   WORKFLOW
   ========================================================= */

function Workflow() {
  return (
    <div className="workflow-section">

      <div className="workflow-heading">

        <div>
          <span>COMPLETE SYSTEM PIPELINE</span>

          <h3>
            How LandSafe AI processes a risk event
          </h3>
        </div>

        <div className="workflow-status">
          <span />
          SYSTEM OPERATIONAL
        </div>

      </div>


      <div className="workflow-list">

        {workflowSteps.map((step, index) => {

          const Icon = step.icon;

          return (
            <motion.div
              className="workflow-item"
              key={step.number}
              initial={{
                opacity: 0,
                y: 25,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                delay: index * 0.08,
                duration: 0.5,
              }}
            >

              <div className="workflow-number">
                {step.number}
              </div>

              <div className="workflow-icon">
                <Icon size={17} />
              </div>

              <div className="workflow-content">

                <span>
                  {step.category}
                </span>

                <strong>
                  {step.title}
                </strong>

                <p>
                  {step.description}
                </p>

              </div>

              {index !== workflowSteps.length - 1 && (
                <div className="workflow-connector" />
              )}

            </motion.div>
          );

        })}

      </div>

    </div>
  );
}


/* =========================================================
   MAIN COMPONENT
   ========================================================= */

function HowItWorks() {

  return (
    <section className="how-section">

      {/* BACKGROUND */}

      <div className="how-background">

        <div className="how-grid" />

        <div className="how-glow how-glow-left" />

        <div className="how-glow how-glow-right" />

      </div>


      <div className="how-container">

        {/* PAGE HEADER */}

        <motion.div
          className="how-page-header"
          initial={{
            opacity: 0,
            y: 25,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 0.7,
          }}
        >

          <div className="how-label">

            <span />

            HOW IT WORKS

          </div>


          <h1>
            From terrain data
            <br />
            <span>to early warning.</span>
          </h1>


          <p>
            LandSafe AI combines geographic terrain data,
            rainfall conditions and machine learning to
            identify and communicate potential landslide risk.
          </p>

        </motion.div>


        {/* MAIN 60 / 40 DASHBOARD */}

        <motion.div
          className="how-dashboard"
          initial={{
            opacity: 0,
            y: 35,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 0.8,
          }}
        >

          {/* LEFT 60% */}

          <div className="dashboard-left">

            <TerrainMap />

          </div>


          {/* RIGHT 40% */}

          <div className="dashboard-right">

            <RiskAnalysis />

            <ModelAnalysis />

          </div>

        </motion.div>


        {/* RISK TREND */}

        <motion.div
          initial={{
            opacity: 0,
            y: 25,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 0.7,
          }}
        >

          <RiskTrend />

        </motion.div>


        {/* WORKFLOW */}

        <Workflow />


        {/* FOOTER STATUS */}

        <div className="how-footer">

          <div>
            <Radio size={14} />

            <span>
              LANDSAFE AI MONITORING SYSTEM
            </span>
          </div>

          <div>
            <CheckCircle2 size={14} />

            <span>
              RANDOM FOREST MODEL READY
            </span>
          </div>

          <div>
            <Gauge size={14} />

            <span>
              PROBABILITY-BASED RISK OUTPUT
            </span>
          </div>

          <div className="how-footer-location">
            <Navigation size={13} />

            RUDRAPRAYAG, UTTARAKHAND
          </div>

        </div>

      </div>

    </section>
  );
}

export default HowItWorks;