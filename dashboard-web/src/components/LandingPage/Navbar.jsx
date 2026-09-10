import { useState } from 'react';
import './Navbar.css';

function Navbar({ onNavClick, activeSection }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'features', label: 'Features' },
    { id: 'how-it-works', label: 'How It Works' },
  ];

  const handleNavClick = (id) => {
    onNavClick(id);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <span className="brand-icon">🗻</span>
          <span className="brand-text">NER Landslide</span>
        </div>

        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className="hamburger"></span>
        </button>

        <div className={`navbar-menu ${mobileMenuOpen ? 'active' : ''}`}>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-link ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;