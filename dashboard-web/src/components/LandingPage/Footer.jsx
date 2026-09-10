import './Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>NER Landslide</h3>
            <p>AI-powered early warning system for landslide monitoring in Northeast India.</p>
          </div>

          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul className="footer-links">
              <li><a href="#home">Home</a></li>
              <li><a href="#about">About</a></li>
              <li><a href="#features">Features</a></li>
              <li><a href="#how-it-works">How It Works</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Legal</h4>
            <ul className="footer-links">
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#terms">Terms of Service</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-divider"></div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} NER Landslide Early Warning System. All rights reserved.</p>
          <p>Built for Smart India Hackathon 2026</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;