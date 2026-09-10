import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/LandingPage/Navbar';
import Hero from '../components/LandingPage/Hero';
import Features from '../components/LandingPage/Features';
import HowItWorks from '../components/LandingPage/HowItWorks';
import CTA from '../components/LandingPage/CTA';
import Footer from '../components/LandingPage/Footer';
import '../styles/LandingPage.css';

function LandingPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('home');
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const howItWorksRef = useRef(null);
  const ctaRef = useRef(null);

  const handleNavClick = (section) => {
    setActiveSection(section);
    const refs = {
      home: heroRef,
      about: featuresRef,
      features: featuresRef,
      'how-it-works': howItWorksRef,
    };

    if (refs[section]?.current) {
      refs[section].current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLaunchDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="landing-page">
      <Navbar onNavClick={handleNavClick} activeSection={activeSection} />
      <Hero ref={heroRef} onLaunch={handleLaunchDashboard} />
      <Features ref={featuresRef} />
      <HowItWorks ref={howItWorksRef} />
      <CTA ref={ctaRef} onLaunch={handleLaunchDashboard} />
      <Footer />
    </div>
  );
}

export default LandingPage;