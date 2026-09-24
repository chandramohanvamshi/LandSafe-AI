import { forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import "./CTA.css";

const CTA = forwardRef((props, ref) => {
  const navigate = useNavigate();

  const handleLaunch = () => {
    navigate("/dashboard");
  };

  return (
    <section ref={ref} className="cta">

      <div className="cta-container">

        <div className="cta-content">

          <h2>
            Ready to Monitor Landslide Risk?
          </h2>

          <p>
            Start using the NER Landslide Early Warning System today
            and help protect communities in Northeast India.
          </p>

          <button
            className="cta-button"
            onClick={handleLaunch}
          >
            Launch Dashboard Now

            <span className="button-arrow">
              →
            </span>

          </button>

        </div>

      </div>

    </section>
  );
});

CTA.displayName = "CTA";

export default CTA;