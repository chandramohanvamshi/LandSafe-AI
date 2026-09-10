import { forwardRef } from 'react';
import './HowItWorks.css';

const HowItWorks = forwardRef((props, ref) => {
  const steps = [
    {
      number: 1,
      title: 'Select Location',
      description: 'Choose an area of interest on the interactive 3D terrain map to begin analysis.',
    },
    {
      number: 2,
      title: 'Gather Data',
      description: 'System collects real-time environmental data: elevation, slope, rainfall, and soil moisture.',
    },
    {
      number: 3,
      title: 'AI Analysis',
      description: 'Machine learning model analyzes multiple risk factors using advanced prediction algorithms.',
    },
    {
      number: 4,
      title: 'Risk Assessment',
      description: 'Comprehensive risk score generated with detailed breakdown of contributing factors.',
    },
    {
      number: 5,
      title: 'Early Warning',
      description: 'Automated alerts sent to authorities and communities for timely emergency response.',
    },
  ];

  return (
    <section ref={ref} className="how-it-works">
      <div className="how-it-works-container">
        <div className="how-it-works-header">
          <h2>How It Works</h2>
          <p>Five-step process for landslide risk monitoring</p>
        </div>

        <div className="steps-timeline">
          {steps.map((step, index) => (
            <div key={step.number} className="step-item">
              <div className="step-number">{step.number}</div>
              <div className="step-content">
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
              </div>
              {index < steps.length - 1 && <div className="step-connector"></div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

HowItWorks.displayName = 'HowItWorks';

export default HowItWorks;