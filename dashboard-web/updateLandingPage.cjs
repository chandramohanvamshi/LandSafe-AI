const fs = require("fs");
const path = require("path");

const file = path.join(
  __dirname,
  "src",
  "pages",
  "LandingPage.jsx"
);

if (!fs.existsSync(file)) {
  console.error("❌ LandingPage.jsx not found:");
  console.error(file);
  process.exit(1);
}

let code = fs.readFileSync(file, "utf8");

/* =========================================================
   HOW IT WORKS
========================================================= */

code = code.replace(
  /title: "Raw DEM Terrain",\s*text:\s*"Digital elevation data is transformed into terrain geometry and environmental features\."/,
  `title: "Rainfall & Environment",
    text:
      "Rainfall and environmental conditions are collected as key signals for flash-flood risk analysis."`
);

code = code.replace(
  /title: "ML Analysis",\s*text:\s*"A Random Forest model evaluates elevation, slope and rainfall conditions\."/,
  `title: "Terrain Analysis",
    text:
      "Elevation, slope and terrain characteristics are processed to understand how water can move across the landscape."`
);

code = code.replace(
  /title: "3D Visualization",\s*text:\s*"Risk information is projected onto an interactive geospatial terrain view\."/,
  `title: "AI Risk Analysis",
    text:
      "Machine-learning models analyze environmental and geospatial features to estimate emerging flood risk."`
);

code = code.replace(
  /title: "Real-Time Alerts",\s*text:\s*"Risk states can be surfaced for monitoring and early-warning workflows\."/,
  `title: "Early Warning",
    text:
      "Risk information is presented through an interactive dashboard to support faster monitoring and response."`
);

/* =========================================================
   REMOVE OLD LANDSLIDE TEXT
========================================================= */

code = code.replace(
  /<p>\s*Landslides can evolve quickly\s*while conventional monitoring\s*can leave decision-makers without\s*a unified view of terrain,\s*rainfall and risk\.\s*<\/p>/,
  ""
);

/* =========================================================
   PROBLEM SECTION
========================================================= */

code = code.replace(
  /LandSafe AI combines environmental\s*conditions, terrain characteristics\s*and machine learning into a unified\s*geospatial risk platform designed\s*for flash-flood early warning\./,
  `LandSafe AI combines rainfall, terrain
              characteristics and environmental
              conditions with machine learning
              to support flash-flood early warning.`
);

/* =========================================================
   WORKFLOW HEADING
========================================================= */

code = code.replace(
  /From raw terrain to\s*<span>\s*\{" "\}early warning\.\s*<\/span>/,
  `From environmental data to
              <span>
                {" "}early warning.
              </span>`
);

code = code.replace(
  /Four connected stages turn\s*environmental data into an\s*inspectable risk surface\./,
  `Four connected stages transform
              environmental and geospatial signals
              into an actionable flood-risk view.`
);

/* =========================================================
   FEATURES HEADING
========================================================= */

code = code.replace(
  /See the intelligence\s*<span>\s*\{" "\}inside the terrain\.\s*<\/span>/,
  `See the intelligence
              <span>
                {" "}behind the warning.
              </span>`
);

code = code.replace(
  /Designed to make complex\s*geospatial signals understandable\s*at a glance\./,
  `Designed to make rainfall, terrain
              and environmental signals
              understandable at a glance.`
);

/* =========================================================
   ARCHITECTURE HEADING
========================================================= */

code = code.replace(
  /Built with\s*<span>\s*\{" "\}serious engineering\.\s*<\/span>/,
  `Built for
              <span>
                {" "}real-world warning systems.
              </span>`
);

code = code.replace(
  /A modular pipeline connects\s*the frontend, geospatial processing\s*and prediction service\./,
  `A modular pipeline connects
              environmental data, geospatial
              processing, machine learning and
              the interactive risk dashboard.`
);

/* =========================================================
   ARCHITECTURE PIPELINE
========================================================= */

code = code.replace(
  /<span>DEM<\/span>\s*<b>→<\/b>\s*<span>\s*Terrain Processing\s*<\/span>\s*<b>→<\/b>\s*<span>\s*Feature Vector\s*<\/span>\s*<b>→<\/b>\s*<span>\s*Random Forest\s*<\/span>\s*<b>→<\/b>\s*<span>\s*FastAPI\s*<\/span>\s*<b>→<\/b>\s*<span>\s*3D Risk View\s*<\/span>/,
  `<span>Rainfall</span>
              <b>→</b>

              <span>
                Terrain Data
              </span>

              <b>→</b>

              <span>
                Environmental Features
              </span>

              <b>→</b>

              <span>
                AI Risk Model
              </span>

              <b>→</b>

              <span>
                FastAPI
              </span>

              <b>→</b>

              <span>
                Flood Risk View
              </span>`
);

/* =========================================================
   IMPACT / WHY LANDSAFE
========================================================= */

code = code.replace(
  /Interactive 3D terrain keeps\s*the geography visible instead\s*of hiding risk inside a table\./,
  `Terrain and environmental
                information are brought together
                to understand changing flood-risk
                conditions.`
);

code = code.replace(
  /Environmental features are\s*passed through a Random Forest\s*classification workflow\./,
  `Machine learning transforms
                environmental and geospatial
                features into actionable
                flood-risk information.`
);

code = code.replace(
  /The architecture is designed\s*around risk visibility and\s*early-warning decision support\./,
  `Risk information is presented
                clearly so monitoring teams can
                identify changing conditions
                faster.`
);

/* =========================================================
   SIH BANNER
========================================================= */

code = code.replace(
  /Solving India's challenge\s*with a geospatial AI workflow\./,
  `Building a smarter flash-flood
                early-warning system.`
);

code = code.replace(
  /LandSafe AI connects terrain\s*data, machine learning and\s*visualization into a prototype\s*built for real-world\s*disaster-management scenarios\./,
  `LandSafe AI combines geospatial
                intelligence, environmental signals,
                machine learning and interactive
                visualization to support faster
                flood-risk assessment.`
);

/* =========================================================
   TEAM SECTION
========================================================= */

code = code.replace(
  /A focused prototype combining\s*frontend engineering, geospatial\s*processing, machine learning\s*and deployment\./,
  `A focused prototype combining
                frontend engineering, geospatial
                processing, machine learning and
                deployment for flash-flood
                early-warning scenarios.`
);

/* =========================================================
   CTA
========================================================= */

code = code.replace(
  /Ready to predict the\s*<span>\s*\{" "\}unpredictable\?\s*<\/span>/,
  `Ready to detect
              <span>
                {" "}flood risk earlier?
              </span>`
);

code = code.replace(
  /Explore the live terrain engine\s*and see how LandSafe AI turns\s*environmental data into spatial\s*risk intelligence\./,
  `Explore the live terrain engine
              and see how LandSafe AI turns
              rainfall, terrain and environmental
              data into spatial flood-risk
              intelligence.`
);

/* =========================================================
   FOOTER
========================================================= */

code = code.replace(
  /Built for safer, smarter terrain monitoring\./,
  `Built for earlier, smarter flood-risk monitoring.`
);

/* =========================================================
   SAVE
========================================================= */

fs.writeFileSync(file, code, "utf8");

console.log("");
console.log("==============================================");
console.log("✅ LandSafe AI Landing Page Updated");
console.log("==============================================");
console.log("");
console.log("Updated file:");
console.log(file);
console.log("");
console.log("Flash-flood UI sections updated:");
console.log("✓ Problem");
console.log("✓ How It Works");
console.log("✓ Features heading");
console.log("✓ Technical Architecture");
console.log("✓ Architecture Pipeline");
console.log("✓ Impact");
console.log("✓ SIH Banner");
console.log("✓ Team");
console.log("✓ CTA");
console.log("✓ Footer");
console.log("");