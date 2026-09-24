import { useState } from "react";

import {
  Activity,
  CalendarDays,
  MapPin,
  Radio,
  ShieldCheck,
  CloudRain,
  Mountain,
  Navigation,
  Cpu,
  Waves,
  ArrowDown,
} from "lucide-react";

import "./RecentLandslides.css";


const events = [
  {
    id: 1,
    date: "January 2023",
    year: "2023",
    title: "Ground Subsidence Crisis",
    location: "Joshimath, Uttarakhand",
    description:
      "Joshimath experienced widespread ground subsidence and landslide-related damage, leading to evacuations and a major recovery and reconstruction response.",
    risk: "HIGH",
    riskValue: 82,
    type: "GROUND INSTABILITY",
    severity: "HIGH",
    coordinates: "30.569° N / 79.566° E",
    terrain: "STEEP",
    rainfall: "ACTIVE",
    model: "ANALYZED",
    x: 30,
    y: 38,
  },

  {
    id: 2,
    date: "20 July 2024",
    year: "2024",
    title: "Kedarnath Route Landslide",
    location: "Chirbasa, Rudraprayag",
    description:
      "A landslide struck the Gaurikund–Kedarnath route near Chirbasa during the monsoon period, affecting pilgrims and emergency response operations.",
    risk: "HIGH",
    riskValue: 88,
    type: "LANDSLIDE",
    severity: "HIGH",
    coordinates: "30.734° N / 79.066° E",
    terrain: "VERY STEEP",
    rainfall: "HEAVY",
    model: "ANALYZED",
    x: 47,
    y: 28,
  },

  {
    id: 3,
    date: "1 August 2024",
    year: "2024",
    title: "Heavy Rainfall Triggered Landslide",
    location: "Gaurikund, Rudraprayag",
    description:
      "Heavy rainfall triggered landslide activity near the Gaurikund axis, requiring a major emergency response and evacuation operation.",
    risk: "CRITICAL",
    riskValue: 94,
    type: "RAINFALL TRIGGERED",
    severity: "CRITICAL",
    coordinates: "30.657° N / 79.064° E",
    terrain: "STEEP",
    rainfall: "EXTREME",
    model: "ANALYZED",
    x: 65,
    y: 58,
  },

  {
    id: 4,
    date: "29 August 2025",
    year: "2025",
    title: "Cloudburst & Landslide Activity",
    location: "Rudraprayag, Uttarakhand",
    description:
      "Cloudburst-related debris flow and landslide activity were reported across Rudraprayag and other Uttarakhand districts during the monsoon.",
    risk: "CRITICAL",
    riskValue: 97,
    type: "CLOUDBURST",
    severity: "CRITICAL",
    coordinates: "30.63° N / 79.06° E",
    terrain: "STEEP",
    rainfall: "EXTREME",
    model: "ANALYZED",
    x: 72,
    y: 35,
  },
];


function RecentLandslides() {

  const [selectedEvent, setSelectedEvent] = useState(0);

  const event = events[selectedEvent];


  const selectEvent = (index) => {
    setSelectedEvent(index);
  };


  return (
    <section
      className="recent-landslides"
      id="recent-events"
    >

      {/* Background */}

      <div className="recent-background"></div>

      <div className="recent-grid"></div>

      <div className="recent-glow recent-glow-one"></div>

      <div className="recent-glow recent-glow-two"></div>


      <div className="recent-container">


        {/* =========================================
            HEADER
        ========================================= */}

        <div className="recent-intro">

          <div className="recent-label">

            <span className="recent-label-line"></span>

            LANDSAFE AI / TERRAIN INTELLIGENCE

          </div>


          <h2>
            Reading the{" "}

            <span>
              mountains.
            </span>

          </h2>


          <p>
            Historical landslide events reveal patterns in terrain,
            rainfall and environmental instability. LandSafe AI turns
            these signals into actionable risk intelligence.
          </p>

        </div>


        {/* =========================================
            DATA STRIP
        ========================================= */}

        <div className="recent-data-strip">

          <div className="recent-data-card">

            <Activity />

            <div>
              <strong>04</strong>
              <span>DOCUMENTED EVENTS</span>
            </div>

          </div>


          <div className="recent-data-card">

            <CalendarDays />

            <div>
              <strong>2023–25</strong>
              <span>MONITORED PERIOD</span>
            </div>

          </div>


          <div className="recent-data-card">

            <MapPin />

            <div>
              <strong>HIMALAYAS</strong>
              <span>REGION</span>
            </div>

          </div>


          <div className="recent-data-card">

            <ShieldCheck />

            <div>
              <strong>AI READY</strong>
              <span>RISK ANALYSIS</span>
            </div>

          </div>

        </div>


        {/* =========================================
            COMMAND CENTER
        ========================================= */}

        <div className="recent-command-center">


          {/* =======================================
              RADAR
          ======================================= */}

          <div className="recent-radar-panel">


            <div className="recent-panel-header">

              <div className="recent-panel-title">

                <Radio size={14} />

                TERRAIN SCAN

              </div>


              <div className="recent-online">

                <span></span>

                SYSTEM ONLINE

              </div>

            </div>


            {/* Radar */}

            <div className="recent-radar">


              <div className="radar-ring radar-ring-1"></div>

              <div className="radar-ring radar-ring-2"></div>

              <div className="radar-ring radar-ring-3"></div>


              <div className="radar-cross radar-cross-x"></div>

              <div className="radar-cross radar-cross-y"></div>


              {/* Sweep */}

              <div className="radar-sweep"></div>


              {/* Center */}

              <div className="radar-center">

                <span></span>

                RUDRAPRAYAG

              </div>


              {/* Mountains */}

              <div className="radar-mountains">

                <div className="mountain mountain-one"></div>

                <div className="mountain mountain-two"></div>

                <div className="mountain mountain-three"></div>

              </div>


              {/* Event dots */}

              {events.map((item, index) => (

                <button
                  key={item.id}
                  className={
                    selectedEvent === index
                      ? "radar-event selected"
                      : "radar-event"
                  }
                  style={{
                    left: `${item.x}%`,
                    top: `${item.y}%`,
                  }}
                  onClick={() => selectEvent(index)}
                  aria-label={`Select ${item.title}`}
                >

                  <span className="radar-dot"></span>

                  <span className="radar-pulse"></span>

                </button>

              ))}


            </div>


            {/* Radar footer */}

            <div className="radar-footer">

              <div>
                <span>REGION</span>
                <strong>UTTARAKHAND</strong>
              </div>

              <div>
                <span>EVENTS</span>
                <strong>04 ACTIVE</strong>
              </div>

              <div>
                <span>SENSOR</span>
                <strong>ONLINE</strong>
              </div>

            </div>

          </div>


          {/* =======================================
              INTELLIGENCE
          ======================================= */}

          <div className="recent-intelligence">


            <div className="intelligence-header">

              <div>

                EVENT{" "}

                <strong>
                  {String(event.id).padStart(2, "0")}
                </strong>

              </div>


              <div className="monitoring-status">

                <span></span>

                MONITORED

              </div>

            </div>


            <div className="event-content">


              <div className="event-date">

                <CalendarDays size={13} />

                {event.date}

              </div>


              <h3>
                {event.title}
              </h3>


              <div className="event-location">

                <MapPin size={13} />

                {event.location}

              </div>


              <p className="event-description">
                {event.description}
              </p>


              {/* Risk */}

              <div className="risk-analysis">


                <div className="risk-circle">

                  <svg viewBox="0 0 100 100">

                    <circle
                      className="risk-track"
                      cx="50"
                      cy="50"
                      r="40"
                    />

                    <circle
                      className="risk-progress"
                      cx="50"
                      cy="50"
                      r="40"
                      style={{
                        strokeDasharray: "251.2",
                        strokeDashoffset:
                          251.2 -
                          (251.2 * event.riskValue) /
                            100,
                      }}
                    />

                  </svg>


                  <div className="risk-text">

                    <span>RISK</span>

                    <strong>
                      {event.risk}
                    </strong>

                  </div>

                </div>


                <div className="risk-details">

                  <div>
                    <span>EVENT TYPE</span>
                    <strong>{event.type}</strong>
                  </div>

                  <div>
                    <span>SEVERITY</span>
                    <strong>{event.severity}</strong>
                  </div>

                  <div>
                    <span>COORDINATES</span>
                    <strong>{event.coordinates}</strong>
                  </div>

                </div>

              </div>


              {/* Sensors */}

              <div className="sensor-grid">


                <div className="sensor-card">

                  <Mountain size={16} />

                  <span>TERRAIN</span>

                  <strong>
                    {event.terrain}
                  </strong>

                </div>


                <div className="sensor-card">

                  <CloudRain size={16} />

                  <span>RAINFALL</span>

                  <strong>
                    {event.rainfall}
                  </strong>

                </div>


                <div className="sensor-card">

                  <Cpu size={16} />

                  <span>AI MODEL</span>

                  <strong>
                    {event.model}
                  </strong>

                </div>

              </div>


              {/* AI stream */}

              <div className="ai-stream">

                <div className="ai-stream-header">

                  <span>

                    <Activity size={12} />

                    AI ANALYSIS STREAM

                  </span>

                  <strong>
                    {event.riskValue}%
                  </strong>

                </div>


                <div className="ai-stream-bar">

                  <div
                    style={{
                      width: `${event.riskValue}%`,
                    }}
                  ></div>

                </div>


                <div className="ai-stream-status">

                  <span>
                    TERRAIN
                  </span>

                  <span>
                    SLOPE
                  </span>

                  <span>
                    RAINFALL
                  </span>

                  <strong>
                    {event.risk}
                  </strong>

                </div>

              </div>

            </div>


            {/* Event selector */}

            <div className="event-selector">

              {events.map((item, index) => (

                <button
                  key={item.id}
                  className={
                    selectedEvent === index
                      ? "active"
                      : ""
                  }
                  onClick={() => selectEvent(index)}
                >

                  <span>
                    {String(item.id).padStart(2, "0")}
                  </span>

                  <span className="selector-line"></span>

                  <Navigation size={11} />

                </button>

              ))}

            </div>


            <div className="event-progress">

              <div
                style={{
                  width: `${((selectedEvent + 1) / events.length) * 100}%`,
                }}
              ></div>

            </div>

          </div>

        </div>


        {/* =========================================
            SCROLL / INFO
        ========================================= */}

        <div className="recent-scroll">

          <ArrowDown size={15} />

          SELECT AN EVENT TO ANALYZE

        </div>


        {/* =========================================
            SYSTEM BAR
        ========================================= */}

        <div className="recent-system-bar">

          <div className="system-live">

            <span></span>

            SYSTEM OPERATIONAL

          </div>


          <p>
            Every landslide leaves a signal.
            LandSafe AI turns those signals into
            risk intelligence.
          </p>


          <div className="system-model">

            <Waves size={14} />

            RANDOM FOREST

          </div>

        </div>


      </div>

    </section>
  );
}


export default RecentLandslides;