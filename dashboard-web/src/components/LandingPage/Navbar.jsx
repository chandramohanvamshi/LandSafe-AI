import { useEffect, useState } from "react";
import {
  Mountain,
  Menu,
  X,
} from "lucide-react";

import "./Navbar.css";

function Navbar({ onNavigate }) {

  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

const navItems = [
  {
    id: "home",
    label: "Home",
  },
  {
    id: "about",
    label: "About",
  },
  {
    id: "recent-events",
    label: "Recent Events",
  },
  {
    id: "features",
    label: "Features",
  },
  {
    id: "how-it-works",
    label: "How It Works",
  },
];

  const handleClick = (id) => {

    setActiveSection(id);
    setMenuOpen(false);

    const element = document.getElementById(id);

    if (element) {

      const navbarHeight = 80;

      const elementPosition =
        element.getBoundingClientRect().top +
        window.scrollY -
        navbarHeight;

      window.scrollTo({
        top: elementPosition,
        behavior: "smooth",
      });

    }

    if (onNavigate) {
      onNavigate(id);
    }
  };


  /* ==========================================
     ACTIVE SECTION DETECTION
  ========================================== */

  useEffect(() => {

    const handleScroll = () => {

      const scrollPosition =
        window.scrollY + 200;

      let currentSection = "home";

      navItems.forEach((item) => {

        const element =
          document.getElementById(item.id);

        if (!element) return;

        const sectionTop =
          element.offsetTop;

        if (scrollPosition >= sectionTop) {
          currentSection = item.id;
        }

      });

      setActiveSection(currentSection);

    };

    window.addEventListener(
      "scroll",
      handleScroll,
      { passive: true }
    );

    handleScroll();

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );
    };

  }, []);


  return (

    <nav className="navbar">

      <div className="navbar-container">

        {/* LOGO */}

        <button
          className="navbar-logo"
          onClick={() => handleClick("home")}
        >

          <div className="logo-icon">
            <Mountain size={19} />
          </div>

          <span>
            LandSafe AI
          </span>

        </button>


        {/* DESKTOP NAVIGATION */}

        <div
          className="navbar-links"
          style={{
            display: "flex",
            flexDirection: "row",
          }}
        >

          {navItems.map((item, index) => (

            <button
              key={item.id}
              className={
                activeSection === item.id
                  ? "nav-link active"
                  : "nav-link"
              }
              onClick={() =>
                handleClick(item.id)
              }
              style={{
                order: index,
              }}
            >

              {item.label}

            </button>

          ))}

        </div>


        {/* MOBILE BUTTON */}

        <button
          className="mobile-menu-button"
          onClick={() =>
            setMenuOpen(!menuOpen)
          }
          aria-label="Toggle navigation"
        >

          {menuOpen ? (
            <X size={22} />
          ) : (
            <Menu size={22} />
          )}

        </button>

      </div>


      {/* MOBILE MENU */}

      {menuOpen && (

        <div className="mobile-menu">

          {navItems.map((item) => (

            <button
              key={item.id}
              className={
                activeSection === item.id
                  ? "mobile-nav-link active"
                  : "mobile-nav-link"
              }
              onClick={() =>
                handleClick(item.id)
              }
            >

              {item.label}

            </button>

          ))}

        </div>

      )}

    </nav>

  );
}

export default Navbar;