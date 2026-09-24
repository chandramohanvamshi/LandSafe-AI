import { useRef } from "react";

import Navbar from "../components/LandingPage/Navbar";
import Hero from "../components/LandingPage/Hero";
import RecentLandslides from "../components/LandingPage/RecentLandslides";
import Features from "../components/LandingPage/Features";
import HowItWorks from "../components/LandingPage/HowItWorks";
import CTA from "../components/LandingPage/CTA";
import Footer from "../components/LandingPage/Footer";

import "../styles/LandingPage.css";



function LandingPage() {

  const heroRef = useRef(null);
  const recentRef = useRef(null);
  const featuresRef = useRef(null);
  const howItWorksRef = useRef(null);


  const scrollToSection = (section) => {

    let target = null;


    /* =========================================
       HOME
    ========================================= */

    if (section === "home") {
      target = heroRef.current;
    }


    /* =========================================
       ABOUT
       
       Currently points to the System
       Capabilities section because there is
       no separate About component.
    ========================================= */

    if (section === "about") {
      target = featuresRef.current;
    }


    /* =========================================
       RECENT EVENTS
    ========================================= */

    if (section === "recent-events") {
      target = recentRef.current;
    }


    /* =========================================
       FEATURES
    ========================================= */

    if (section === "features") {
      target = featuresRef.current;
    }


    /* =========================================
       HOW IT WORKS
    ========================================= */

    if (section === "how-it-works") {
      target = howItWorksRef.current;
    }


    /* =========================================
       SMOOTH SCROLL
    ========================================= */

    if (target) {

      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

    }

  };


  return (

    <div className="landing-page">


      {/* =========================================
          NAVBAR
      ========================================= */}

      <Navbar
        onNavigate={scrollToSection}
      />


      {/* =========================================
          HERO
      ========================================= */}

      <div
        ref={heroRef}
        id="home"
      >

        <Hero
          onLaunch={() =>
            scrollToSection("features")
          }
        />

      </div>


      {/* =========================================
          RECENT LANDSLIDE EVENTS
      ========================================= */}

      <div
        ref={recentRef}
        id="recent-events"
      >

        <RecentLandslides />

      </div>


      {/* =========================================
          SYSTEM CAPABILITIES
      ========================================= */}

      <div
        ref={featuresRef}
        id="features"
      >

        <Features />

      </div>


      {/* =========================================
          HOW IT WORKS
      ========================================= */}

      <div
        ref={howItWorksRef}
        id="how-it-works"
      >

        <HowItWorks />

      </div>


      {/* =========================================
          CTA
      ========================================= */}

      <CTA />


      {/* =========================================
          FOOTER
      ========================================= */}

      <Footer />


    </div>

  );

}


export default LandingPage;