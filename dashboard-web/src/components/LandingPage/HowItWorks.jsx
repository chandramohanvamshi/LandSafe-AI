function HowItWorks() {
  return (
    <section className="how-section">
      <div className="how-container">

        <h2>How It Works</h2>

        <p>
          LandSafe AI uses geospatial and environmental data to identify
          and predict landslide risk.
        </p>

        <div className="how-content">

          <div>
            <h3>01. Data Collection</h3>
            <p>
              Elevation, slope, and rainfall data are collected for the
              selected region.
            </p>
          </div>

          <div>
            <h3>02. Data Processing</h3>
            <p>
              The collected environmental data is processed and converted
              into the required model inputs.
            </p>
          </div>

          <div>
            <h3>03. AI Risk Prediction</h3>
            <p>
              A Random Forest machine-learning model analyzes the
              environmental parameters and predicts landslide risk.
            </p>
          </div>

          <div>
            <h3>04. Early Warning</h3>
            <p>
              The predicted risk level is displayed so vulnerable areas
              can be identified and monitored.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}

export default HowItWorks;