import { forwardRef } from 'react';
import './Features.css';

const Features = forwardRef((props, ref) => {
  const features = [
    {
      id: 1,
      icon: '🗺️',
      title: '3D Terrain Visualization',
      description: 'Interactive 3D terrain mapping with real-time elevation data for comprehensive landslide risk assessment.',
    },
    {
      id: 2,
      icon: '🤖',
      title: 'AI Risk Prediction',
      description: 'Advanced machine learning models analyze slope, rainfall, and soil moisture to predict landslide probability.',
    },
    {
      id: 3,
      icon: '⚠️',
      title: 'Early Warning System',
      description: 'Automated alerts and notifications to authorities for timely emergency response and community protection.',
    },
    {
      id: 4,
      icon: '📊',
      title: 'Data Integration',
      description: 'Real-time integration with environmental monitoring stations and weather data sources.',
    },
  ];

  return (
    <section ref={ref} className="features">
      <div className="features-container">
        <div className="features-header">
          <h2>Core Features</h2>
          <p>Advanced capabilities designed for landslide risk management</p>
        </div>

        <div className="features-grid">
          {features.map((feature) => (
            <div key={feature.id} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

Features.displayName = 'Features';

export default Features;