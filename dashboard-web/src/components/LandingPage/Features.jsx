import { forwardRef } from "react";
import "./Features.css";

const Features = forwardRef((props, ref) => {
  const features = [
    {
      id: 1,
      icon: "🗺️",
      number: "01",
      title: "3D Terrain Visualization",
      description:
        "Explore terrain and elevation information through an interactive 3D visualization designed to understand vulnerable mountainous regions.",
      tags: ["SRTM DEM", "Elevation", "3D"],
    },

    {
      id: 2,
      icon: "🤖",
      number: "02",
      title: "AI Risk Prediction",
      description:
        "A Random Forest machine learning model analyzes terrain and rainfall-related features to estimate landslide risk.",
      tags: ["Random Forest", "ML", "Risk Analysis"],
    },

    {
      id: 3,
      icon: "🔥",
      number: "03",
      title: "Spatial Risk Heatmap",
      description:
        "Predicted risk is transformed into a spatial heatmap, making potentially vulnerable areas easier to identify and interpret.",
      tags: ["Risk Map", "Spatial Data", "GIS"],
    },

    {
      id: 4,
      icon: "🌧️",
      number: "04",
      title: "Environmental Data",
      description:
        "The system combines terrain information from elevation data with rainfall information to support landslide risk assessment.",
      tags: ["Rainfall", "Terrain", "Data"],
    },
  ];

  return (
    <section ref={ref} className="features">

      {/* =====================================
          HEADER
          ===================================== */}

      <div className="features-container">

        <div className="features-header">

          <span className="features-label">
            SYSTEM CAPABILITIES
          </span>

          <h2>
            Intelligence Built for
            <span> Landslide Risk Monitoring</span>
          </h2>

          <p>
            From terrain data to AI-powered risk assessment, LandSafe AI
            transforms environmental information into actionable visual
            intelligence.
          </p>

        </div>


        {/* =====================================
            DATA → AI → RISK FLOW
            ===================================== */}

        <div className="feature-flow">

          <div className="flow-item">

            <div className="flow-icon">
              🛰️
            </div>

            <div>
              <strong>DATA</strong>
              <span>Terrain + Rainfall</span>
            </div>

          </div>


          <div className="flow-arrow">
            →
          </div>


          <div className="flow-item">

            <div className="flow-icon">
              ⚙️
            </div>

            <div>
              <strong>PROCESS</strong>
              <span>Feature Preparation</span>
            </div>

          </div>


          <div className="flow-arrow">
            →
          </div>


          <div className="flow-item">

            <div className="flow-icon">
              🤖
            </div>

            <div>
              <strong>AI</strong>
              <span>Random Forest</span>
            </div>

          </div>


          <div className="flow-arrow">
            →
          </div>


          <div className="flow-item">

            <div className="flow-icon">
              📍
            </div>

            <div>
              <strong>RISK</strong>
              <span>Spatial Heatmap</span>
            </div>

          </div>

        </div>


        {/* =====================================
            FEATURE CARDS
            ===================================== */}

        <div className="features-grid">

          {features.map((feature) => (

            <div
              key={feature.id}
              className="feature-card"
            >

              {/* Card top */}

              <div className="feature-card-top">

                <span className="feature-number">
                  {feature.number}
                </span>

                <div className="feature-icon">
                  {feature.icon}
                </div>

              </div>


              {/* Content */}

              <div className="feature-content">

                <h3 className="feature-title">
                  {feature.title}
                </h3>

                <p className="feature-description">
                  {feature.description}
                </p>

              </div>


              {/* Tags */}

              <div className="feature-tags">

                {feature.tags.map((tag) => (

                  <span
                    key={tag}
                    className="feature-tag"
                  >
                    {tag}
                  </span>

                ))}

              </div>


              {/* Bottom line */}

              <div className="feature-card-line"></div>

            </div>

          ))}

        </div>


        {/* =====================================
            BOTTOM MESSAGE
            ===================================== */}

        <div className="features-bottom">

          <div className="features-bottom-icon">
            ⚡
          </div>

          <div>

            <strong>
              From Raw Data to Risk Intelligence
            </strong>

            <p>
              LandSafe AI connects geospatial processing, machine learning,
              spatial visualization, and API-based delivery into one
              monitoring workflow.
            </p>

          </div>

        </div>

      </div>

    </section>
  );
});

Features.displayName = "Features";

export default Features;