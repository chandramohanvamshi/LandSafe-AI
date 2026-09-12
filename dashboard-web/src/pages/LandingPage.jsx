import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/LandingPage/Navbar";
import Hero from "../components/LandingPage/Hero";
import Features from "../components/LandingPage/Features";
import HowItWorks from "../components/LandingPage/HowItWorks";
import CTA from "../components/LandingPage/CTA";
import Footer from "../components/LandingPage/Footer";

import "../styles/LandingPage.css";

function LandingPage() {
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("home");

  // Section references
  const heroRef = useRef(null);
  const aboutRef = useRef(null);
  const featuresRef = useRef(null);
  const howItWorksRef = useRef(null);

  // =========================================
  // NAVIGATION
  // =========================================

  const handleNavClick = (section) => {
    setActiveSection(section);

    const refs = {
      home: heroRef,
      about: aboutRef,
      features: featuresRef,
      "how-it-works": howItWorksRef,
    };

    const targetRef = refs[section];

    if (targetRef?.current) {
      targetRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  // =========================================
  // DASHBOARD
  // =========================================

  const handleLaunchDashboard = () => {
    navigate("/dashboard");
  };

  // =========================================
  // PAGE
  // =========================================

  return (
    <div className="landing-page">

      {/* =====================================
          NAVBAR
          ===================================== */}

      <Navbar
        onNavClick={handleNavClick}
        activeSection={activeSection}
      />


      {/* =====================================
          HOME / HERO
          ===================================== */}

      <section
        id="home"
        ref={heroRef}
      >
        <Hero
          onLaunch={handleLaunchDashboard}
        />
      </section>


      {/* =====================================
          ABOUT
          ===================================== */}

      <section
        id="about"
        ref={aboutRef}
        className="about-section"
      >
        <div className="about-container">

          {/* About Heading */}

          <div className="about-heading">

            <span className="about-label">
              WHY LANDSAFE AI?
            </span>

            <h2>
              Turning Environmental Data
              <span> Into Risk Intelligence</span>
            </h2>

            <p>
              LandSafe AI combines terrain information and rainfall
              data with machine learning to assess landslide risk
              and provide a clear visual understanding of vulnerable
              areas.
            </p>

          </div>


          {/* About Cards */}

          <div className="about-grid">

            {/* Challenge */}

            <div className="about-card problem-card">

              <div className="about-icon">
                ⚠️
              </div>

              <h3>
                The Challenge
              </h3>

              <p>
                Landslide-prone regions can experience rapidly
                changing environmental conditions. Identifying
                vulnerable areas early can support better
                preparedness and response.
              </p>

              <div className="challenge-list">

                <div>
                  ● Heavy rainfall
                </div>

                <div>
                  ● Steep terrain
                </div>

                <div>
                  ● Slope instability
                </div>

                <div>
                  ● Difficult monitoring
                </div>

              </div>

            </div>


            {/* Solution */}

            <div className="about-card solution-card">

              <div className="about-icon">
                🤖
              </div>

              <h3>
                Our Approach
              </h3>

              <p>
                Our system processes terrain and rainfall
                information and uses a Random Forest machine
                learning model to estimate landslide risk.
              </p>

              <div className="solution-flow">

                <span>
                  Terrain
                </span>

                <b>
                  →
                </b>

                <span>
                  Rainfall
                </span>

                <b>
                  →
                </b>

                <span>
                  AI
                </span>

                <b>
                  →
                </b>

                <span>
                  Risk
                </span>

              </div>

            </div>

          </div>


          {/* =================================
              TECHNOLOGY STRIP
              ================================= */}

          <div className="about-tech">

            <div className="tech-item">

              <strong>
                SRTM
              </strong>

              <span>
                Elevation Data
              </span>

            </div>


            <div className="tech-line"></div>


            <div className="tech-item">

              <strong>
                GIS
              </strong>

              <span>
                Terrain Processing
              </span>

            </div>


            <div className="tech-line"></div>


            <div className="tech-item">

              <strong>
                RF
              </strong>

              <span>
                Machine Learning
              </span>

            </div>


            <div className="tech-line"></div>


            <div className="tech-item">

              <strong>
                API
              </strong>

              <span>
                Risk Delivery
              </span>

            </div>

          </div>

        </div>
      </section>


      {/* =====================================
          FEATURES
          ===================================== */}

      <section
        id="features"
        ref={featuresRef}
      >
        <Features />
      </section>


      {/* =====================================
          HOW IT WORKS
          ===================================== */}

      <section
        id="how-it-works"
        ref={howItWorksRef}
      >
        <HowItWorks />
      </section>


      {/* =====================================
          CALL TO ACTION
          ===================================== */}

      <CTA
        onLaunch={handleLaunchDashboard}
      />


      {/* =====================================
          FOOTER
          ===================================== */}

      <Footer />

    </div>
  );
}

export default LandingPage;