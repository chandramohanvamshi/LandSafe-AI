import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const HEIGHTMAP_URL = "/models/terrain.raw";
const API_URL = "http://127.0.0.1:8000";
const SATELLITE_TEXTURE_URL = "/textures/rudraprayag-satellite.jpg";

const RESOLUTION = 1025;
// Keep the full 1025x1025 DEM for accurate analysis, but render a lighter
// 257x257 mesh for smooth real-time OrbitControls interaction.
const RENDER_RESOLUTION = 257;
const TERRAIN_WIDTH = 3600;
const TERRAIN_HEIGHT = 600;
const TERRAIN_DEPTH = 3600;
const MAX_RAINFALL = 500;
const MAX_SLOPE = 90;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0, edge1, value) {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function hash2D(x, y) {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

function getRiskStatus(risk) {
  if (risk < 25) return "Low";
  if (risk < 50) return "Moderate";
  if (risk < 75) return "High";
  return "Critical";
}

function getRiskColor(risk) {
  const stops = [
    [0, "#168b4f"],
    [15, "#35b86b"],
    [30, "#8fca4b"],
    [45, "#f0d34a"],
    [60, "#ffb52e"],
    [75, "#f27622"],
    [90, "#e64732"],
    [100, "#a90f1f"],
  ];

  const color = new THREE.Color();
  if (risk <= stops[0][0]) return color.set(stops[0][1]);
  if (risk >= stops[stops.length - 1][0]) return color.set(stops[stops.length - 1][1]);

  for (let i = 0; i < stops.length - 1; i += 1) {
    const [v1, c1] = stops[i];
    const [v2, c2] = stops[i + 1];
    if (risk >= v1 && risk <= v2) {
      const t = (risk - v1) / (v2 - v1);
      return color.set(c1).lerp(new THREE.Color(c2), t);
    }
  }

  return color.set("#168b4f");
}

function getNdvi(row, col, elevation, slope) {
  const noise = hash2D(row * 0.08, col * 0.08);
  const elevationFactor = 1 - clamp(elevation / TERRAIN_HEIGHT, 0, 1) * 0.35;
  const slopeFactor = 1 - clamp(slope / 70, 0, 1) * 0.28;
  return clamp(0.42 + noise * 0.32 + elevationFactor * 0.16 + slopeFactor * 0.1, 0, 1);
}

function getSoilComposition(slope, elevation) {
  const rock = clamp(28 + slope * 0.42, 25, 60);
  const clay = clamp(27 + (elevation / TERRAIN_HEIGHT) * 8 - slope * 0.08, 18, 36);
  const silt = clamp(100 - rock - clay, 18, 45);
  const total = rock + clay + silt;
  return {
    rock: Math.round((rock / total) * 100),
    clay: Math.round((clay / total) * 100),
    silt: Math.round((silt / total) * 100),
  };
}

function calculateRisk(slope, rainfall, soilMoisture, row = 0, col = 0, height = 0, neighborAverage = height) {
  const slopeRisk = clamp((slope / MAX_SLOPE) * 100, 0, 100);
  const rainfallRisk = clamp((rainfall / MAX_RAINFALL) * 100, 0, 100);
  const soilRisk = clamp(soilMoisture, 0, 100);

  const base = slopeRisk * 0.5 + rainfallRisk * 0.3 + soilRisk * 0.2;
  const steepCluster = smoothstep(35, 60, slope) * 7;
  const drainageFactor = clamp((neighborAverage - height) / 90, 0, 1);
  const drainageInfluence = drainageFactor * 8;
  const patch = (hash2D(row * 0.18, col * 0.18) - 0.5) * 7;

  return clamp(base + steepCluster + drainageInfluence + patch, 0, 100);
}

function formatTime() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function makeTerrainTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, 512, 512);
  gradient.addColorStop(0, "#d2ddd2");
  gradient.addColorStop(0.45, "#9eab9d");
  gradient.addColorStop(1, "#5f7166");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);

  const image = ctx.getImageData(0, 0, 512, 512);
  for (let i = 0; i < image.data.length; i += 4) {
    const n = Math.floor(Math.random() * 18) - 9;
    image.data[i] = clamp(image.data[i] + n, 0, 255);
    image.data[i + 1] = clamp(image.data[i + 1] + n, 0, 255);
    image.data[i + 2] = clamp(image.data[i + 2] + n, 0, 255);
  }
  ctx.putImageData(image, 0, 0);

  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = "#20372e";
  ctx.lineWidth = 1;
  for (let r = 28; r < 512; r += 32) {
    ctx.beginPath();
    ctx.moveTo(0, r);
    ctx.bezierCurveTo(150, r - 16, 330, r + 20, 512, r - 4);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2.2, 2.2);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}


function sampleTerrainElevation(heightData, x, z) {
  if (!heightData) return 0;
  const col = clamp(
    Math.round(((x + TERRAIN_WIDTH / 2) / TERRAIN_WIDTH) * (RESOLUTION - 1)),
    0,
    RESOLUTION - 1
  );
  const row = clamp(
    Math.round(((z + TERRAIN_DEPTH / 2) / TERRAIN_DEPTH) * (RESOLUTION - 1)),
    0,
    RESOLUTION - 1
  );
  return (heightData[row * RESOLUTION + col] / 65535) * TERRAIN_HEIGHT;
}

function buildValleyStreamPoints(heightData, startX, startZ, endX, endZ, steps = 90) {
  const raw = [];
  let previousZ = startZ;

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const baseX = THREE.MathUtils.lerp(startX, endX, t);
    const baseZ = THREE.MathUtils.lerp(startZ, endZ, t);

    let bestZ = baseZ;
    let bestScore = Infinity;

    // Search a narrow corridor around the intended route and prefer
    // lower terrain so the stream visually follows valleys.
    for (let offset = -180; offset <= 180; offset += 45) {
      const candidateZ = clamp(baseZ + offset, -TERRAIN_DEPTH / 2 + 25, TERRAIN_DEPTH / 2 - 25);
      const elevation = sampleTerrainElevation(heightData, baseX, candidateZ);
      const continuity = Math.abs(candidateZ - previousZ) * 0.16;
      const corridorPenalty = Math.abs(offset) * 0.055;
      const score = elevation + continuity + corridorPenalty;

      if (score < bestScore) {
        bestScore = score;
        bestZ = candidateZ;
      }
    }

    previousZ = THREE.MathUtils.lerp(previousZ, bestZ, 0.72);
    raw.push({
      x: baseX,
      z: previousZ,
      elevation: sampleTerrainElevation(heightData, baseX, previousZ),
    });
  }

  // Light smoothing prevents sharp zig-zags while preserving the valley path.
  return raw.map((point, index) => {
    const a = raw[Math.max(0, index - 2)];
    const b = raw[Math.max(0, index - 1)];
    const c = raw[Math.min(raw.length - 1, index + 1)];
    const d = raw[Math.min(raw.length - 1, index + 2)];

    const z = (a.z + 2 * b.z + 4 * point.z + 2 * c.z + d.z) / 10;

    return new THREE.Vector3(
      point.x,
      sampleTerrainElevation(heightData, point.x, z),
      -z
    );
  });
}


function buildBranchRoute(heightData, parentRoute, anchorIndex, length, sideSign) {
  const anchor = parentRoute[anchorIndex];
  const before = parentRoute[Math.max(0, anchorIndex - 2)];
  const after = parentRoute[Math.min(parentRoute.length - 1, anchorIndex + 2)];

  const tangent = new THREE.Vector3(
    after.x - before.x,
    0,
    after.z - before.z
  ).normalize();

  const side = new THREE.Vector3(
    -tangent.z,
    0,
    tangent.x
  ).multiplyScalar(sideSign);

  const branch = [anchor.clone()];

  for (let i = 1; i <= length; i += 1) {
    const t = i / length;
    const spread = 180 + 360 * t;
    const along = 90 * t;
    const x = anchor.x + side.x * spread + tangent.x * along;
    const z = anchor.z + side.z * spread + tangent.z * along;
    const y = sampleTerrainElevation(heightData, x, z);

    branch.push(new THREE.Vector3(x, y, z));
  }

  return branch;
}


function createWaterMaterial(speed = 1, opacity = 0.78) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uSpeed: { value: speed },
      uOpacity: { value: opacity },
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uSpeed;
      uniform float uOpacity;

      varying vec2 vUv;

      void main() {
        /*
          vUv.x = downstream direction
          vUv.y = bank -> center -> bank
        */
        float center = 1.0 - abs(vUv.y - 0.5) * 2.0;

        // Long, soft moving reflections rather than a solid neon tube.
        float wave1 = sin(vUv.x * 58.0 - uTime * 3.2 * uSpeed);
        float wave2 = sin(vUv.x * 117.0 - uTime * 5.0 * uSpeed + vUv.y * 7.0);
        float wave3 = sin(vUv.x * 23.0 - uTime * 1.8 * uSpeed);

        float sparkle = smoothstep(0.72, 0.98, wave2 * 0.5 + 0.5);
        float reflection = 0.5 + 0.5 * wave1;
        reflection *= 0.45 + 0.55 * (0.5 + 0.5 * wave3);

        vec3 deep = vec3(0.015, 0.12, 0.16);
        vec3 mid = vec3(0.015, 0.34, 0.43);
        vec3 highlight = vec3(0.32, 0.82, 0.86);

        vec3 color = mix(deep, mid, 0.58 + reflection * 0.20);
        color = mix(color, highlight, sparkle * 0.28);

        // Transparent edges let the terrain remain visible around the stream.
        float edge = smoothstep(0.0, 0.28, center);
        float alpha = uOpacity * (0.35 + center * 0.48 + sparkle * 0.12) * edge;

        // Slight atmospheric fade near the ends of the stream.
        float endFade = smoothstep(0.02, 0.10, vUv.x) *
                        (1.0 - smoothstep(0.90, 1.0, vUv.x));

        gl_FragColor = vec4(color, alpha * endFade);
      }
    `,
  });
}

function createWaterRibbonGeometry(route, widths) {
  const count = route.length;
  const positions = new Float32Array(count * 2 * 3);
  const uvs = new Float32Array(count * 2 * 2);
  const indices = [];

  for (let i = 0; i < count; i += 1) {
    const point = route[i];

    const prev = route[Math.max(0, i - 1)];
    const next = route[Math.min(count - 1, i + 1)];

    // Horizontal tangent. Water should stay on the terrain surface,
    // so the ribbon width is calculated in XZ rather than world Y.
    const tangent = new THREE.Vector3(
      next.x - prev.x,
      0,
      next.z - prev.z
    ).normalize();

    const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const halfWidth = widths[i] * 0.5;

    const left = point.clone().addScaledVector(side, halfWidth);
    const right = point.clone().addScaledVector(side, -halfWidth);

    // Keep the water just above the DEM to avoid z-fighting.
    left.y += 4;
    right.y += 4;

    const base = i * 6;
    positions[base] = left.x;
    positions[base + 1] = left.y;
    positions[base + 2] = left.z;
    positions[base + 3] = right.x;
    positions[base + 4] = right.y;
    positions[base + 5] = right.z;

    const u = i / Math.max(count - 1, 1);
    uvs[i * 4] = u;
    uvs[i * 4 + 1] = 0;
    uvs[i * 4 + 2] = u;
    uvs[i * 4 + 3] = 1;

    if (i < count - 1) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = i * 2 + 2;
      const d = i * 2 + 3;

      indices.push(a, b, c, b, d, c);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

function createWaterBankGeometry(route, width) {
  const widths = route.map((_, i) => {
    const t = i / Math.max(route.length - 1, 1);
    // Narrow at the headwater and outlet, wider in the middle.
    const profile = 0.75 + Math.sin(Math.PI * t) * 0.35;
    return width * profile;
  });

  return createWaterRibbonGeometry(route, widths);
}


function formatRelativeTime(timestamp) {
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours} hr ago`;
}

function getGeologicalFormation(row, col) {
  const value = Math.floor(hash2D(row * 0.013, col * 0.017) * 4);
  return [
    "Lesser Himalayan metamorphic zone",
    "Colluvial valley fill",
    "Himalayan crystalline rock zone",
    "River terrace sediment",
  ][value];
}

function getLastRecordedEvent(row, col) {
  const value = hash2D(row * 0.031, col * 0.021);
  if (value > 0.74) return "Historical event marker · demo";
  if (value > 0.45) return "No linked event in current layer";
  return "Monitoring record only · demo";
}

function buildThirtyDayRisk(baseRisk) {
  const offsets = [
    -14, -10, -7, -5, -2, 3, 7, 5, 11, 14,
    9, 6, 12, 16, 19, 15, 11, 8, 4, 7,
    10, 13, 18, 22, 17, 12, 9, 15, 20, 24,
  ];
  return offsets.map((offset, index) => ({
    day: index + 1,
    risk: clamp(baseRisk + offset + Math.sin(index * 0.8) * 4, 5, 99),
  }));
}

function makeSoftParticleTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(32, 32, 2, 32, 32, 32);
  gradient.addColorStop(0, "rgba(230,245,244,.34)");
  gradient.addColorStop(0.35, "rgba(180,205,205,.18)");
  gradient.addColorStop(1, "rgba(120,150,150,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}


function TerrainViewer() {
  const mountRef = useRef(null);
  const terrainRef = useRef(null);
  const geometryRef = useRef(null);
  const heightsRef = useRef(null);
  const slopesRef = useRef(null);
  const beaconRef = useRef(null);
  const rippleGroupRef = useRef(null);
  const rainParticlesRef = useRef(null);
  const riskZonesRef = useRef([]);
  const waterStreamsRef = useRef(null);
  const waterFlowParticlesRef = useRef(null);
  const riskHaloRef = useRef([]);
  const riskSmokeRef = useRef(null);
  const riskConnectorRef = useRef(null);
  const beaconLightRef = useRef(null);
  const beaconSpinRef = useRef(null);
  const predictionRequestRef = useRef(0);
  const cameraTransitionRef = useRef(null);
  const renderSourceIndicesRef = useRef(null);
  const pointerRafRef = useRef(null);
  const pointerPendingRef = useRef(null);
  const isInteractingRef = useRef(false);
  const selectedLocationRef = useRef(null);
  const rainfallRef = useRef(120);
  const soilMoistureRef = useRef(50);
  const sunAngleRef = useRef(135);
  const lastUpdatedAtRef = useRef(Date.now() - 120000);

  const [rainfall, setRainfall] = useState(120);
  const [soilMoisture, setSoilMoisture] = useState(50);
  const [averageRisk, setAverageRisk] = useState(0);
  const [maximumRisk, setMaximumRisk] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [hoveredLocation, setHoveredLocation] = useState(null);
  const [apiStatus, setApiStatus] = useState("Ready");
  const [timelineDay, setTimelineDay] = useState(30);
  const [riskThreshold, setRiskThreshold] = useState(50);
  const [sunAngle, setSunAngle] = useState(135);
  const [layers, setLayers] = useState({
    rainfall: true,
    water: true,
    faults: false,
    history: true,
    infrastructure: true,
  });
  const [weatherTime, setWeatherTime] = useState(formatTime());
  const [lastUpdatedAt, setLastUpdatedAt] = useState(Date.now() - 120000);
  const [freshnessNow, setFreshnessNow] = useState(Date.now());
  const [playbackPlaying, setPlaybackPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [whatIfRain, setWhatIfRain] = useState(50);
  const [whatIfSoilDrop, setWhatIfSoilDrop] = useState(20);

  useEffect(() => {
    const timer = setInterval(() => setWeatherTime(formatTime()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Re-render the relative timestamp every 15 seconds without changing
    // the underlying update time.
    const timer = setInterval(() => {
      setFreshnessNow(Date.now());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!playbackPlaying) return undefined;
    const timer = setInterval(() => {
      setTimelineDay((day) => (day >= 30 ? 1 : day + 1));
    }, Math.max(220, 1000 / playbackSpeed));
    return () => clearInterval(timer);
  }, [playbackPlaying, playbackSpeed]);

  useEffect(() => {
    sunAngleRef.current = sunAngle;
  }, [sunAngle]);

  const getNeighborAverage = (index) => {
    const heights = heightsRef.current;
    if (!heights) return 0;
    const row = Math.floor(index / RESOLUTION);
    const col = index % RESOLUTION;
    const left = heights[row * RESOLUTION + Math.max(0, col - 1)];
    const right = heights[row * RESOLUTION + Math.min(RESOLUTION - 1, col + 1)];
    const up = heights[Math.max(0, row - 1) * RESOLUTION + col];
    const down = heights[Math.min(RESOLUTION - 1, row + 1) * RESOLUTION + col];
    return ((left + right + up + down) / 4 / 65535) * TERRAIN_HEIGHT;
  };

  const riskForIndex = (index, rain = rainfallRef.current, soil = soilMoistureRef.current) => {
    const slopes = slopesRef.current;
    const heights = heightsRef.current;
    if (!slopes || !heights) return 0;
    const row = Math.floor(index / RESOLUTION);
    const col = index % RESOLUTION;
    const elevation = (heights[index] / 65535) * TERRAIN_HEIGHT;
    return calculateRisk(
      slopes[index],
      rain,
      soil,
      row,
      col,
      elevation,
      getNeighborAverage(index)
    );
  };

  const updateHeatmap = (newRainfall, newSoilMoisture) => {
    const geometry = geometryRef.current;
    const slopes = slopesRef.current;
    const heights = heightsRef.current;
    const sourceIndices = renderSourceIndicesRef.current;

    if (!geometry || !slopes || !heights || !sourceIndices) return;

    // Only recolor the lightweight render mesh. The full-resolution DEM
    // remains available in refs for accurate point analysis and API input.
    const colors = geometry.attributes.color
      ? geometry.attributes.color.array
      : new Float32Array(geometry.attributes.position.count * 3);

    let totalRisk = 0;
    let maxRisk = 0;

    for (let i = 0; i < sourceIndices.length; i += 1) {
      const sourceIndex = sourceIndices[i];
      const row = Math.floor(sourceIndex / RESOLUTION);
      const col = sourceIndex % RESOLUTION;
      const elevation = (heights[sourceIndex] / 65535) * TERRAIN_HEIGHT;

      const risk = calculateRisk(
        slopes[sourceIndex],
        newRainfall,
        newSoilMoisture,
        row,
        col,
        elevation,
        getNeighborAverage(sourceIndex)
      );

      totalRisk += risk;
      maxRisk = Math.max(maxRisk, risk);

      const color = getRiskColor(risk);

      // DEM-derived micro-shading: darken local creases/valleys while
      // preserving the risk hue. This is a lightweight AO-like pass.
      const relief = clamp(
        Math.abs(getNeighborAverage(sourceIndex) - elevation) / 110,
        0,
        1
      );
      const slopeShade = 0.86 + clamp(slopes[sourceIndex] / 90, 0, 1) * 0.16;
      const valleyShade = 1 - relief * 0.24;
      const shade = clamp(slopeShade * valleyShade, 0.58, 1.08);

      const colorIndex = i * 3;
      colors[colorIndex] = clamp(color.r * shade, 0, 1);
      colors[colorIndex + 1] = clamp(color.g * shade, 0, 1);
      colors[colorIndex + 2] = clamp(color.b * shade, 0, 1);
    }

    if (!geometry.attributes.color) {
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    }

    geometry.attributes.color.needsUpdate = true;

    setAverageRisk(totalRisk / sourceIndices.length);
    setMaximumRisk(maxRisk);

    const current = selectedLocationRef.current;

    if (current) {
      const risk = calculateRisk(
        current.slope,
        newRainfall,
        newSoilMoisture,
        current.row,
        current.col,
        current.elevation,
        current.neighborAverage
      );

      const next = {
        ...current,
        rainfall: newRainfall,
        soilMoisture: newSoilMoisture,
        risk,
        status: getRiskStatus(risk),
        apiRisk: null,
        apiStatus: null,
      };

      selectedLocationRef.current = next;
      setSelectedLocation(next);
      lastUpdatedAtRef.current = Date.now();
      setLastUpdatedAt(lastUpdatedAtRef.current);
    }
  };

  const predictWithAPI = async (location) => {
    const requestId = ++predictionRequestRef.current;
    setApiStatus("Predicting...");

    try {
      const rainfall24h = rainfallRef.current;
      const rainfall72h = Math.min(rainfall24h * 2.5, 1000);
      const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          elevation_m: Number(location.elevation.toFixed(2)),
          slope_degrees: Number(location.slope.toFixed(2)),
          rainfall_mm_24h: rainfall24h,
          rainfall_mm_72h: rainfall72h,
        }),
      });

      if (!response.ok) throw new Error(`API returned ${response.status}`);
      const result = await response.json();
      if (requestId !== predictionRequestRef.current) return;

      const apiRisk = Number(result.risk_probability_percent);
      const next = {
        ...location,
        risk: apiRisk,
        status: result.risk_level || getRiskStatus(apiRisk),
        apiRisk,
        apiStatus: result.risk_level || getRiskStatus(apiRisk),
        confidence: Number(result.confidence_percent ?? result.confidence ?? 87),
      };
      selectedLocationRef.current = next;
      setSelectedLocation(next);
      lastUpdatedAtRef.current = Date.now();
      setLastUpdatedAt(lastUpdatedAtRef.current);
      setApiStatus("Connected");
    } catch (error) {
      console.error("Prediction API error:", error);
      if (requestId !== predictionRequestRef.current) return;
      setApiStatus("Frontend prediction");
      const risk = calculateRisk(
        location.slope,
        rainfallRef.current,
        soilMoistureRef.current,
        location.row,
        location.col,
        location.elevation,
        location.neighborAverage
      );
      const next = { ...location, risk, status: getRiskStatus(risk), apiRisk: null, apiStatus: null, confidence: 87 };
      selectedLocationRef.current = next;
      setSelectedLocation(next);
    }
  };

  const handleRainfallChange = (event) => {
    const value = Number(event.target.value);
    rainfallRef.current = value;
    setRainfall(value);
    updateHeatmap(value, soilMoistureRef.current);
    if (selectedLocationRef.current) predictWithAPI(selectedLocationRef.current);
  };

  const handleSoilChange = (event) => {
    const value = Number(event.target.value);
    soilMoistureRef.current = value;
    setSoilMoisture(value);
    predictionRequestRef.current += 1;
    updateHeatmap(rainfallRef.current, value);
    setApiStatus("Frontend prediction");
  };

  const toggleLayer = (key) => {
    setLayers((current) => ({ ...current, [key]: !current[key] }));
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06111f);
    scene.fog = new THREE.FogExp2(0x06111f, 0.00013);

    const camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / Math.max(mount.clientHeight, 1),
      1,
      14000
    );
    camera.position.set(0, 1800, 3200);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    // Cap DPR: 2x/3x laptop displays can otherwise multiply every terrain pixel.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.setSize(mount.clientWidth, Math.max(mount.clientHeight, 1), false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;

    controls.minDistance = 650;
    controls.maxDistance = 7200;
    controls.minPolarAngle = 0.28;
    controls.maxPolarAngle = Math.PI / 2.03;

    // ================================================================
    // TRACKPAD / MOUSE CONTROLS
    //
    // 1-finger touch drag  -> rotate
    // 2-finger touch       -> browser gesture / zoom
    // wheel / 2-finger scroll -> zoom
    // mouse left drag      -> rotate
    // mouse right button   -> ignored
    // click                -> existing terrain inspection
    //
    // IMPORTANT:
    // A desktop browser does NOT expose a passive "one finger is moving
    // on a laptop trackpad" event. It exposes a drag only when the
    // primary pointer is pressed. Therefore this implementation uses
    // Pointer Events for touch/pen and OrbitControls for mouse.
    // ================================================================

    controls.enablePan = false;
    controls.enableRotate = false;
    controls.enableZoom = true;
    controls.zoomSpeed = 1.0;

    // Disable OrbitControls' mouse rotation. We handle mouse/touch
    // rotation ourselves so the interaction is deterministic.
    controls.mouseButtons.LEFT = -1;
    controls.mouseButtons.MIDDLE = -1;
    controls.mouseButtons.RIGHT = -1;

    controls.target.set(0, -60, 0);
    controls.update();

    const viewport = renderer.domElement;
    viewport.style.touchAction = "none";
    viewport.style.cursor = "grab";

    let gestureMode = "none";
    let activePointerId = null;
    let dragStartX = 0;
    let dragStartY = 0;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let dragDistance = 0;
    let pinchStartDistance = 0;
    let pinchLastDistance = 0;
    const activePointers = new Map();

    const rotateCamera = (dx, dy) => {
      const offset = camera.position.clone().sub(controls.target);
      const spherical = new THREE.Spherical().setFromVector3(offset);

      // Horizontal movement = orbit around the mountain.
      spherical.theta -= dx * 0.007;

      // Vertical movement = change camera elevation.
      spherical.phi -= dy * 0.005;
      spherical.phi = THREE.MathUtils.clamp(
        spherical.phi,
        controls.minPolarAngle,
        controls.maxPolarAngle
      );

      offset.setFromSpherical(spherical);
      camera.position.copy(controls.target).add(offset);
      camera.lookAt(controls.target);
    };

    const zoomCamera = (delta) => {
      const offset = camera.position.clone().sub(controls.target);
      const distance = offset.length();

      // Trackpad wheel values vary significantly between browsers.
      const amount = THREE.MathUtils.clamp(delta * 0.0014, -0.22, 0.22);
      const nextDistance = THREE.MathUtils.clamp(
        distance * (1 + amount),
        controls.minDistance,
        controls.maxDistance
      );

      offset.setLength(nextDistance);
      camera.position.copy(controls.target).add(offset);
      camera.lookAt(controls.target);
    };

    const getTouchDistance = () => {
      const points = Array.from(activePointers.values());
      if (points.length < 2) return 0;

      const dx = points[0].clientX - points[1].clientX;
      const dy = points[0].clientY - points[1].clientY;
      return Math.hypot(dx, dy);
    };

    const onPointerDown = (event) => {
      // Ignore right/middle mouse buttons.
      if (event.pointerType === "mouse" && event.button !== 0) return;

      activePointers.set(event.pointerId, {
        clientX: event.clientX,
        clientY: event.clientY,
      });

      if (activePointers.size === 1) {
        gestureMode = "rotate";
        activePointerId = event.pointerId;

        dragStartX = event.clientX;
        dragStartY = event.clientY;
        lastPointerX = event.clientX;
        lastPointerY = event.clientY;
        dragDistance = 0;

        viewport.style.cursor = "grabbing";

        try {
          viewport.setPointerCapture(event.pointerId);
        } catch (_) {}
      } else if (activePointers.size >= 2) {
        gestureMode = "pinch";
        activePointerId = null;
        pinchStartDistance = getTouchDistance();
        pinchLastDistance = pinchStartDistance;
      }
    };

    const onPointerMove = (event) => {
      if (!activePointers.has(event.pointerId)) return;

      activePointers.set(event.pointerId, {
        clientX: event.clientX,
        clientY: event.clientY,
      });

      // Two fingers = pinch zoom.
      if (activePointers.size >= 2) {
        gestureMode = "pinch";

        const distance = getTouchDistance();

        if (pinchLastDistance > 0 && distance > 0) {
          const delta = pinchLastDistance - distance;
          zoomCamera(delta * 1.8);
        }

        pinchLastDistance = distance;
        return;
      }

      // One finger = rotation.
      if (gestureMode !== "rotate" || event.pointerId !== activePointerId) {
        return;
      }

      const dx = event.clientX - lastPointerX;
      const dy = event.clientY - lastPointerY;

      lastPointerX = event.clientX;
      lastPointerY = event.clientY;

      dragDistance += Math.abs(dx) + Math.abs(dy);

      if (dragDistance > 3) {
        rotateCamera(dx, dy);
      }
    };

    const onPointerUp = (event) => {
      activePointers.delete(event.pointerId);

      try {
        viewport.releasePointerCapture(event.pointerId);
      } catch (_) {}

      if (activePointers.size === 0) {
        gestureMode = "none";
        activePointerId = null;
        viewport.style.cursor = "grab";
      } else if (activePointers.size === 1) {
        const remaining = Array.from(activePointers.entries())[0];
        activePointerId = remaining[0];
        gestureMode = "rotate";
        lastPointerX = remaining[1].clientX;
        lastPointerY = remaining[1].clientY;
      }
    };

    const onPointerCancel = (event) => {
      activePointers.delete(event.pointerId);

      if (activePointers.size === 0) {
        gestureMode = "none";
        activePointerId = null;
        viewport.style.cursor = "grab";
      }
    };

    const onWheelZoom = (event) => {
      // Two-finger trackpad scrolling arrives here as a wheel event.
      // Prevent page scrolling while the pointer is over the 3D viewport.
      event.preventDefault();
      zoomCamera(event.deltaY);
    };

    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("pointermove", onPointerMove);
    viewport.addEventListener("pointerup", onPointerUp);
    viewport.addEventListener("pointercancel", onPointerCancel);
    viewport.addEventListener("wheel", onWheelZoom, { passive: false });


    const hemi = new THREE.HemisphereLight(0xaed8df, 0x07110e, 1.05);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff1d0, 2.65);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.00018;
    sun.shadow.normalBias = 1.4;
    sun.shadow.camera.left = -2800;
    sun.shadow.camera.right = 2800;
    sun.shadow.camera.top = 2800;
    sun.shadow.camera.bottom = -2800;
    sun.shadow.camera.near = 100;
    sun.shadow.camera.far = 8000;
    scene.add(sun);

    const rim = new THREE.DirectionalLight(0x45e0d0, 0.65);
    rim.position.set(-2600, 1400, -1800);
    scene.add(rim);

    const grid = new THREE.GridHelper(TERRAIN_WIDTH, 36, 0x2a5964, 0x17313b);
    grid.position.y = -4;
    grid.material.transparent = true;
    grid.material.opacity = 0.26;
    scene.add(grid);

    const coordinateLines = new THREE.Group();
    for (let i = -1500; i <= 1500; i += 500) {
      const pointsX = [new THREE.Vector3(i, 2, -1800), new THREE.Vector3(i, 2, 1800)];
      const pointsZ = [new THREE.Vector3(-1800, 2, i), new THREE.Vector3(1800, 2, i)];
      const geometryX = new THREE.BufferGeometry().setFromPoints(pointsX);
      const geometryZ = new THREE.BufferGeometry().setFromPoints(pointsZ);
      const material = new THREE.LineBasicMaterial({ color: 0x3e7580, transparent: true, opacity: 0.14 });
      coordinateLines.add(new THREE.Line(geometryX, material));
      coordinateLines.add(new THREE.Line(geometryZ, material));
    }
    scene.add(coordinateLines);

    const terrainTexture = makeTerrainTexture();
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      SATELLITE_TEXTURE_URL,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.repeat.set(1, 1);
        if (terrainRef.current?.material) terrainRef.current.material.map = texture;
        if (terrainRef.current?.material) terrainRef.current.material.needsUpdate = true;
      },
      undefined,
      () => {
        console.info("Optional satellite texture not found. Using procedural topographic texture.");
      }
    );

    fetch(HEIGHTMAP_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`Could not load terrain.raw (${response.status})`);
        return response.arrayBuffer();
      })
      .then((buffer) => {
        const expectedSize = RESOLUTION * RESOLUTION * 2;
        if (buffer.byteLength !== expectedSize) {
          throw new Error(`Invalid RAW size. Expected ${expectedSize} bytes but received ${buffer.byteLength} bytes.`);
        }

        const heightData = new Uint16Array(buffer);
        heightsRef.current = heightData;

        // Render a 257x257 mesh instead of the full 1025x1025 DEM.
        // The original 1M-point DEM is still retained for slope/risk analysis.
        const geometry = new THREE.PlaneGeometry(
          TERRAIN_WIDTH,
          TERRAIN_DEPTH,
          RENDER_RESOLUTION - 1,
          RENDER_RESOLUTION - 1
        );
        geometryRef.current = geometry;
        const position = geometry.attributes.position;
        const renderSourceIndices = new Uint32Array(position.count);

        for (let row = 0; row < RENDER_RESOLUTION; row += 1) {
          const sourceRow = Math.round(
            (row / (RENDER_RESOLUTION - 1)) * (RESOLUTION - 1)
          );

          for (let col = 0; col < RENDER_RESOLUTION; col += 1) {
            const sourceCol = Math.round(
              (col / (RENDER_RESOLUTION - 1)) * (RESOLUTION - 1)
            );
            const renderIndex = row * RENDER_RESOLUTION + col;
            const sourceIndex = sourceRow * RESOLUTION + sourceCol;

            renderSourceIndices[renderIndex] = sourceIndex;
            position.setZ(
              renderIndex,
              (heightData[sourceIndex] / 65535) * TERRAIN_HEIGHT
            );
          }
        }

        renderSourceIndicesRef.current = renderSourceIndices;
        position.needsUpdate = true;

        const slopes = new Float32Array(RESOLUTION * RESOLUTION);
        const cellSize = TERRAIN_WIDTH / (RESOLUTION - 1);
        const getHeight = (row, col) => {
          const r = clamp(row, 0, RESOLUTION - 1);
          const c = clamp(col, 0, RESOLUTION - 1);
          return (heightData[r * RESOLUTION + c] / 65535) * TERRAIN_HEIGHT;
        };

        for (let row = 0; row < RESOLUTION; row += 1) {
          for (let col = 0; col < RESOLUTION; col += 1) {
            const index = row * RESOLUTION + col;
            const dx = (getHeight(row, col + 1) - getHeight(row, col - 1)) / (2 * cellSize);
            const dz = (getHeight(row + 1, col) - getHeight(row - 1, col)) / (2 * cellSize);
            slopes[index] = THREE.MathUtils.radToDeg(Math.atan(Math.sqrt(dx * dx + dz * dz)));
          }
        }
        slopesRef.current = slopes;

        const colors = new Float32Array(position.count * 3);
        for (let i = 0; i < position.count; i += 1) {
          const sourceIndex = renderSourceIndices[i];
          const row = Math.floor(sourceIndex / RESOLUTION);
          const col = sourceIndex % RESOLUTION;
          const elevation = (heightData[sourceIndex] / 65535) * TERRAIN_HEIGHT;
          const risk = calculateRisk(
            slopes[sourceIndex],
            rainfallRef.current,
            soilMoistureRef.current,
            row,
            col,
            elevation,
            getNeighborAverage(sourceIndex)
          );
          const color = getRiskColor(risk);
          const relief = clamp(
            Math.abs(getNeighborAverage(sourceIndex) - elevation) / 110,
            0,
            1
          );
          const slopeShade = 0.86 + clamp(slopes[sourceIndex] / 90, 0, 1) * 0.16;
          const shade = clamp(slopeShade * (1 - relief * 0.24), 0.58, 1.08);
          colors[i * 3] = clamp(color.r * shade, 0, 1);
          colors[i * 3 + 1] = clamp(color.g * shade, 0, 1);
          colors[i * 3 + 2] = clamp(color.b * shade, 0, 1);
        }
        geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
        geometry.computeVertexNormals();

        const material = new THREE.MeshPhysicalMaterial({
          vertexColors: true,
          map: terrainTexture,
          roughness: 0.84,
          metalness: 0.01,
          clearcoat: 0.12,
          clearcoatRoughness: 0.72,
          reflectivity: 0.28,
          side: THREE.DoubleSide,
        });

        const terrain = new THREE.Mesh(geometry, material);
        terrain.rotation.x = -Math.PI / 2;
        terrain.position.y = -TERRAIN_HEIGHT * 0.05;
        terrain.castShadow = false;
        terrain.receiveShadow = true;
        terrainRef.current = terrain;
        scene.add(terrain);

        grid.position.y = terrain.position.y - 2;
        updateHeatmap(rainfallRef.current, soilMoistureRef.current);

        const riskZones = new THREE.Group();
        const riskHalos = [];
        const riskPoints = [];
        const riskSamples = [
          [0.16, 0.26, 0.72],
          [0.54, 0.44, 0.92],
          [0.76, 0.68, 0.63],
          [0.38, 0.76, 0.82],
        ];

        riskSamples.forEach(([nx, nz, strength], index) => {
          const x = (nx - 0.5) * TERRAIN_WIDTH;
          const z = (nz - 0.5) * TERRAIN_DEPTH;
          const surfaceY =
            terrain.position.y + sampleTerrainElevation(heightData, x, z);

          const risk = strength * 100;
          const riskColor = getRiskColor(risk);

          const marker = new THREE.Mesh(
            new THREE.SphereGeometry(34 + strength * 18, 16, 16),
            new THREE.MeshStandardMaterial({
              color: riskColor,
              emissive: riskColor,
              emissiveIntensity: 0.55,
              roughness: 0.5,
              transparent: true,
              opacity: 0.92,
            })
          );
          marker.position.set(x, surfaceY + 20, z);
          marker.castShadow = true;
          marker.userData.baseY = marker.position.y;
          marker.userData.phase = index * 1.7;
          marker.userData.risk = risk;
          riskZones.add(marker);
          riskPoints.push(marker);

          // Multi-ring halo: stronger and faster for critical zones.
          for (let h = 0; h < 3; h += 1) {
            const halo = new THREE.Mesh(
              new THREE.RingGeometry(
                70 + h * 34,
                76 + h * 34,
                48
              ),
              new THREE.MeshBasicMaterial({
                color: riskColor,
                transparent: true,
                opacity: 0.13 - h * 0.025,
                side: THREE.DoubleSide,
                depthWrite: false,
              })
            );
            halo.rotation.x = -Math.PI / 2;
            halo.position.set(x, surfaceY + 10 + h * 2, z);
            halo.userData.phase = index * 1.4 + h * 0.3;
            halo.userData.risk = risk;
            riskZones.add(halo);
            riskHalos.push(halo);
          }
        });

        // Related-zone connector lines.
        const connectorPoints = riskPoints.map((point) => point.position.clone().setY(point.position.y + 3));
        const connectorGeometry = new THREE.BufferGeometry().setFromPoints([
          connectorPoints[0], connectorPoints[1],
          connectorPoints[1], connectorPoints[2],
          connectorPoints[2], connectorPoints[3],
        ]);
        const connectorMaterial = new THREE.LineBasicMaterial({
          color: 0xffb52e,
          transparent: true,
          opacity: 0.24,
          depthWrite: false,
        });
        const riskConnector = new THREE.LineSegments(
          connectorGeometry,
          connectorMaterial
        );
        riskZones.add(riskConnector);
        riskConnectorRef.current = riskConnector;

        // Soft smoke/fog sprites above critical clusters.
        const smokeTexture = makeSoftParticleTexture();
        const smokeCount = riskPoints.length * 9;
        const smokePositions = new Float32Array(smokeCount * 3);
        const smokeData = [];
        for (let i = 0; i < smokeCount; i += 1) {
          const zoneIndex = i % riskPoints.length;
          const base = riskPoints[zoneIndex].position;
          smokePositions[i * 3] = base.x + (hash2D(i, 12) - 0.5) * 90;
          smokePositions[i * 3 + 1] = base.y + 35 + hash2D(i, 17) * 160;
          smokePositions[i * 3 + 2] = base.z + (hash2D(i, 29) - 0.5) * 90;
          smokeData.push({
            zoneIndex,
            phase: hash2D(i, 41) * Math.PI * 2,
            speed: 0.25 + hash2D(i, 47) * 0.25,
          });
        }
        const smokeGeometry = new THREE.BufferGeometry();
        smokeGeometry.setAttribute(
          "position",
          new THREE.BufferAttribute(smokePositions, 3)
        );
        const smokePoints = new THREE.Points(
          smokeGeometry,
          new THREE.PointsMaterial({
            map: smokeTexture,
            color: 0xaab8b6,
            size: 72,
            transparent: true,
            opacity: 0.16,
            depthWrite: false,
            sizeAttenuation: true,
          })
        );
        smokePoints.userData.smokeData = smokeData;
        smokePoints.userData.basePositions = smokePositions.slice();
        smokePoints.renderOrder = 5;
        scene.add(smokePoints);
        riskSmokeRef.current = smokePoints;

        riskZonesRef.current = riskPoints;
        riskHaloRef.current = riskHalos;
        scene.add(riskZones);

        const beacon = new THREE.Group();

        const guide = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, -180, 0),
            new THREE.Vector3(0, 230, 0),
          ]),
          new THREE.LineBasicMaterial({
            color: 0x62fff0,
            transparent: true,
            opacity: 0.52,
            depthWrite: false,
          })
        );

        const pin = new THREE.Mesh(
          new THREE.SphereGeometry(22, 20, 20),
          new THREE.MeshStandardMaterial({
            color: 0x63fff0,
            emissive: 0x19bcae,
            emissiveIntensity: 1.8,
            roughness: 0.22,
          })
        );
        pin.castShadow = true;
        pin.receiveShadow = false;

        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(54, 4, 8, 36),
          new THREE.MeshBasicMaterial({
            color: 0x62fff0,
            transparent: true,
            opacity: 0.78,
            side: THREE.DoubleSide,
            depthWrite: false,
          })
        );
        ring.rotation.x = Math.PI / 2;

        const glow = new THREE.Mesh(
          new THREE.SphereGeometry(34, 16, 16),
          new THREE.MeshBasicMaterial({
            color: 0x42f5d1,
            transparent: true,
            opacity: 0.10,
            depthWrite: false,
          })
        );

        const spinRing = new THREE.Mesh(
          new THREE.TorusGeometry(72, 2.5, 7, 32),
          new THREE.MeshBasicMaterial({
            color: 0xb5fff7,
            transparent: true,
            opacity: 0.55,
            depthWrite: false,
          })
        );
        spinRing.rotation.x = Math.PI / 2;

        const beaconLight = new THREE.SpotLight(
          0x7dfff1,
          7,
          620,
          Math.PI / 5,
          0.62,
          1.2
        );
        beaconLight.position.set(0, 230, 0);
        beaconLight.castShadow = true;
        beaconLight.shadow.mapSize.set(512, 512);
        beaconLight.shadow.bias = -0.0004;
        beaconLight.shadow.normalBias = 1;
        const beaconTarget = new THREE.Object3D();
        beaconTarget.position.set(0, -20, 0);

        beacon.add(guide, pin, ring, glow, spinRing, beaconLight, beaconTarget);
        beaconLight.target = beaconTarget;
        beacon.visible = false;
        scene.add(beacon);
        beaconRef.current = beacon;
        beaconLightRef.current = beaconLight;
        beaconSpinRef.current = spinRing;

        const rippleGroup = new THREE.Group();
        for (let i = 0; i < 4; i += 1) {
          const ripple = new THREE.Mesh(
            new THREE.RingGeometry(30, 34, 64),
            new THREE.MeshBasicMaterial({ color: 0x49dff0, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
          );
          ripple.rotation.x = -Math.PI / 2;
          ripple.userData.phase = i * 0.25;
          rippleGroup.add(ripple);
        }
        rippleGroup.visible = false;
        scene.add(rippleGroup);
        rippleGroupRef.current = rippleGroup;

        const rainCount = 300;
        const rainPositions = new Float32Array(rainCount * 3);
        for (let i = 0; i < rainCount; i += 1) {
          rainPositions[i * 3] = (Math.random() - 0.5) * TERRAIN_WIDTH;
          rainPositions[i * 3 + 1] = 150 + Math.random() * 1100;
          rainPositions[i * 3 + 2] = (Math.random() - 0.5) * TERRAIN_DEPTH;
        }
        const rainGeometry = new THREE.BufferGeometry();
        rainGeometry.setAttribute("position", new THREE.BufferAttribute(rainPositions, 3));
        const rainPoints = new THREE.Points(
          rainGeometry,
          new THREE.PointsMaterial({ color: 0x58dff1, size: 7, transparent: true, opacity: 0.45, depthWrite: false })
        );
        rainPoints.visible = false;
        scene.add(rainPoints);
        rainParticlesRef.current = rainPoints;

        // ---------------------------------------------------------
        // ---------------------------------------------------------
        // TERRAIN-DERIVED MOUNTAIN STREAMS
        // Lightweight flat ribbons are used instead of 3D tubes.
        // This makes the water sit inside the valleys rather than
        // looking like a pipe placed on top of the mountains.
        // ---------------------------------------------------------
        const waterGroup = new THREE.Group();
        waterGroup.name = "TerrainDerivedMountainStreams";
        const allWaterRoutes = [];

        const streamRoutes = [
          [-1500, -1150, 1250, 980, 58],
          [1450, -1050, -1150, 1180, 46],
          [-1350, 1050, 850, 1500, 36],
        ];

        streamRoutes.forEach(([startX, startZ, endX, endZ, baseWidth], streamIndex) => {
          const route = buildValleyStreamPoints(
            heightData,
            startX,
            startZ,
            endX,
            endZ,
            72
          );

          // Make the flow direction follow descending terrain.
          if (route[0].y < route[route.length - 1].y) {
            route.reverse();
          }

          allWaterRoutes.push(route);

          // The main water surface.
          const widths = route.map((_, i) => {
            const t = i / Math.max(route.length - 1, 1);
            const widening = 0.72 + Math.sin(Math.PI * t) * 0.42;
            return baseWidth * widening;
          });

          const waterGeometry = createWaterRibbonGeometry(route, widths);
          const flowDrop = Math.abs(route[0].y - route[route.length - 1].y);
          const flowIntensity = clamp(flowDrop / 260, 0, 1);
          const waterMaterial = createWaterMaterial(
            0.72 + streamIndex * 0.08 + flowIntensity * 0.16,
            0.48 + flowIntensity * 0.30
          );

          const stream = new THREE.Mesh(waterGeometry, waterMaterial);
          stream.position.y = terrain.position.y;
          stream.renderOrder = 3;
          stream.userData.flowMaterial = waterMaterial;
          stream.userData.route = route;
          waterGroup.add(stream);

          // Dark wet banks: slightly wider and almost transparent.
          const bankGeometry = createWaterBankGeometry(route, baseWidth + 16);
          const bankMaterial = new THREE.MeshBasicMaterial({
            color: 0x183f46,
            transparent: true,
            opacity: 0.24,
            depthWrite: false,
            side: THREE.DoubleSide,
          });

          const banks = new THREE.Mesh(bankGeometry, bankMaterial);
          banks.position.y = terrain.position.y - 1;
          banks.renderOrder = 2;
          waterGroup.add(banks);

          // A very thin silver reflection line moves with the water.
          const highlightWidths = widths.map((w) => w * 0.13);
          const highlightGeometry = createWaterRibbonGeometry(
            route,
            highlightWidths
          );
          const highlightMaterial = createWaterMaterial(
            1.25 + streamIndex * 0.1 + flowIntensity * 0.18,
            0.26 + flowIntensity * 0.20
          );

          const highlight = new THREE.Mesh(
            highlightGeometry,
            highlightMaterial
          );
          highlight.position.y = terrain.position.y + 5;
          highlight.renderOrder = 4;
          highlight.userData.flowMaterial = highlightMaterial;
          waterGroup.add(highlight);
        });

        // Branching drainage tributaries. These are generated from the
        // DEM-derived main valleys to give the network a natural,
        // fractal-like appearance without claiming exact hydrography.
        const branchSpecs = [
          [0, 22, 30, -1, 34],
          [0, 46, 25, 1, 27],
          [1, 28, 28, 1, 30],
          [1, 52, 22, -1, 25],
          [2, 24, 24, -1, 22],
          [2, 50, 20, 1, 20],
        ];

        branchSpecs.forEach(([parentIndex, anchorIndex, length, sideSign, width]) => {
          const parentRoute = allWaterRoutes[parentIndex];
          if (!parentRoute) return;

          const branchRoute = buildBranchRoute(
            heightData,
            parentRoute,
            anchorIndex,
            length,
            sideSign
          );

          // Orient the branch so it drains toward the parent valley.
          if (branchRoute[0].y < branchRoute[branchRoute.length - 1].y) {
            branchRoute.reverse();
          }

          allWaterRoutes.push(branchRoute);

          const branchWidths = branchRoute.map((_, i) => {
            const t = i / Math.max(branchRoute.length - 1, 1);
            return width * (0.58 + Math.sin(Math.PI * t) * 0.22);
          });

          const branchDrop = Math.abs(branchRoute[0].y - branchRoute[branchRoute.length - 1].y);
          const branchIntensity = clamp(branchDrop / 220, 0, 1);

          const branchWater = new THREE.Mesh(
            createWaterRibbonGeometry(branchRoute, branchWidths),
            createWaterMaterial(0.82 + branchIntensity * 0.16, 0.30 + branchIntensity * 0.28)
          );
          branchWater.position.y = terrain.position.y;
          branchWater.renderOrder = 3;
          branchWater.userData.flowMaterial = branchWater.material;
          branchWater.userData.route = branchRoute;
          waterGroup.add(branchWater);

          const branchHighlight = new THREE.Mesh(
            createWaterRibbonGeometry(
              branchRoute,
              branchWidths.map((value) => value * 0.11)
            ),
            createWaterMaterial(1.20 + branchIntensity * 0.18, 0.18 + branchIntensity * 0.16)
          );
          branchHighlight.position.y = terrain.position.y + 4;
          branchHighlight.renderOrder = 4;
          branchHighlight.userData.flowMaterial = branchHighlight.material;
          waterGroup.add(branchHighlight);
        });

        // Small particles travel along each stream route to make the
        // direction of flow obvious without turning the water into neon tubes.
        const flowParticleCount = 180;
        const flowPositions = new Float32Array(flowParticleCount * 3);
        const flowData = [];

        for (let i = 0; i < flowParticleCount; i += 1) {
          const streamIndex = i % allWaterRoutes.length;
          const route = allWaterRoutes[streamIndex];

          if (!route) continue;

          const progress = hash2D(i, 63);
          const routeIndex = Math.floor(progress * (route.length - 1));
          const point = route[routeIndex];

          flowPositions[i * 3] = point.x;
          flowPositions[i * 3 + 1] = point.y + terrain.position.y + 10;
          flowPositions[i * 3 + 2] = point.z;

          flowData.push({
            streamIndex,
            progress,
            speed: 0.035 + hash2D(i, 77) * 0.035,
            phase: hash2D(i, 83) * Math.PI * 2,
          });
        }

        const flowGeometry = new THREE.BufferGeometry();
        flowGeometry.setAttribute(
          "position",
          new THREE.BufferAttribute(flowPositions, 3)
        );
        const flowPoints = new THREE.Points(
          flowGeometry,
          new THREE.PointsMaterial({
            color: 0xd5ffff,
            size: 8,
            transparent: true,
            opacity: 0.72,
            depthWrite: false,
            sizeAttenuation: true,
          })
        );
        flowPoints.userData.flowData = flowData;
        flowPoints.userData.streamGroups = allWaterRoutes.map(() =>
          []
        );
        flowPoints.renderOrder = 5;
        scene.add(flowPoints);
        waterFlowParticlesRef.current = flowPoints;

        waterGroup.visible = true;
        waterGroup.userData.simulated = true;
        waterGroup.userData.routes = allWaterRoutes;
        scene.add(waterGroup);
        waterStreamsRef.current = waterGroup;

        const faultGroup = new THREE.Group();
        const faultPaths = [
          [[-1500, -800], [-900, -350], [-200, -120], [650, 180], [1450, 650]],
          [[-1200, 900], [-600, 650], [50, 520], [700, 340], [1450, 80]],
        ];
        faultPaths.forEach((path) => {
          const points = path.map(([x, z]) => new THREE.Vector3(x, TERRAIN_HEIGHT * 0.45, z));
          const line = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(points),
            new THREE.LineBasicMaterial({ color: 0xe74c3c, transparent: true, opacity: 0.8 })
          );
          faultGroup.add(line);
        });
        faultGroup.visible = false;
        scene.add(faultGroup);
        faultGroup.userData.illustrative = true;

        const historyGroup = new THREE.Group();
        for (let i = 0; i < 10; i += 1) {
          const x = -1500 + hash2D(i, 4) * 3000;
          const z = -1500 + hash2D(i, 9) * 3000;
          const marker = new THREE.Mesh(
            new THREE.SphereGeometry(18, 12, 12),
            new THREE.MeshBasicMaterial({ color: 0xffad33 })
          );
          marker.position.set(x, TERRAIN_HEIGHT * 0.45, z);
          marker.userData.year = 2017 + i;
          historyGroup.add(marker);
        }
        scene.add(historyGroup);

        const infrastructureGroup = new THREE.Group();
        const infrastructure = [
          [-1050, -420, "ROAD CORRIDOR"],
          [720, 540, "SETTLEMENT ZONE"],
          [240, -980, "MONITORING POINT"],
        ];
        infrastructure.forEach(([x, z, label]) => {
          const y = terrain.position.y + sampleTerrainElevation(heightData, x, z) + 16;

          const marker = new THREE.Mesh(
            new THREE.SphereGeometry(24, 12, 12),
            new THREE.MeshStandardMaterial({
              color: 0xf4ffff,
              emissive: 0x5edbd2,
              emissiveIntensity: 0.6,
              roughness: 0.45,
            })
          );
          marker.position.set(x, y, z);
          marker.castShadow = true;
          marker.userData.label = label;
          infrastructureGroup.add(marker);
        });

        const roadPath = [
          new THREE.Vector3(-1650, terrain.position.y + 12, -720),
          new THREE.Vector3(-1050, terrain.position.y + 16, -420),
          new THREE.Vector3(-420, terrain.position.y + 14, -140),
          new THREE.Vector3(260, terrain.position.y + 18, 220),
          new THREE.Vector3(920, terrain.position.y + 20, 540),
          new THREE.Vector3(1550, terrain.position.y + 14, 820),
        ];
        const roadLine = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(roadPath),
          new THREE.LineBasicMaterial({
            color: 0xf2ffff,
            transparent: true,
            opacity: 0.72,
            depthWrite: false,
          })
        );
        infrastructureGroup.add(roadLine);

        const villagePositions = [
          [-1050, -420],
          [720, 540],
        ];
        villagePositions.forEach(([x, z]) => {
          const y = terrain.position.y + sampleTerrainElevation(heightData, x, z) + 10;
          const ring = new THREE.Mesh(
            new THREE.RingGeometry(90, 96, 40),
            new THREE.MeshBasicMaterial({
              color: 0xf2ffff,
              transparent: true,
              opacity: 0.46,
              side: THREE.DoubleSide,
              depthWrite: false,
            })
          );
          ring.rotation.x = -Math.PI / 2;
          ring.position.set(x, y, z);
          infrastructureGroup.add(ring);
        });

        scene.add(infrastructureGroup);

        terrain.userData.overlayGroups = {
          faultGroup,
          historyGroup,
          infrastructureGroup,
          rainPoints,
          riskZones,
          waterGroup,
          coordinateLines,
        };
      })
      .catch((error) => console.error("Terrain loading error:", error));

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const updatePointer = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const processHover = () => {
      pointerRafRef.current = null;

      if (isInteractingRef.current || !pointerPendingRef.current) return;

      const event = pointerPendingRef.current;
      pointerPendingRef.current = null;

      updatePointer(event);
      if (!terrainRef.current) return;

      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObject(terrainRef.current, false);

      if (!hits.length || !heightsRef.current || !slopesRef.current) {
        setHoveredLocation(null);
        return;
      }

      const hit = hits[0];
      const local = terrainRef.current.worldToLocal(hit.point.clone());
      const x = local.x + TERRAIN_WIDTH / 2;
      const depth = -local.y + TERRAIN_DEPTH / 2;
      const col = clamp(
        Math.round((x / TERRAIN_WIDTH) * (RESOLUTION - 1)),
        0,
        RESOLUTION - 1
      );
      const row = clamp(
        Math.round((depth / TERRAIN_DEPTH) * (RESOLUTION - 1)),
        0,
        RESOLUTION - 1
      );
      const index = row * RESOLUTION + col;
      const elevation = (heightsRef.current[index] / 65535) * TERRAIN_HEIGHT;
      const slope = slopesRef.current[index];
      const risk = riskForIndex(index);

      setHoveredLocation({
        x: x.toFixed(0),
        z: depth.toFixed(0),
        elevation,
        slope,
        risk,
        geology: getGeologicalFormation(row, col),
        event: getLastRecordedEvent(row, col),
      });
    };

    const handlePointerMove = (event) => {
      pointerPendingRef.current = event;

      // Hover raycasting is deliberately throttled. Raycasting on every
      // mousemove makes a heavy terrain feel sticky during OrbitControls.
      if (!pointerRafRef.current) {
        pointerRafRef.current = requestAnimationFrame(processHover);
      }
    };

    const handleControlStart = () => {
      isInteractingRef.current = true;
      if (pointerRafRef.current) {
        cancelAnimationFrame(pointerRafRef.current);
        pointerRafRef.current = null;
      }
    };

    const handleControlEnd = () => {
      isInteractingRef.current = false;
    };

    controls.addEventListener("start", handleControlStart);
    controls.addEventListener("end", handleControlEnd);

    const handleClick = (event) => {
      updatePointer(event);
      if (!terrainRef.current || !heightsRef.current || !slopesRef.current) return;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObject(terrainRef.current, false);
      if (!hits.length) return;

      const hit = hits[0];
      const local = terrainRef.current.worldToLocal(hit.point.clone());
      const x = local.x + TERRAIN_WIDTH / 2;
      const depth = -local.y + TERRAIN_DEPTH / 2;
      const col = clamp(Math.round((x / TERRAIN_WIDTH) * (RESOLUTION - 1)), 0, RESOLUTION - 1);
      const row = clamp(Math.round((depth / TERRAIN_DEPTH) * (RESOLUTION - 1)), 0, RESOLUTION - 1);
      const index = row * RESOLUTION + col;
      const elevation = (heightsRef.current[index] / 65535) * TERRAIN_HEIGHT;
      const slope = slopesRef.current[index];
      const neighborAverage = getNeighborAverage(index);
      const risk = calculateRisk(slope, rainfallRef.current, soilMoistureRef.current, row, col, elevation, neighborAverage);
      const ndvi = getNdvi(row, col, elevation, slope);
      const soil = getSoilComposition(slope, elevation);

      const location = {
        x,
        z: depth,
        row,
        col,
        elevation,
        slope,
        rainfall: rainfallRef.current,
        soilMoisture: soilMoistureRef.current,
        risk,
        status: getRiskStatus(risk),
        apiRisk: null,
        apiStatus: null,
        confidence: 87,
        ndvi,
        soil,
        geologicalFormation: getGeologicalFormation(row, col),
        lastEvent: getLastRecordedEvent(row, col),
        worldX: hit.point.x,
        worldY: hit.point.y,
        worldZ: hit.point.z,
        neighborAverage,
      };

      selectedLocationRef.current = location;
      setSelectedLocation(location);
      predictWithAPI(location);

      if (beaconRef.current) {
        beaconRef.current.position.set(hit.point.x, hit.point.y + 2, hit.point.z);
        beaconRef.current.visible = true;
      }
      if (rippleGroupRef.current) {
        rippleGroupRef.current.position.set(hit.point.x, hit.point.y + 4, hit.point.z);
        rippleGroupRef.current.visible = true;
      }

      cameraTransitionRef.current = {
        start: camera.position.clone(),
        end: hit.point.clone().add(new THREE.Vector3(620, 430, 620)),
        startTarget: controls.target.clone(),
        endTarget: hit.point.clone(),
        progress: 0,
      };
    };

    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("click", handleClick);

    const handleResize = () => {
      const width = Math.max(mount.clientWidth, 1);
      const height = Math.max(mount.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    window.addEventListener("resize", handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(mount);
    handleResize();

    let animationId;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      const angle = THREE.MathUtils.degToRad(sunAngleRef.current);
      sun.position.set(Math.cos(angle) * 2600, 2400, Math.sin(angle) * 2600);

      if (cameraTransitionRef.current) {
        const transition = cameraTransitionRef.current;
        transition.progress = Math.min(transition.progress + 0.035, 1);
        const eased = 1 - Math.pow(1 - transition.progress, 3);
        camera.position.lerpVectors(transition.start, transition.end, eased);
        controls.target.lerpVectors(transition.startTarget, transition.endTarget, eased);
        if (transition.progress >= 1) cameraTransitionRef.current = null;
      }

      riskZonesRef.current.forEach((zone) => {
        const risk = zone.userData.risk ?? 50;
        const pulseSpeed = 1.15 + risk / 42;
        const breathe = 1 + Math.sin(elapsed * pulseSpeed + zone.userData.phase) * (0.045 + risk / 1800);
        zone.scale.setScalar(breathe);
        zone.position.y = zone.userData.baseY + Math.sin(elapsed * 0.8 + zone.userData.phase) * 5;
      });

      riskHaloRef.current.forEach((halo) => {
        const risk = halo.userData.risk ?? 50;
        const pulseSpeed = 1.0 + risk / 38;
        const t = (Math.sin(elapsed * pulseSpeed + halo.userData.phase) + 1) * 0.5;
        halo.scale.setScalar(1 + t * 0.24);
        halo.material.opacity = 0.05 + t * (0.12 + risk / 900);
      });

      if (riskSmokeRef.current) {
        const smokePositions = riskSmokeRef.current.geometry.attributes.position.array;
        const base = riskSmokeRef.current.userData.basePositions;
        const smokeData = riskSmokeRef.current.userData.smokeData || [];

        for (let i = 0; i < smokeData.length; i += 1) {
          const item = smokeData[i];
          const j = i * 3;
          smokePositions[j] = base[j] + Math.sin(elapsed * item.speed + item.phase) * 18;
          smokePositions[j + 1] = base[j + 1] + ((elapsed * (9 + item.speed * 8)) % 150);
          smokePositions[j + 2] = base[j + 2] + Math.cos(elapsed * item.speed + item.phase) * 18;
        }

        riskSmokeRef.current.geometry.attributes.position.needsUpdate = true;
      }

      if (riskConnectorRef.current) {
        riskConnectorRef.current.material.opacity = 0.18 + Math.sin(elapsed * 1.4) * 0.06;
      }

      if (rainParticlesRef.current) {
        const positions = rainParticlesRef.current.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
          positions[i + 1] -= 12 + rainfallRef.current * 0.025;
          if (positions[i + 1] < 0) positions[i + 1] = 1300 + Math.random() * 300;
        }
        rainParticlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      if (beaconRef.current?.visible) {
        const pulse = 1 + Math.sin(elapsed * 4) * 0.16;
        beaconRef.current.children[1].scale.setScalar(pulse);
        beaconRef.current.children[2].scale.setScalar(1 + Math.sin(elapsed * 2.5) * 0.2);

        if (beaconSpinRef.current) {
          beaconSpinRef.current.rotation.z = elapsed * 0.65;
        }

        if (beaconLightRef.current) {
          beaconLightRef.current.intensity = 6.2 + Math.sin(elapsed * 3.5) * 1.4;
        }
      }

      if (rippleGroupRef.current?.visible) {
        rippleGroupRef.current.children.forEach((ripple, index) => {
          const t = (elapsed * 0.55 + ripple.userData.phase) % 1;
          const scale = 1 + t * 8;
          ripple.scale.setScalar(scale);
          ripple.material.opacity = (1 - t) * 0.38;
        });
      }

      if (waterStreamsRef.current) {
        const flowSpeed = 0.68 + rainfallRef.current * 0.0028;

        waterStreamsRef.current.children.forEach((stream) => {
          const material = stream.userData.flowMaterial;

          if (material?.uniforms) {
            material.uniforms.uTime.value = elapsed;
            material.uniforms.uSpeed.value = flowSpeed;
          }
        });
      }

      if (waterFlowParticlesRef.current && waterStreamsRef.current?.userData.routes) {
        const positions = waterFlowParticlesRef.current.geometry.attributes.position.array;
        const flowData = waterFlowParticlesRef.current.userData.flowData || [];
        const routes = waterStreamsRef.current.userData.routes;

        for (let i = 0; i < flowData.length; i += 1) {
          const item = flowData[i];
          const route = routes[item.streamIndex];
          if (!route || route.length < 2) continue;

          const progress =
            (item.progress + elapsed * item.speed * (0.7 + rainfallRef.current * 0.0025)) % 1;
          const scaled = progress * (route.length - 1);
          const index = Math.floor(scaled);
          const t = scaled - index;

          const a = route[index];
          const b = route[Math.min(index + 1, route.length - 1)];

          const j = i * 3;
          positions[j] = THREE.MathUtils.lerp(a.x, b.x, t);
          positions[j + 1] = THREE.MathUtils.lerp(a.y, b.y, t) + terrainRef.current.position.y + 12;
          positions[j + 2] = THREE.MathUtils.lerp(a.z, b.z, t);
        }

        waterFlowParticlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      viewport.removeEventListener("pointerdown", onPointerDown);
      viewport.removeEventListener("pointermove", onPointerMove);
      viewport.removeEventListener("pointerup", onPointerUp);
      viewport.removeEventListener("pointercancel", onPointerCancel);
      viewport.removeEventListener("wheel", onWheelZoom);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("click", handleClick);
      controls.removeEventListener("start", handleControlStart);
      controls.removeEventListener("end", handleControlEnd);
      if (pointerRafRef.current) cancelAnimationFrame(pointerRafRef.current);
      controls.dispose();
      terrainTexture.dispose();
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
          else object.material.dispose();
        }
      });
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      terrainRef.current = null;
      geometryRef.current = null;
      heightsRef.current = null;
      slopesRef.current = null;
      waterStreamsRef.current = null;
      waterFlowParticlesRef.current = null;
      riskHaloRef.current = [];
      riskSmokeRef.current = null;
      riskConnectorRef.current = null;
      beaconLightRef.current = null;
      beaconSpinRef.current = null;
      renderSourceIndicesRef.current = null;
      pointerPendingRef.current = null;
      pointerRafRef.current = null;
    };
  }, []);

  useEffect(() => {
    const terrain = terrainRef.current;
    if (!terrain?.userData.overlayGroups) return;
    const { faultGroup, historyGroup, infrastructureGroup, rainPoints, waterGroup, coordinateLines } = terrain.userData.overlayGroups;
    faultGroup.visible = layers.faults;
    historyGroup.visible = layers.history;
    infrastructureGroup.visible = layers.infrastructure;
    rainPoints.visible = layers.rainfall;
    waterGroup.visible = layers.water;
    if (coordinateLines) coordinateLines.visible = true;
  }, [layers]);

  const displayedRisk = selectedLocation ? selectedLocation.risk : 0;
  const displayedStatus = selectedLocation ? selectedLocation.status : "—";
  const showWarning = Boolean(selectedLocation) && displayedRisk >= riskThreshold;
  const contributing = {
    rainfall: 40,
    slope: 35,
    soil: 25,
  };

  const sevenDayRain = [48, 67, 82, 74, 96, 108, rainfall];
  const rainMax = Math.max(...sevenDayRain, 120);
  const selectedNdvi = selectedLocation?.ndvi ?? 0.68;
  const selectedSoil = selectedLocation?.soil ?? { rock: 42, clay: 29, silt: 29 };

  const scenarioRainfall = clamp(rainfall + whatIfRain, 0, MAX_RAINFALL);
  const scenarioSoil = clamp(soilMoisture - whatIfSoilDrop, 0, 100);
  const scenarioRisk = selectedLocation
    ? calculateRisk(
        selectedLocation.slope,
        scenarioRainfall,
        scenarioSoil,
        selectedLocation.row,
        selectedLocation.col,
        selectedLocation.elevation,
        selectedLocation.neighborAverage
      )
    : 0;

  const uncertainty = selectedLocation
    ? Math.max(5, Math.round(16 - (selectedLocation.confidence ?? 87) * 0.08))
    : 9;
  const uncertaintyLow = Math.max(0, Math.round(displayedRisk - uncertainty));
  const uncertaintyHigh = Math.min(100, Math.round(displayedRisk + uncertainty));

  const thirtyDayRisk = buildThirtyDayRisk(displayedRisk || averageRisk || 35);
  const highRiskDays = thirtyDayRisk.filter((item) => item.risk >= 60).map((item) => item.day);
  const riskTrendPoints = thirtyDayRisk.map((item, index) => {
    const x = (index / 29) * 300;
    const y = 78 - (item.risk / 100) * 64;
    return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  const freshnessText = formatRelativeTime(lastUpdatedAt);
  const historicalComparison = 34;
  const anomalyDelta = Math.round(displayedRisk - historicalComparison);

  const alertTimeline = [
    { time: "10:00 AM", status: "LOW", value: 28, detail: "Baseline conditions" },
    { time: "2:00 PM", status: "MEDIUM", value: 54, detail: "Rainfall and saturation rising" },
    { time: "5:00 PM", status: "HIGH", value: Math.max(72, Math.round(displayedRisk)), detail: "Current elevated-risk condition" },
  ];

  const infrastructureStatus = (baseRisk, offset = 0) => {
    const value = clamp(baseRisk + offset, 0, 100);
    if (value >= 70) return { label: "HIGH", color: "#ff6655" };
    if (value >= 45) return { label: "AT RISK", color: "#ffb52e" };
    return { label: "SAFE", color: "#69e7bd" };
  };

  const villageA = infrastructureStatus(displayedRisk, -10);
  const villageB = infrastructureStatus(displayedRisk, 2);
  const villageC = infrastructureStatus(displayedRisk, 12);
  const roadStatus = infrastructureStatus(displayedRisk, 6);

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        html, body, #root { width:100%; height:100%; margin:0; padding:0; overflow:hidden; background:#06111f; }
        .terrain-root { position:fixed; inset:0; width:100vw; height:100dvh; overflow:hidden; background:#06111f; color:#eefcfa; font-family:Inter,Arial,Helvetica,sans-serif; }
        .terrain-root::before { content:""; position:absolute; inset:0; pointer-events:none; z-index:0; opacity:.16; background-image:linear-gradient(rgba(83,145,154,.11) 1px, transparent 1px),linear-gradient(90deg,rgba(83,145,154,.11) 1px, transparent 1px); background-size:72px 72px; mask-image:linear-gradient(to bottom,rgba(0,0,0,.7),transparent 82%); }
        .terrain-root::after { content:""; position:absolute; inset:0; pointer-events:none; z-index:4; opacity:.055; background-image:radial-gradient(rgba(255,255,255,.5) .7px,transparent .8px); background-size:4px 4px; mix-blend-mode:screen; }
        .terrain-canvas { position:absolute; inset:0; z-index:1; will-change:transform; }
        .hud { position:absolute; z-index:10; width:min(365px,30vw); min-width:290px; padding:18px; border:1px solid rgba(108,222,211,.22); border-radius:18px; background:linear-gradient(145deg,rgba(4,20,29,.92),rgba(4,13,23,.78)); box-shadow:0 18px 60px rgba(0,0,0,.38), inset 0 1px rgba(255,255,255,.05); backdrop-filter:blur(16px); }
        .hud-left { top:18px; left:18px; max-height:calc(100dvh - 36px); overflow:auto; }
        .hud-right { top:18px; right:18px; max-height:calc(100dvh - 36px); overflow:auto; }
        .hud::-webkit-scrollbar { width:4px; } .hud::-webkit-scrollbar-thumb { background:rgba(91,211,202,.28); border-radius:10px; }
        .eyebrow { font-size:9px; letter-spacing:1.8px; color:#65e3d5; font-weight:800; text-transform:uppercase; }
        .title { margin:5px 0 2px; font-size:22px; letter-spacing:-.5px; } .muted { color:#8ba5aa; font-size:11px; line-height:1.5; }
        .status-line { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:15px; }
        .live { display:inline-flex; align-items:center; gap:6px; color:#77f1bf; font-size:10px; font-weight:800; } .live i { width:7px; height:7px; border-radius:50%; background:#4df1a9; box-shadow:0 0 14px #4df1a9; animation:pulse 1.5s infinite; }
        @keyframes pulse { 50% { transform:scale(1.45); opacity:.55; } }
        .section { border-top:1px solid rgba(130,190,194,.12); margin-top:14px; padding-top:13px; }
        .row { display:flex; justify-content:space-between; align-items:center; gap:12px; margin:9px 0; font-size:11px; color:#91a8ac; } .row strong { color:#f3fffd; font-size:12px; }
        .slider { width:100%; accent-color:#45d9c7; cursor:pointer; }
        .mini-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:10px; } .metric { padding:10px; border:1px solid rgba(116,195,197,.12); border-radius:11px; background:rgba(255,255,255,.025); } .metric span { display:block; color:#718d92; font-size:8px; letter-spacing:1px; text-transform:uppercase; } .metric strong { display:block; margin-top:4px; font-size:15px; }
        .risk-number { font-size:39px; line-height:1; font-weight:800; margin-top:7px; } .risk-number small { font-size:13px; color:#7d989c; }
        .risk-pill { display:inline-flex; padding:5px 8px; border-radius:99px; margin-top:8px; font-size:9px; font-weight:800; letter-spacing:1px; background:rgba(255,91,65,.12); color:#ff947e; border:1px solid rgba(255,91,65,.2); }
        .factor { margin:9px 0; } .factor-head { display:flex; justify-content:space-between; font-size:9px; color:#91a7ab; } .factor-track { height:5px; border-radius:8px; background:#12262d; overflow:hidden; margin-top:5px; } .factor-track b { display:block; height:100%; border-radius:8px; background:linear-gradient(90deg,#37cdbb,#8bf1de); }
        .warning { margin-top:12px; padding:11px; border-radius:12px; border:1px solid rgba(255,91,65,.3); background:rgba(255,69,48,.09); } .warning strong { color:#ff9a84; font-size:11px; } .warning p { margin:6px 0 0; color:#c8d9d8; font-size:10px; line-height:1.45; }
        .layers { display:grid; grid-template-columns:1fr 1fr; gap:7px; margin-top:9px; } .layer-btn { border:1px solid rgba(112,190,192,.16); background:rgba(255,255,255,.025); color:#8da7aa; border-radius:9px; padding:8px 7px; font-size:9px; cursor:pointer; text-align:left; } .layer-btn.active { color:#a7fff0; border-color:rgba(72,224,206,.45); background:rgba(52,203,184,.08); }
        .chart { margin-top:9px; padding:9px 5px 3px; border:1px solid rgba(112,190,192,.12); border-radius:11px; background:rgba(0,0,0,.12); } .chart svg { width:100%; height:90px; display:block; } .chart-legend { display:flex; justify-content:space-between; color:#657f84; font-size:8px; }
        .soil-bar { display:flex; height:8px; border-radius:8px; overflow:hidden; margin-top:8px; } .soil-rock{background:#9c7152}.soil-clay{background:#c19a68}.soil-silt{background:#6da99b}
        .control-title { display:flex; justify-content:space-between; align-items:center; } .control-title strong { font-size:10px; }
        .hover-card { position:absolute; z-index:20; right:18px; bottom:18px; min-width:205px; padding:12px; border-radius:13px; border:1px solid rgba(94,213,205,.24); background:rgba(4,17,25,.86); backdrop-filter:blur(12px); pointer-events:none; } .hover-card b { color:#9ff9ec; font-size:11px; } .hover-grid { display:grid; grid-template-columns:1fr 1fr; gap:5px 12px; margin-top:8px; color:#819da0; font-size:9px; } .hover-grid strong { color:#f1fffd; }
        .interaction-hint {
          position:absolute;
          top:48px;
          left:50%;
          transform:translateX(-50%);
          z-index:20;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:9px;
          padding:9px 14px;
          min-width:420px;
          border:1px solid rgba(91,224,213,.24);
          border-radius:999px;
          background:rgba(3,18,25,.76);
          box-shadow:0 8px 28px rgba(0,0,0,.24), 0 0 22px rgba(45,208,194,.06);
          backdrop-filter:blur(12px);
          -webkit-backdrop-filter:blur(12px);
          color:#a9c5c7;
          font-size:9px;
          letter-spacing:.035em;
          pointer-events:none;
          white-space:nowrap;
        }
        .top-badge { position:absolute; z-index:11; top:18px; left:50%; transform:translateX(-50%); padding:8px 12px; border-radius:99px; background:rgba(4,18,25,.72); border:1px solid rgba(101,224,211,.22); color:#9cefe4; font-size:9px; letter-spacing:1.3px; backdrop-filter:blur(10px); }
        .legend { position:absolute; z-index:10; left:50%; bottom:18px; transform:translateX(-50%); display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:12px; background:rgba(4,18,25,.76); border:1px solid rgba(108,190,194,.18); backdrop-filter:blur(12px); font-size:8px; color:#90a7aa; } .gradient { width:170px; height:7px; border-radius:10px; background:linear-gradient(90deg,#168b4f,#35b86b,#8fca4b,#f0d34a,#ffb52e,#f27622,#e64732,#a90f1f); }
        .selected-marker { color:#83fff1; }
        .subtle-card { margin-top:9px; padding:10px; border:1px solid rgba(112,190,192,.11); border-radius:11px; background:rgba(0,0,0,.11); }
        .calendar { display:grid; grid-template-columns:repeat(10,1fr); gap:4px; margin-top:8px; }
        .calendar-day { height:19px; border-radius:5px; border:1px solid rgba(113,184,187,.11); background:rgba(255,255,255,.025); color:#60797d; font-size:7px; display:flex; align-items:center; justify-content:center; }
        .calendar-day.high { background:rgba(239,70,50,.18); border-color:rgba(239,70,50,.42); color:#ff9b88; }
        .calendar-day.active { box-shadow:0 0 0 1px #61e5d7 inset, 0 0 10px rgba(73,220,203,.18); color:#d9fffa; }
        .play-row { display:flex; gap:6px; align-items:center; margin-top:8px; }
        .play-btn,.speed-btn { border:1px solid rgba(112,190,192,.18); background:rgba(255,255,255,.035); color:#9feee5; border-radius:8px; padding:6px 8px; font-size:8px; cursor:pointer; }
        .play-btn:hover,.speed-btn:hover { border-color:rgba(72,224,206,.5); }
        .trend-mini svg { width:100%; height:62px; display:block; }
        .scenario-value { color:#ffc766; }
        .strata { display:flex; flex-direction:column; gap:5px; margin-top:8px; }
        .stratum { display:grid; grid-template-columns:52px 1fr 45px; align-items:center; gap:7px; font-size:8px; color:#829b9e; }
        .stratum-bar { height:8px; border-radius:7px; background:#12252b; overflow:hidden; }
        .stratum-bar b { display:block; height:100%; border-radius:7px; }
        .uncertainty { position:relative; height:8px; border-radius:8px; background:#12252b; margin-top:7px; overflow:hidden; }
        .uncertainty .range { position:absolute; top:0; bottom:0; background:rgba(98,230,215,.3); border-left:1px solid #74f3e5; border-right:1px solid #74f3e5; }
        .uncertainty .marker { position:absolute; top:-2px; width:3px; height:12px; background:#f8fffe; border-radius:4px; }
        .source-line { display:flex; flex-wrap:wrap; gap:5px; margin-top:8px; }
        .source-chip { padding:5px 7px; border:1px solid rgba(112,190,192,.12); border-radius:999px; color:#789397; font-size:7px; }

        .top-control-guide .guide-item {
          display:inline-flex;
          align-items:center;
          gap:5px;
          color:#a9c5c7;
        }
        .top-control-guide .guide-item b {
          color:#6df2e2;
          font-size:11px;
          line-height:1;
          font-weight:700;
        }
        .top-control-guide .guide-item em {
          color:#e0fffb;
          font-style:normal;
          font-weight:700;
          margin-left:2px;
        }
        .top-control-guide .guide-separator {
          color:rgba(102,222,211,.35);
        }
        .map-key { position:absolute; z-index:11; right:50%; top:74px; transform:translateX(50%); padding:8px 10px; border:1px solid rgba(112,190,192,.14); border-radius:10px; background:rgba(4,18,25,.58); backdrop-filter:blur(9px); color:#91aaad; font-size:8px; pointer-events:none; }
        .map-key span { margin-right:10px; }
        .warm-dot { display:inline-block; width:7px; height:7px; border-radius:50%; background:#ffb52e; box-shadow:0 0 8px rgba(255,181,46,.6); margin-right:4px; }
        .cyan-dot { display:inline-block; width:7px; height:7px; border-radius:50%; background:#55e5e0; box-shadow:0 0 8px rgba(85,229,224,.6); margin-right:4px; }
        .fresh { color:#77f1bf !important; }
        .alert-timeline { position:relative; margin-top:9px; padding-left:12px; border-left:1px solid rgba(104,219,208,.25); }
        .alert-item { position:relative; padding:3px 0 7px 10px; font-size:8px; color:#80999d; }
        .alert-item::before { content:""; position:absolute; left:-16px; top:5px; width:7px; height:7px; border-radius:50%; background:#4fd8ca; box-shadow:0 0 8px rgba(79,216,202,.4); }
        .alert-item.current::before { background:#ffb52e; box-shadow:0 0 10px rgba(255,181,46,.6); }
        .infra-status-row { display:flex; justify-content:space-between; gap:10px; padding:5px 0; color:#80999d; font-size:8px; border-bottom:1px solid rgba(112,190,192,.06); }
        .geo-grid-labels { position:absolute; inset:0; z-index:10; pointer-events:none; color:rgba(132,188,192,.55); font-size:7px; letter-spacing:.04em; }
        .geo-lat,.geo-lon { position:absolute; padding:3px 5px; border:1px solid rgba(96,180,185,.10); border-radius:5px; background:rgba(3,14,20,.38); backdrop-filter:blur(4px); }
        .lat-a { left:14px; top:25%; } .lat-b { left:14px; top:49%; } .lat-c { left:14px; top:73%; }
        .lon-a { left:25%; bottom:18px; } .lon-b { left:49%; bottom:18px; } .lon-c { left:73%; bottom:18px; }
        .tiny-note { margin-top:5px; color:#5f777b; font-size:7px; line-height:1.4; }
        @media (max-width:900px) {
          .interaction-hint {
            display:flex;
            min-width:0;
            width:calc(100% - 32px);
            top:44px;
            padding:8px 9px;
            gap:5px;
            font-size:7px;
          }
          .top-control-guide .guide-item b { font-size:9px; }
          .top-control-guide .guide-separator { display:none; }
          .map-key { display:none; }
          .hud { width:calc(100vw - 24px); min-width:0; } .hud-left { top:12px; left:12px; max-height:43dvh; } .hud-right { top:auto; right:12px; bottom:12px; max-height:43dvh; } .top-badge { display:none; } .legend { bottom:10px; } .hover-card { display:none; } }
      `}</style>

      <div className="terrain-root">
        <div ref={mountRef} className="terrain-canvas" />

        <div className="top-badge">LANDSAFE AI • 3D GEOSPATIAL RISK ENGINE • RUDRAPRAYAG • OPTIMIZED VIEW</div>
        <div className="interaction-hint top-control-guide" aria-label="3D terrain controls">
          <span className="guide-item"><b>☝</b> 1-finger drag <em>Rotate</em></span>
          <span className="guide-separator">•</span>
          <span className="guide-item"><b>✌</b> 2-finger scroll/pinch <em>Zoom</em></span>
          <span className="guide-separator">•</span>
          <span className="guide-item"><b>⌖</b> Click <em>Inspect</em></span>
        </div>
        <div className="map-key">
          <span><i className="warm-dot" />risk cluster</span>
          <span><i className="cyan-dot" />water flow</span>
          <span>□ infrastructure</span>
          <span>▦ coordinate grid</span>
        </div>

        <div className="geo-grid-labels" aria-hidden="true">
          <span className="geo-lat lat-a">30.42°N</span>
          <span className="geo-lat lat-b">30.40°N</span>
          <span className="geo-lat lat-c">30.38°N</span>
          <span className="geo-lon lon-a">78.98°E</span>
          <span className="geo-lon lon-b">79.00°E</span>
          <span className="geo-lon lon-c">79.02°E</span>
        </div>

        <div className="hud hud-left">
          <div className="status-line">
            <div><div className="eyebrow">Early Warning Terrain Console</div><div className="title">Landslide Risk Monitor</div></div>
            <div className="live"><i /> LIVE</div>
          </div>
          <div className="muted">RAW DEM terrain + Random Forest prediction + interactive environmental scenario controls.</div>

          <div className="section">
            <div className="row"><span>Rainfall · 24h</span><strong>{rainfall} mm</strong></div>
            <input className="slider" type="range" min="0" max="500" value={rainfall} onChange={handleRainfallChange} />
            <div className="row"><span>Soil moisture</span><strong>{soilMoisture}%</strong></div>
            <input className="slider" type="range" min="0" max="100" value={soilMoisture} onChange={handleSoilChange} />
          </div>

          <div className="mini-grid">
            <div className="metric"><span>Average Risk</span><strong>{averageRisk.toFixed(1)}%</strong></div>
            <div className="metric"><span>Maximum Risk</span><strong>{maximumRisk.toFixed(1)}%</strong></div>
            <div className="metric"><span>Model</span><strong>Random Forest</strong></div>
            <div className="metric"><span>Updated</span><strong>{weatherTime}</strong></div>
          </div>

          <div className="section">
            <div className="control-title"><span className="eyebrow">30-Day Replay</span><strong>Day {timelineDay}</strong></div>
            <input className="slider" type="range" min="1" max="30" value={timelineDay} onChange={(e) => setTimelineDay(Number(e.target.value))} />

            <div className="calendar">
              {Array.from({ length: 30 }, (_, i) => {
                const day = i + 1;
                return (
                  <button
                    key={day}
                    className={`calendar-day ${highRiskDays.includes(day) ? "high" : ""} ${day === timelineDay ? "active" : ""}`}
                    onClick={() => setTimelineDay(day)}
                    title={`Day ${day}${highRiskDays.includes(day) ? " · elevated-risk scenario" : ""}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <div className="trend-mini subtle-card">
              <div className="row"><span>Risk trend</span><strong>{thirtyDayRisk[29].risk > thirtyDayRisk[0].risk ? "↑ rising" : "↓ easing"}</strong></div>
              <svg viewBox="0 0 300 62" preserveAspectRatio="none">
                <path d={riskTrendPoints} fill="none" stroke="#ffb52e" strokeWidth="2" />
              </svg>
            </div>

            <div className="play-row">
              <button className="play-btn" onClick={() => setPlaybackPlaying((value) => !value)}>
                {playbackPlaying ? "Ⅱ Pause" : "▶ Play"}
              </button>
              {[1, 2, 4].map((speed) => (
                <button
                  key={speed}
                  className="speed-btn"
                  onClick={() => setPlaybackSpeed(speed)}
                  style={{ opacity: playbackSpeed === speed ? 1 : 0.55 }}
                >
                  {speed}×
                </button>
              ))}
            </div>
            <div className="tiny-note">Calendar and trend are a UI scenario until historical risk observations are connected.</div>
          </div>

          <div className="section">
            <div className="eyebrow">What-If Scenario</div>

            <div className="row">
              <span>Rainfall +</span>
              <strong className="scenario-value">+{whatIfRain} mm</strong>
            </div>
            <input
              className="slider"
              type="range"
              min="0"
              max="150"
              step="10"
              value={whatIfRain}
              onChange={(e) => setWhatIfRain(Number(e.target.value))}
            />

            <div className="row">
              <span>Soil saturation drop</span>
              <strong className="scenario-value">-{whatIfSoilDrop}%</strong>
            </div>
            <input
              className="slider"
              type="range"
              min="0"
              max="40"
              step="5"
              value={whatIfSoilDrop}
              onChange={(e) => setWhatIfSoilDrop(Number(e.target.value))}
            />

            {selectedLocation && (
              <div className="mini-grid">
                <div className="metric"><span>Current risk</span><strong>{displayedRisk.toFixed(0)}%</strong></div>
                <div className="metric"><span>What-if risk</span><strong className="scenario-value">{scenarioRisk.toFixed(0)}%</strong></div>
              </div>
            )}
            <div className="tiny-note">What-if values are frontend scenarios; they do not overwrite the Random Forest API inputs.</div>
          </div>

          <div className="section">
            <div className="control-title"><span className="eyebrow">Risk Threshold</span><strong>{riskThreshold}%</strong></div>
            <input className="slider" type="range" min="25" max="90" value={riskThreshold} onChange={(e) => setRiskThreshold(Number(e.target.value))} />
          </div>

          <div className="section">
            <div className="control-title"><span className="eyebrow">Sun Angle</span><strong>{sunAngle}°</strong></div>
            <input className="slider" type="range" min="0" max="360" value={sunAngle} onChange={(e) => setSunAngle(Number(e.target.value))} />
          </div>

          <div className="section">
            <div className="eyebrow">Map Layers</div>
            <div className="layers">
              <button className={`layer-btn ${layers.rainfall ? "active" : ""}`} onClick={() => toggleLayer("rainfall")}>Rainfall</button>
              <button className={`layer-btn ${layers.water ? "active" : ""}`} onClick={() => toggleLayer("water")}>Mountain streams</button>
              <button className={`layer-btn ${layers.faults ? "active" : ""}`} onClick={() => toggleLayer("faults")}>Faults · demo</button>
              <button className={`layer-btn ${layers.history ? "active" : ""}`} onClick={() => toggleLayer("history")}>10y markers · demo</button>
              <button className={`layer-btn ${layers.infrastructure ? "active" : ""}`} onClick={() => toggleLayer("infrastructure")}>Infrastructure</button>
            </div>
            <div className="muted" style={{marginTop:"8px"}}>Mountain streams are terrain-derived simulated drainage paths. Connect a real hydrography layer later for exact river geometry.</div>
          </div>
        </div>

        <div className="hud hud-right">
          <div className="eyebrow">Selected Terrain Intelligence</div>
          <div className="title">{selectedLocation ? "Location Analysis" : "Click the terrain"}</div>
          <div className="muted">{selectedLocation ? "The beacon follows the selected terrain point." : "Rotate, zoom and click anywhere on the 3D terrain."}</div>

          {selectedLocation ? (
            <>
              <div className="risk-number">{displayedRisk.toFixed(0)}<small>% RISK</small></div>
              <div className="risk-pill">{displayedStatus.toUpperCase()}</div>

              <div className="mini-grid">
                <div className="metric"><span>Elevation</span><strong>{selectedLocation.elevation.toFixed(1)} m</strong></div>
                <div className="metric"><span>Slope</span><strong>{selectedLocation.slope.toFixed(1)}°</strong></div>
                <div className="metric"><span>Rainfall</span><strong>{rainfall} mm</strong></div>
                <div className="metric"><span>NDVI · demo</span><strong>{selectedNdvi.toFixed(2)}</strong></div>
              </div>

              <div className="subtle-card">
                <div className="eyebrow">Prediction uncertainty</div>
                <div className="row"><span>Estimated range</span><strong>{uncertaintyLow}% — {uncertaintyHigh}%</strong></div>
                <div className="uncertainty">
                  <span className="range" style={{left:`${uncertaintyLow}%`, width:`${Math.max(4, uncertaintyHigh-uncertaintyLow)}%`}} />
                  <span className="marker" style={{left:`calc(${displayedRisk}% - 1px)`}} />
                </div>
                <div className="tiny-note">Range is a UI uncertainty band until calibrated model uncertainty is returned by the API.</div>
              </div>

              <div className="section">
                <div className="eyebrow">Historical comparison</div>
                <div className="row"><span>Same period last year</span><strong>{historicalComparison}% risk</strong></div>
                <div className="row"><span>Current anomaly</span><strong className={anomalyDelta >= 0 ? "scenario-value" : "fresh"}>{anomalyDelta >= 0 ? "+" : ""}{anomalyDelta} pts</strong></div>
                <div className="tiny-note">Comparison is a UI reference value until a dated historical model record is connected.</div>
              </div>

              <div className="section">
                <div className="eyebrow">Model confidence</div>
                <div className="row"><span>Prediction confidence</span><strong>{selectedLocation.confidence ?? 87}%</strong></div>
                <div className="factor"><div className="factor-head"><span>Rainfall contribution</span><strong>40%</strong></div><div className="factor-track"><b style={{width:"40%"}} /></div></div>
                <div className="factor"><div className="factor-head"><span>Slope contribution</span><strong>35%</strong></div><div className="factor-track"><b style={{width:"35%"}} /></div></div>
                <div className="factor"><div className="factor-head"><span>Soil saturation</span><strong>25%</strong></div><div className="factor-track"><b style={{width:"25%"}} /></div></div>
                <div className="muted">Scenario contribution weights shown here are UI factors, not Random Forest feature-importance output.</div>
              </div>

              <div className="section">
                <div className="eyebrow">Soil composition · indicative</div>
                <div className="soil-bar"><span className="soil-rock" style={{width:`${selectedSoil.rock}%`}} /><span className="soil-clay" style={{width:`${selectedSoil.clay}%`}} /><span className="soil-silt" style={{width:`${selectedSoil.silt}%`}} /></div>
                <div className="row"><span>Rock / Clay / Silt</span><strong>{selectedSoil.rock}% / {selectedSoil.clay}% / {selectedSoil.silt}%</strong></div>
              </div>

              <div className="section">
                <div className="eyebrow">Subsurface composition · indicative</div>
                <div className="strata">
                  <div className="stratum">
                    <span>Rock</span>
                    <div className="stratum-bar"><b style={{width:`${selectedSoil.rock}%`, background:"#9c7152"}} /></div>
                    <strong>{selectedSoil.rock}%</strong>
                  </div>
                  <div className="stratum">
                    <span>Clay</span>
                    <div className="stratum-bar"><b style={{width:`${selectedSoil.clay}%`, background:"#c19a68"}} /></div>
                    <strong>{selectedSoil.clay}%</strong>
                  </div>
                  <div className="stratum">
                    <span>Silt</span>
                    <div className="stratum-bar"><b style={{width:`${selectedSoil.silt}%`, background:"#6da99b"}} /></div>
                    <strong>{selectedSoil.silt}%</strong>
                  </div>
                </div>
                <div className="tiny-note">Thickness/mixture is indicative; saturation shading is represented by the current soil-moisture scenario.</div>
              </div>

              <div className="section">
                <div className="eyebrow">Rainfall · previous 7 days</div>
                <div className="chart">
                  <svg viewBox="0 0 300 90" preserveAspectRatio="none">
                    <defs><linearGradient id="rainFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#48dce9" stopOpacity=".3" /><stop offset="1" stopColor="#48dce9" stopOpacity="0" /></linearGradient></defs>
                    <path d={sevenDayRain.map((v,i) => `${i===0?"M":"L"}${i*(300/6)},${82-(v/rainMax)*68}`).join(" ") + " L300,90 L0,90 Z"} fill="url(#rainFill)" />
                    <path d={sevenDayRain.map((v,i) => `${i===0?"M":"L"}${i*(300/6)},${82-(v/rainMax)*68}`).join(" ")} fill="none" stroke="#55e0ea" strokeWidth="2.5" />
                  </svg>
                  <div className="chart-legend"><span>7d ago</span><span>today · {rainfall} mm</span></div>
                </div>
                <div className="muted">The displayed history is a UI scenario series until a real rainfall time-series source is connected.</div>
              </div>

              {showWarning && (
                <div className="warning">
                  <strong>⚠ EARLY WARNING · {displayedStatus.toUpperCase()}</strong>
                  <p>Risk exceeds the selected {riskThreshold}% threshold. Contributing scenario: rainfall {rainfall} mm, slope {selectedLocation.slope.toFixed(1)}°, soil moisture {soilMoisture}%.</p>
                </div>
              )}

              <div className="section">
                <div className="eyebrow">Alert level history · demo</div>
                <div className="row"><span>3h ago</span><strong>MEDIUM</strong></div>
                <div className="row"><span>1h ago</span><strong>HIGH</strong></div>
                <div className="row"><span>Now</span><strong>{displayedStatus.toUpperCase()}</strong></div>
              </div>
            </>
          ) : (
            <div className="section muted">Select a terrain point to reveal elevation, slope, rainfall, vegetation, soil composition and Random Forest output.</div>
          )}

          <div className="section">
            <div className="eyebrow">Alert status evolution</div>
            <div className="alert-timeline">
              {alertTimeline.map((item, index) => {
                const isCurrent = index === alertTimeline.length - 1;
                return (
                  <div key={item.time} className={`alert-item ${isCurrent ? "current" : ""}`}>
                    <div className="row">
                      <span>{item.time}</span>
                      <strong style={{ color: isCurrent ? "#ffb52e" : "#79dcd0" }}>
                        {item.status}{isCurrent ? " ← CURRENT" : ""}
                      </strong>
                    </div>
                    <div className="tiny-note">{item.detail} · {item.value}% risk</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="section">
            <div className="eyebrow">Infrastructure exposure</div>
            <div className="infra-status-row"><span>Village A</span><strong style={{color:villageA.color}}>● {villageA.label}</strong></div>
            <div className="infra-status-row"><span>Village B</span><strong style={{color:villageB.color}}>● {villageB.label}</strong></div>
            <div className="infra-status-row"><span>Village C</span><strong style={{color:villageC.color}}>● {villageC.label}</strong></div>
            <div className="infra-status-row"><span>Main road corridor</span><strong style={{color:roadStatus.color}}>● {roadStatus.label}</strong></div>
            <div className="tiny-note">Exposure status is derived from the current displayed risk until asset-specific risk data is connected.</div>
          </div>

          {selectedLocation && (
            <div className="section">
              <div className="eyebrow">Terrain context</div>
              <div className="row"><span>Formation</span><strong style={{maxWidth:"190px", textAlign:"right"}}>{selectedLocation.geologicalFormation}</strong></div>
              <div className="row"><span>Last recorded event</span><strong style={{maxWidth:"190px", textAlign:"right"}}>{selectedLocation.lastEvent}</strong></div>
            </div>
          )}

          <div className="section">
            <div className="row"><span>FastAPI</span><strong>{apiStatus}</strong></div>
            <div className="row"><span>Last updated</span><strong className="fresh">{freshnessText}</strong></div>
            <div className="row"><span>Active sensors</span><strong>23*</strong></div>
            <div className="source-line">
              <span className="source-chip">SRTM / DEM</span>
              <span className="source-chip">FastAPI / Random Forest</span>
              <span className="source-chip">Local sensors*</span>
            </div>
            <div className="tiny-note">*Sensor count is a UI placeholder until the live sensor feed is connected.</div>
          </div>
        </div>

        {hoveredLocation && (
          <div className="hover-card">
            <b>Terrain probe</b>
            <div className="hover-grid">
              <span>Elevation <strong>{hoveredLocation.elevation.toFixed(0)}m</strong></span>
              <span>Slope <strong>{hoveredLocation.slope.toFixed(1)}°</strong></span>
              <span>Risk <strong>{hoveredLocation.risk.toFixed(0)}%</strong></span>
              <span>Grid <strong>{hoveredLocation.x},{hoveredLocation.z}</strong></span>
              <span>Geology <strong>{hoveredLocation.geology}</strong></span>
              <span>Event <strong>{hoveredLocation.event}</strong></span>
            </div>
          </div>
        )}

        <div className="legend"><span>LOW</span><div className="gradient" /><span>CRITICAL</span></div>
      </div>
    </>
  );
}

export default TerrainViewer;
