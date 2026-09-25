// import { motion } from "framer-motion";
// import {
//   Mountain,
//   BrainCircuit,
//   CloudRain,
//   Map,
//   Satellite,
//   ShieldCheck,
//   Activity,
//   Database,
//   Cpu,
//   TrendingUp,
//   Layers3,
//   Gauge,
//   Droplets,
//   Navigation,
//   AlertTriangle,
//   CheckCircle2,
// } from "lucide-react";

// import "./Features.css";

// const capabilities = [
//   {
//     number: "01",
//     icon: Mountain,
//     title: "3D Terrain Intelligence",
//     description:
//       "Digital elevation and terrain information are analyzed to identify slopes and terrain conditions associated with landslide susceptibility.",
//   },
//   {
//     number: "02",
//     icon: BrainCircuit,
//     title: "AI Risk Prediction",
//     description:
//       "A Random Forest machine-learning model combines environmental parameters to estimate landslide probability.",
//   },
//   {
//     number: "03",
//     icon: Map,
//     title: "Spatial Risk Mapping",
//     description:
//       "Predicted risk is visualized geographically so vulnerable regions can be identified and monitored.",
//   },
//   {
//     number: "04",
//     icon: CloudRain,
//     title: "Environmental Monitoring",
//     description:
//       "Rainfall, elevation and slope information are combined to continuously evaluate changing environmental conditions.",
//   },
// ];

// const metrics = [
//   {
//     label: "ELEVATION",
//     value: "1,245",
//     unit: "m",
//     icon: Mountain,
//   },
//   {
//     label: "SLOPE",
//     value: "37",
//     unit: "°",
//     icon: TrendingUp,
//   },
//   {
//     label: "24H RAINFALL",
//     value: "182",
//     unit: "mm",
//     icon: CloudRain,
//   },
//   {
//     label: "72H RAINFALL",
//     value: "314",
//     unit: "mm",
//     icon: Droplets,
//   },
// ];

// const pipeline = [
//   {
//     icon: Satellite,
//     title: "Terrain Data",
//     text: "Elevation & terrain",
//   },
//   {
//     icon: Layers3,
//     title: "Feature Extraction",
//     text: "Slope & rainfall",
//   },
//   {
//     icon: Database,
//     title: "Data Processing",
//     text: "Validated inputs",
//   },
//   {
//     icon: BrainCircuit,
//     title: "Random Forest",
//     text: "100 estimators",
//   },
//   {
//     icon: ShieldCheck,
//     title: "Risk Prediction",
//     text: "Probability output",
//   },
// ];

// function RiskChart() {
//   return (
//     <div className="risk-chart">
//       <div className="chart-header">
//         <div>
//           <span className="chart-label">RISK TREND</span>
//           <strong>Environmental response</strong>
//         </div>

//         <span className="chart-period">24H</span>
//       </div>

//       <div className="chart-area">
//         <div className="chart-y">
//           <span>100</span>
//           <span>75</span>
//           <span>50</span>
//           <span>25</span>
//           <span>0</span>
//         </div>

//         <div className="chart-main">
//           <div className="chart-grid">
//             <span />
//             <span />
//             <span />
//             <span />
//             <span />
//           </div>

//           <svg
//             className="risk-line"
//             viewBox="0 0 600 190"
//             preserveAspectRatio="none"
//           >
//             <defs>
//               <linearGradient
//                 id="riskGradient"
//                 x1="0"
//                 y1="0"
//                 x2="0"
//                 y2="1"
//               >
//                 <stop offset="0%" stopColor="#ef4444" stopOpacity="0.28" />
//                 <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
//               </linearGradient>
//             </defs>

//             <path
//               className="chart-fill"
//               d="
//                 M0,155
//                 C45,150 55,138 90,143
//                 C125,148 130,125 165,130
//                 C205,137 220,108 255,112
//                 C290,116 300,92 335,100
//                 C370,108 385,80 420,84
//                 C455,89 470,63 505,68
//                 C545,73 560,40 600,30
//                 L600,190
//                 L0,190
//                 Z
//               "
//             />

//             <path
//               className="chart-line"
//               d="
//                 M0,155
//                 C45,150 55,138 90,143
//                 C125,148 130,125 165,130
//                 C205,137 220,108 255,112
//                 C290,116 300,92 335,100
//                 C370,108 385,80 420,84
//                 C455,89 470,63 505,68
//                 C545,73 560,40 600,30
//               "
//             />

//             <circle cx="600" cy="30" r="5" className="chart-point" />
//           </svg>

//           <div className="chart-x">
//             <span>00:00</span>
//             <span>06:00</span>
//             <span>12:00</span>
//             <span>18:00</span>
//             <span>NOW</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// function FeatureMap() {
//   return (
//     <div className="feature-map">
//       <div className="map-image" />

//       <div className="map-overlay-grid" />

//       <div className="map-topbar">
//         <div className="map-location">
//           <Navigation size={13} />
//           <span>RUDRAPRAYAG, UK</span>
//         </div>

//         <div className="map-live">
//           <span />
//           LIVE TERRAIN
//         </div>
//       </div>

//       <div className="contour contour-one" />
//       <div className="contour contour-two" />
//       <div className="contour contour-three" />

//       <div className="risk-zone zone-one">
//         <span className="zone-pulse" />
//       </div>

//       <div className="risk-zone zone-two">
//         <span className="zone-pulse" />
//       </div>

//       <div className="risk-zone zone-three">
//         <span className="zone-pulse" />
//       </div>

//       <div className="map-marker marker-one">
//         <span />
//         <small>37°</small>
//       </div>

//       <div className="map-marker marker-two">
//         <span />
//         <small>42°</small>
//       </div>

//       <div className="map-marker marker-three">
//         <span />
//         <small>29°</small>
//       </div>

//       <div className="map-scale">
//         <span>0</span>
//         <i />
//         <span>2 km</span>
//       </div>

//       <div className="map-legend">
//         <div>
//           <span className="legend-dot low" />
//           LOW
//         </div>

//         <div>
//           <span className="legend-dot medium" />
//           MEDIUM
//         </div>

//         <div>
//           <span className="legend-dot high" />
//           HIGH
//         </div>
//       </div>

//       <div className="terrain-label">
//         <span>ANALYZED TERRAIN</span>
//         <strong>1,245 m</strong>
//       </div>
//     </div>
//   );
// }

// function ModelPanel() {
//   return (
//     <div className="model-panel">
//       <div className="model-heading">
//         <div>
//           <span className="eyebrow-small">MACHINE LEARNING MODEL</span>
//           <h3>Random Forest Analysis</h3>
//         </div>

//         <div className="model-status">
//           <span />
//           ACTIVE
//         </div>
//       </div>

//       <div className="model-body">
//         <div className="model-core">
//           <div className="model-ring ring-one" />
//           <div className="model-ring ring-two" />

//           <div className="model-center">
//             <BrainCircuit size={30} />
//             <span>RF</span>
//             <small>100 TREES</small>
//           </div>
//         </div>

//         <div className="model-info">
//           <div className="model-stat">
//             <span>MODEL</span>
//             <strong>Random Forest</strong>
//           </div>

//           <div className="model-stat">
//             <span>ESTIMATORS</span>
//             <strong>100</strong>
//           </div>

//           <div className="model-stat">
//             <span>FEATURES</span>
//             <strong>04</strong>
//           </div>

//           <div className="model-stat">
//             <span>OUTPUT</span>
//             <strong>Probability</strong>
//           </div>
//         </div>
//       </div>

//       <div className="model-features">
//         <div>
//           <span>01</span>
//           Elevation
//           <b>1,245 m</b>
//         </div>

//         <div>
//           <span>02</span>
//           Slope
//           <b>37°</b>
//         </div>

//         <div>
//           <span>03</span>
//           Rainfall 24h
//           <b>182 mm</b>
//         </div>

//         <div>
//           <span>04</span>
//           Rainfall 72h
//           <b>314 mm</b>
//         </div>
//       </div>
//     </div>
//   );
// }

// function RiskResult() {
//   return (
//     <div className="risk-result">
//       <div className="risk-result-top">
//         <div>
//           <span className="eyebrow-small">PREDICTED CONDITION</span>
//           <h3>Landslide Risk</h3>
//         </div>

//         <Activity size={18} />
//       </div>

//       <div className="risk-main">
//         <div className="risk-gauge">
//           <svg viewBox="0 0 160 160">
//             <circle
//               cx="80"
//               cy="80"
//               r="62"
//               className="gauge-background"
//             />

//             <motion.circle
//               cx="80"
//               cy="80"
//               r="62"
//               className="gauge-progress"
//               initial={{ strokeDashoffset: 390 }}
//               whileInView={{ strokeDashoffset: 70 }}
//               viewport={{ once: true }}
//               transition={{
//                 duration: 1.8,
//                 ease: "easeOut",
//               }}
//             />
//           </svg>

//           <div className="gauge-value">
//             <strong>82%</strong>
//             <span>PROBABILITY</span>
//           </div>
//         </div>

//         <div className="risk-description">
//           <div className="risk-level">
//             <AlertTriangle size={17} />
//             HIGH RISK
//           </div>

//           <p>
//             Current environmental conditions indicate elevated landslide
//             susceptibility in the analyzed terrain.
//           </p>

//           <div className="risk-confidence">
//             <span>MODEL CONFIDENCE</span>
//             <strong>94.2%</strong>
//           </div>
//         </div>
//       </div>

//       <div className="risk-footer">
//         <CheckCircle2 size={14} />
//         Prediction generated successfully
//         <span>12:42:18</span>
//       </div>
//     </div>
//   );
// }

// function Features() {
//   return (
//     <section className="features-section">
//       {/* BACKGROUND */}
//       <div className="features-bg">
//         <div className="features-grid" />
//         <div className="features-glow glow-left" />
//         <div className="features-glow glow-right" />
//       </div>

//       {/* HEADER */}
//       <div className="features-container">
//         {/* <motion.div
//           className="features-heading"
//           initial={{ opacity: 0, y: 35 }}
//           whileInView={{ opacity: 1, y: 0 }}
//           viewport={{ once: true }}
//           transition={{ duration: 0.7 }}
//         >
//           <div className="section-tag">
//             <span />
//             SYSTEM CAPABILITIES
//           </div>

//           <h2>
//             Intelligence built for
//             <br />
//             <span>mountain risk analysis.</span>
//           </h2>

//           <p>
//             LandSafe AI combines terrain intelligence, environmental data
//             and machine learning to transform raw geographic information
//             into actionable landslide risk predictions.
//           </p>
//         </motion.div> */}

//         {/* REALISTIC ANALYSIS DASHBOARD */}
//         <motion.div
//           className="analysis-dashboard"
//           initial={{ opacity: 0, y: 50 }}
//           whileInView={{ opacity: 1, y: 0 }}
//           viewport={{ once: true }}
//           transition={{ duration: 0.9 }}
//         >
//           {/* DASHBOARD HEADER */}
//           <div className="dashboard-header">
//             <div className="dashboard-brand">
//               <div className="brand-square">
//                 <Mountain size={17} />
//               </div>

//               <div>
//                 <strong>LANDSAFE AI</strong>
//                 <span>GEOSPATIAL RISK MONITORING</span>
//               </div>
//             </div>

//             <div className="dashboard-state">
//               <span className="state-dot" />
//               MODEL ONLINE
//               <i />
//               LIVE ANALYSIS
//             </div>
//           </div>

//           {/* METRICS */}
//           <div className="metrics-row">
//             {metrics.map((metric, index) => {
//               const Icon = metric.icon;

//               return (
//                 <motion.div
//                   className="metric-card"
//                   key={metric.label}
//                   initial={{ opacity: 0, y: 20 }}
//                   whileInView={{ opacity: 1, y: 0 }}
//                   viewport={{ once: true }}
//                   transition={{
//                     delay: index * 0.08,
//                     duration: 0.5,
//                   }}
//                 >
//                   <div className="metric-icon">
//                     <Icon size={17} />
//                   </div>

//                   <div className="metric-content">
//                     <span>{metric.label}</span>

//                     <strong>
//                       {metric.value}
//                       <small>{metric.unit}</small>
//                     </strong>
//                   </div>
//                 </motion.div>
//               );
//             })}
//           </div>

//           {/* MAIN DASHBOARD */}
//           <div className="dashboard-main">
//             {/* MAP */}
//             <div className="dashboard-map-column">
//               <FeatureMap />
//             </div>

//             {/* RIGHT ANALYSIS */}
//             <div className="dashboard-analysis-column">
//               <RiskResult />
//               <ModelPanel />
//             </div>
//           </div>

//           {/* CHART */}
//           <RiskChart />

//           {/* DATA PIPELINE */}
//           <div className="pipeline-section">
//             <div className="pipeline-title">
//               <span>PROCESSING PIPELINE</span>
//               <small>REAL-TIME MODEL FLOW</small>
//             </div>

//             <div className="pipeline">
//               {pipeline.map((item, index) => {
//                 const Icon = item.icon;

//                 return (
//                   <motion.div
//                     className="pipeline-step"
//                     key={item.title}
//                     initial={{ opacity: 0, x: -20 }}
//                     whileInView={{ opacity: 1, x: 0 }}
//                     viewport={{ once: true }}
//                     transition={{
//                       delay: index * 0.1,
//                       duration: 0.5,
//                     }}
//                   >
//                     <div className="pipeline-icon">
//                       <Icon size={16} />
//                     </div>

//                     <div className="pipeline-content">
//                       <span>{item.title}</span>
//                       <small>{item.text}</small>
//                     </div>

//                     {index !== pipeline.length - 1 && (
//                       <div className="pipeline-line" />
//                     )}
//                   </motion.div>
//                 );
//               })}
//             </div>
//           </div>

//           {/* FOOTER */}
//           <div className="dashboard-footer">
//             <div>
//               <Cpu size={14} />
//               <span>RANDOM FOREST CLASSIFIER</span>
//             </div>

//             <div>
//               <Database size={14} />
//               <span>4 ENVIRONMENTAL FEATURES</span>
//             </div>

//             <div>
//               <Gauge size={14} />
//               <span>PROBABILITY-BASED OUTPUT</span>
//             </div>

//             <div className="footer-location">
//               <Navigation size={13} />
//               RUDRAPRAYAG, UTTARAKHAND
//             </div>
//           </div>
//         </motion.div>

//         {/* CAPABILITIES */}
//         <div className="capabilities-grid">
//           {capabilities.map((item, index) => {
//             const Icon = item.icon;

//             return (
//               <motion.article
//                 className="capability-card"
//                 key={item.number}
//                 initial={{ opacity: 0, y: 35 }}
//                 whileInView={{ opacity: 1, y: 0 }}
//                 viewport={{ once: true }}
//                 transition={{
//                   delay: index * 0.08,
//                   duration: 0.6,
//                 }}
//               >
//                 <div className="capability-top">
//                   <span>{item.number}</span>

//                   <div className="capability-icon">
//                     <Icon size={19} />
//                   </div>
//                 </div>

//                 <h3>{item.title}</h3>

//                 <p>{item.description}</p>

//                 <div className="capability-line" />
//               </motion.article>
//             );
//           })}
//         </div>

//         {/* TECHNOLOGY STRIP */}
//         <div className="technology-strip">
//           <span>POWERED BY</span>

//           <strong>SCIKIT-LEARN</strong>
//           <i />
//           <strong>FASTAPI</strong>
//           <i />
//           <strong>REACT</strong>
//           <i />
//           <strong>THREE.JS</strong>
//           <i />
//           <strong>GEOSPATIAL DATA</strong>
//         </div>
//       </div>
//     </section>
//   );
// }

export default function Features() {
  return (
    <section className="features-section">
      <div className="features-container">
        <h2>System Capabilities</h2>
        <p>Terrain-aware, AI-driven landslide monitoring and early-warning analysis.</p>
      </div>
    </section>
  );
}