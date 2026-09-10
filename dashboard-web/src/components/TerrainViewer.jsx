import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

// ============================================================
// TERRAIN CONFIGURATION
// ============================================================

const HEIGHTMAP_URL = "/models/terrain.raw";
const API_URL = "http://127.0.0.1:8000";

const RESOLUTION = 1025;

// Unity Terrain Size
const TERRAIN_WIDTH = 3600;
const TERRAIN_HEIGHT = 600;
const TERRAIN_DEPTH = 3600;

// Risk limits
const MAX_RAINFALL = 500;
// Slopes on the DEM can exceed 45°. Using 90° prevents the frontend
// heatmap from saturating the whole terrain when steep areas are present.
const MAX_SLOPE = 90;

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// ============================================================
// FRONTEND HEATMAP RISK
// ============================================================

function calculateRisk(slope, rainfall, soilMoisture) {
  const slopeRisk = clamp(
    (slope / MAX_SLOPE) * 100,
    0,
    100
  );

  const rainfallRisk = clamp(
    (rainfall / MAX_RAINFALL) * 100,
    0,
    100
  );

  const soilRisk = clamp(
    soilMoisture,
    0,
    100
  );

  // Slope = 50%
  // Rainfall = 30%
  // Soil moisture = 20%
  const risk =
    slopeRisk * 0.5 +
    rainfallRisk * 0.3 +
    soilRisk * 0.2;

  return clamp(risk, 0, 100);
}

// ============================================================
// RISK STATUS
// ============================================================

function getRiskStatus(risk) {
  if (risk < 25) return "Low";
  if (risk < 50) return "Moderate";
  if (risk < 75) return "High";
  return "Critical";
}

// ============================================================
// RISK HEATMAP COLOR
// ============================================================

function getRiskColor(risk) {
  const color = new THREE.Color();

  if (risk < 25) {
    color.setRGB(0.1, 0.9, 0.35);
  } else if (risk < 50) {
    color.setRGB(1.0, 0.8, 0.1);
  } else if (risk < 75) {
    color.setRGB(1.0, 0.35, 0.05);
  } else {
    color.setRGB(0.95, 0.03, 0.08);
  }

  return color;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

function TerrainViewer() {
  // ----------------------------------------------------------
  // THREE.JS REFS
  // ----------------------------------------------------------

  const mountRef = useRef(null);

  const terrainRef = useRef(null);
  const geometryRef = useRef(null);
  const heightsRef = useRef(null);
  const slopesRef = useRef(null);

  // ----------------------------------------------------------
  // INPUT REFS
  // ----------------------------------------------------------

  const rainfallRef = useRef(120);
  const soilMoistureRef = useRef(50);

  const selectedLocationRef = useRef(null);

  // Prevent an older FastAPI response from overwriting a newer slider value.
  const predictionRequestRef = useRef(0);

  // ----------------------------------------------------------
  // REACT STATE
  // ----------------------------------------------------------

  const [rainfall, setRainfall] = useState(120);
  const [soilMoisture, setSoilMoisture] = useState(50);

  const [averageRisk, setAverageRisk] = useState(0);
  const [maximumRisk, setMaximumRisk] = useState(0);

  const [selectedLocation, setSelectedLocation] =
    useState(null);

  const [apiStatus, setApiStatus] =
    useState("Ready");

  // ==========================================================
  // UPDATE HEATMAP
  // ==========================================================

  const updateHeatmap = (
    newRainfall,
    newSoilMoisture
  ) => {
    const geometry = geometryRef.current;
    const slopes = slopesRef.current;
    const terrain = terrainRef.current;

    if (!geometry || !slopes || !terrain) {
      return;
    }

    const colors = new Float32Array(
      slopes.length * 3
    );

    let totalRisk = 0;
    let maxRisk = 0;

    for (let i = 0; i < slopes.length; i++) {
      const slope = slopes[i];

      const risk = calculateRisk(
        slope,
        newRainfall,
        newSoilMoisture
      );

      totalRisk += risk;
      maxRisk = Math.max(maxRisk, risk);

      const color = getRiskColor(risk);

      const colorIndex = i * 3;

      colors[colorIndex] = color.r;
      colors[colorIndex + 1] = color.g;
      colors[colorIndex + 2] = color.b;
    }

    geometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(
        colors,
        3
      )
    );

    geometry.attributes.color.needsUpdate = true;

    setAverageRisk(
      totalRisk / slopes.length
    );

    setMaximumRisk(maxRisk);

    // --------------------------------------------------------
    // Update selected location
    // --------------------------------------------------------

    const currentSelected =
      selectedLocationRef.current;

    if (currentSelected) {
      const updatedRisk =
        calculateRisk(
          currentSelected.slope,
          newRainfall,
          newSoilMoisture
        );

      const updatedLocation = {
        ...currentSelected,

        rainfall: newRainfall,

        soilMoisture:
          newSoilMoisture,

        risk: updatedRisk,

        status:
          getRiskStatus(updatedRisk),

        // Slider change means API result
        // is no longer the latest prediction.
        apiRisk: null,

        apiStatus: null,
      };

      selectedLocationRef.current =
        updatedLocation;

      setSelectedLocation(
        updatedLocation
      );
    }
  };

  // ==========================================================
  // RAINFALL SLIDER
  // ==========================================================

  const handleRainfallChange = (event) => {
    const value = Number(
      event.target.value
    );

    rainfallRef.current = value;

    setRainfall(value);

    // Update the heatmap immediately.
    updateHeatmap(
      value,
      soilMoistureRef.current
    );

    // Re-run the Random Forest for the currently selected point.
    // updateHeatmap() updates selectedLocationRef synchronously.
    if (selectedLocationRef.current) {
      predictWithAPI(
        selectedLocationRef.current
      );
    }
  };

  // ==========================================================
  // SOIL MOISTURE SLIDER
  // ==========================================================

  const handleSoilChange = (event) => {
    const value = Number(
      event.target.value
    );

    soilMoistureRef.current = value;

    setSoilMoisture(value);

    // Soil moisture is not one of the four features used by the
    // currently trained Random Forest model. Therefore the heatmap
    // updates immediately using the frontend risk calculation.
    // Invalidate any older API request so it cannot overwrite this value.
    predictionRequestRef.current += 1;

    updateHeatmap(
      rainfallRef.current,
      value
    );

    if (selectedLocationRef.current) {
      setApiStatus(
        "Frontend prediction"
      );
    }
  };

  // ==========================================================
  // FASTAPI RANDOM FOREST PREDICTION
  // ==========================================================

  const predictWithAPI = async (location) => {
    const requestId =
      ++predictionRequestRef.current;

    setApiStatus("Predicting...");

    try {
      /*
       * Your FastAPI expects:
       *
       * elevation_m
       * slope_degrees
       * rainfall_mm_24h
       * rainfall_mm_72h
       *
       * The rainfall slider represents 24-hour rainfall.
       *
       * Until real 72-hour rainfall data is connected,
       * we estimate:
       *
       * 72h rainfall is estimated from the 24h slider value.
       * This is only a temporary demo estimate until real
       * 72-hour rainfall data is connected.
       */

      const rainfall24h =
        rainfallRef.current;

      const rainfall72h =
        Math.min(
          rainfall24h * 2.5,
          1000
        );

      const response = await fetch(
        `${API_URL}/predict`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            elevation_m:
              Number(
                location.elevation.toFixed(2)
              ),

            slope_degrees:
              Number(
                location.slope.toFixed(2)
              ),

            rainfall_mm_24h:
              rainfall24h,

            rainfall_mm_72h:
              rainfall72h,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `API returned ${response.status}`
        );
      }

      const result =
        await response.json();

      console.log(
        "Random Forest API result:",
        result
      );

      // Ignore a response that belongs to an older slider value.
      if (requestId !== predictionRequestRef.current) {
        return;
      }

      const apiRisk =
        Number(
          result.risk_probability_percent
        );

      const updatedLocation = {
        ...location,

        // API result becomes the
        // displayed selected-location risk.
        risk: apiRisk,

        status:
          getRiskStatus(apiRisk),

        apiRisk: apiRisk,

        apiStatus:
          result.risk_level,
      };

      selectedLocationRef.current =
        updatedLocation;

      setSelectedLocation(
        updatedLocation
      );

      setApiStatus("Connected");
    } catch (error) {
      console.error(
        "Prediction API error:",
        error
      );

      // Do not let an obsolete request replace a newer slider result.
      if (requestId !== predictionRequestRef.current) {
        return;
      }

      setApiStatus(
        "Frontend prediction"
      );

      /*
       * If FastAPI is temporarily unavailable,
       * don't break the dashboard.
       */

      const fallbackRisk =
        calculateRisk(
          location.slope,
          rainfallRef.current,
          soilMoistureRef.current
        );

      const fallbackLocation = {
        ...location,

        risk: fallbackRisk,

        status:
          getRiskStatus(
            fallbackRisk
          ),

        apiRisk: null,

        apiStatus: null,
      };

      selectedLocationRef.current =
        fallbackLocation;

      setSelectedLocation(
        fallbackLocation
      );
    }
  };

  // ==========================================================
  // THREE.JS SETUP
  // ==========================================================

  useEffect(() => {
    const mount =
      mountRef.current;

    if (!mount) {
      return;
    }

    // ========================================================
    // SCENE
    // ========================================================

    const scene =
      new THREE.Scene();

    scene.background =
      new THREE.Color(
        0x06111f
      );

    // ========================================================
    // CAMERA
    // ========================================================

    const camera =
      new THREE.PerspectiveCamera(
        45,

        mount.clientWidth /
          Math.max(
            mount.clientHeight,
            1
          ),

        1,

        12000
      );

    // Temporary position. The terrain-loading code below performs
    // an automatic fit using the real terrain bounds.
    camera.position.set(0, 1600, 3000);

    // ========================================================
    // RENDERER
    // ========================================================

    const renderer =
      new THREE.WebGLRenderer({
        antialias: true,

        powerPreference:
          "high-performance",
      });

    renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio || 1,
        1.75
      )
    );

    renderer.setSize(
      mount.clientWidth,
      Math.max(
        mount.clientHeight,
        1
      ),
      false
    );

    renderer.domElement.style.display =
      "block";

    renderer.domElement.style.width =
      "100%";

    renderer.domElement.style.height =
      "100%";

    mount.appendChild(
      renderer.domElement
    );

    // ========================================================
    // ORBIT CONTROLS
    // ========================================================

    const controls =
      new OrbitControls(
        camera,
        renderer.domElement
      );

    controls.enableDamping =
      true;

    controls.dampingFactor =
      0.07;

    controls.minDistance =
      900;

    controls.maxDistance =
      7000;

    controls.minPolarAngle =
      0.35;

    controls.maxPolarAngle =
      Math.PI / 2.05;

    controls.enablePan =
      true;

    controls.panSpeed =
      0.5;

    controls.rotateSpeed =
      0.5;

    controls.zoomSpeed =
      0.7;

    controls.target.set(
      0,
      0,
      0
    );

    controls.update();

    // ========================================================
    // LIGHTING
    // ========================================================

    const ambientLight =
      new THREE.AmbientLight(
        0xffffff,
        1.25
      );

    scene.add(
      ambientLight
    );

    const directionalLight =
      new THREE.DirectionalLight(
        0xffffff,
        2
      );

    directionalLight.position.set(
      1200,
      2200,
      1200
    );

    scene.add(
      directionalLight
    );

    // ========================================================
    // LOAD RAW TERRAIN
    // ========================================================

    fetch(
      HEIGHTMAP_URL
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Could not load terrain.raw (${response.status})`
          );
        }

        return response.arrayBuffer();
      })

      .then((buffer) => {
        console.log(
          "RAW file size:",
          buffer.byteLength,
          "bytes"
        );

        const expectedSize =
          RESOLUTION *
          RESOLUTION *
          2;

        console.log(
          "Expected RAW size:",
          expectedSize,
          "bytes"
        );

        if (
          buffer.byteLength !==
          expectedSize
        ) {
          throw new Error(
            `Invalid RAW size. Expected ${expectedSize} bytes but received ${buffer.byteLength} bytes.`
          );
        }

        // ====================================================
        // HEIGHT DATA
        // ====================================================

        const heightData =
          new Uint16Array(
            buffer
          );

        heightsRef.current =
          heightData;

        console.log(
          "Height samples:",
          heightData.length
        );

        // ====================================================
        // TERRAIN GEOMETRY
        // ====================================================

        const geometry =
          new THREE.PlaneGeometry(
            TERRAIN_WIDTH,
            TERRAIN_DEPTH,
            RESOLUTION - 1,
            RESOLUTION - 1
          );

        geometryRef.current =
          geometry;

        const position =
          geometry.attributes.position;

        // ====================================================
        // APPLY HEIGHTS
        // ====================================================

        for (
          let i = 0;
          i < position.count;
          i++
        ) {
          const rawHeight =
            heightData[i];

          const normalizedHeight =
            rawHeight / 65535;

          const height =
            normalizedHeight *
            TERRAIN_HEIGHT;

          position.setZ(
            i,
            height
          );
        }

        position.needsUpdate =
          true;

        // ====================================================
        // CALCULATE SLOPE
        // ====================================================

        const slopes =
          new Float32Array(
            position.count
          );

        const gridSize =
          RESOLUTION;

        const cellSize =
          TERRAIN_WIDTH /
          (RESOLUTION - 1);

        for (
          let row = 0;
          row < gridSize;
          row++
        ) {
          for (
            let col = 0;
            col < gridSize;
            col++
          ) {
            const index =
              row *
                gridSize +
              col;

            const leftCol =
              Math.max(
                col - 1,
                0
              );

            const rightCol =
              Math.min(
                col + 1,
                gridSize - 1
              );

            const downRow =
              Math.max(
                row - 1,
                0
              );

            const upRow =
              Math.min(
                row + 1,
                gridSize - 1
              );

            const leftHeight =
              (heightData[
                row *
                  gridSize +
                  leftCol
              ] /
                65535) *
              TERRAIN_HEIGHT;

            const rightHeight =
              (heightData[
                row *
                  gridSize +
                  rightCol
              ] /
                65535) *
              TERRAIN_HEIGHT;

            const downHeight =
              (heightData[
                downRow *
                  gridSize +
                  col
              ] /
                65535) *
              TERRAIN_HEIGHT;

            const upHeight =
              (heightData[
                upRow *
                  gridSize +
                  col
              ] /
                65535) *
              TERRAIN_HEIGHT;

            const dx =
              (rightHeight -
                leftHeight) /
              (2 * cellSize);

            const dz =
              (upHeight -
                downHeight) /
              (2 * cellSize);

            const slopeRadians =
              Math.atan(
                Math.sqrt(
                  dx * dx +
                    dz * dz
                )
              );

            const slopeDegrees =
              THREE.MathUtils.radToDeg(
                slopeRadians
              );

            slopes[index] =
              slopeDegrees;
          }
        }

        slopesRef.current =
          slopes;

        console.log(
          "Slope calculation completed."
        );

        // ====================================================
        // INITIAL HEATMAP
        // ====================================================

        const colors =
          new Float32Array(
            slopes.length * 3
          );

        let totalRisk = 0;

        let maxRisk = 0;

        for (
          let i = 0;
          i < slopes.length;
          i++
        ) {
          const risk =
            calculateRisk(
              slopes[i],
              rainfallRef.current,
              soilMoistureRef.current
            );

          totalRisk +=
            risk;

          maxRisk =
            Math.max(
              maxRisk,
              risk
            );

          const color =
            getRiskColor(
              risk
            );

          const colorIndex =
            i * 3;

          colors[
            colorIndex
          ] = color.r;

          colors[
            colorIndex + 1
          ] = color.g;

          colors[
            colorIndex + 2
          ] = color.b;
        }

        geometry.setAttribute(
          "color",
          new THREE.Float32BufferAttribute(
            colors,
            3
          )
        );

        geometry.attributes.color.needsUpdate =
          true;

        // ====================================================
        // NORMALS
        // ====================================================

        geometry.computeVertexNormals();

        // ====================================================
        // MATERIAL
        // ====================================================

        const material =
          new THREE.MeshStandardMaterial({
            vertexColors: true,

            roughness: 0.92,

            metalness: 0.03,

            side:
              THREE.DoubleSide,
          });

        // ====================================================
        // TERRAIN MESH
        // ====================================================

        const terrain =
          new THREE.Mesh(
            geometry,
            material
          );

        terrainRef.current =
          terrain;

        /*
         * PlaneGeometry uses Z as height.
         * Rotate it so Z becomes world Y.
         */
        terrain.rotation.x =
          -Math.PI / 2;

        terrain.position.y =
          -TERRAIN_HEIGHT / 2;

        scene.add(
          terrain
        );

        // ====================================================
        // GRID
        // ====================================================

        const grid =
          new THREE.GridHelper(
            TERRAIN_WIDTH,
            20,
            0x335577,
            0x223344
          );

        grid.position.y =
          -TERRAIN_HEIGHT / 2;

        scene.add(
          grid
        );

        // ====================================================
        // AUTOMATIC CAMERA FIT
        // ====================================================

        const box =
          new THREE.Box3().setFromObject(
            terrain
          );

        const sphere =
          box.getBoundingSphere(
            new THREE.Sphere()
          );

        const verticalFov =
          THREE.MathUtils.degToRad(
            camera.fov
          );

        const horizontalFov =
          2 *
          Math.atan(
            Math.tan(
              verticalFov / 2
            ) *
              camera.aspect
          );

        const limitingFov =
          Math.min(
            verticalFov,
            horizontalFov
          );

        const fitDistance =
          (
            sphere.radius /
            Math.sin(
              limitingFov / 2
            )
          ) * 1.32;

        const direction =
          new THREE.Vector3(
            0,
            0.58,
            0.82
          ).normalize();

        camera.position.copy(
          direction.multiplyScalar(
            fitDistance
          )
        );

        camera.position.y =
          Math.max(
            camera.position.y,
            750
          );

        controls.target.set(
          0,
          -TERRAIN_HEIGHT * 0.1,
          0
        );

        controls.update();

        // ====================================================
        // STATISTICS
        // ====================================================

        setAverageRisk(
          totalRisk /
            slopes.length
        );

        setMaximumRisk(
          maxRisk
        );

        console.log(
          "Rudraprayag terrain + slope heatmap loaded!"
        );
      })

      .catch((error) => {
        console.error(
          "Terrain loading error:",
          error
        );
      });

    // ========================================================
    // CLICK DETECTION
    // ========================================================

    const raycaster =
      new THREE.Raycaster();

    const mouse =
      new THREE.Vector2();

    const handleClick = async (
      event
    ) => {
      const terrain =
        terrainRef.current;

      const slopes =
        slopesRef.current;

      const heights =
        heightsRef.current;

      if (
        !terrain ||
        !slopes ||
        !heights
      ) {
        return;
      }

      // ------------------------------------------------------
      // MOUSE POSITION
      // ------------------------------------------------------

      const rect =
        renderer.domElement.getBoundingClientRect();

      mouse.x =
        (
          (event.clientX -
            rect.left) /
            rect.width
        ) *
          2 -
        1;

      mouse.y =
        -(
          (
            (event.clientY -
              rect.top) /
              rect.height
          ) *
            2 -
          1
        );

      // ------------------------------------------------------
      // RAYCAST
      // ------------------------------------------------------

      raycaster.setFromCamera(
        mouse,
        camera
      );

      const intersections =
        raycaster.intersectObject(
          terrain
        );

      if (
        intersections.length === 0
      ) {
        return;
      }

      const intersection =
        intersections[0];

      // ------------------------------------------------------
      // LOCAL TERRAIN POSITION
      // ------------------------------------------------------

      const localPoint =
        terrain.worldToLocal(
          intersection.point.clone()
        );

      const x =
        localPoint.x +
        TERRAIN_WIDTH / 2;

      const z =
        localPoint.z +
        TERRAIN_DEPTH / 2;

      const col =
        clamp(
          Math.round(
            (x /
              TERRAIN_WIDTH) *
              (RESOLUTION - 1)
          ),
          0,
          RESOLUTION - 1
        );

      const row =
        clamp(
          Math.round(
            (z /
              TERRAIN_DEPTH) *
              (RESOLUTION - 1)
          ),
          0,
          RESOLUTION - 1
        );

      const index =
        row *
          RESOLUTION +
        col;

      // ------------------------------------------------------
      // SELECTED DATA
      // ------------------------------------------------------

      const elevation =
        (heights[index] /
          65535) *
        TERRAIN_HEIGHT;

      const slope =
        slopes[index];

      const frontendRisk =
        calculateRisk(
          slope,
          rainfallRef.current,
          soilMoistureRef.current
        );

      const location = {
        x: Math.round(
          localPoint.x
        ),

        z: Math.round(
          localPoint.z
        ),

        elevation,

        slope,

        rainfall:
          rainfallRef.current,

        soilMoisture:
          soilMoistureRef.current,

        risk:
          frontendRisk,

        status:
          getRiskStatus(
            frontendRisk
          ),

        apiRisk: null,

        apiStatus: null,
      };

      selectedLocationRef.current =
        location;

      setSelectedLocation(
        location
      );

      // ------------------------------------------------------
      // SEND LOCATION TO FASTAPI
      // ------------------------------------------------------

      await predictWithAPI(
        location
      );
    };

    renderer.domElement.addEventListener(
      "click",
      handleClick
    );

    // ========================================================
    // RESIZE
    // ========================================================

    const handleResize = () => {
      if (!mount) {
        return;
      }

      const width =
        Math.max(
          mount.clientWidth,
          1
        );

      const height =
        Math.max(
          mount.clientHeight,
          1
        );

      camera.aspect =
        width / height;

      camera.updateProjectionMatrix();

      renderer.setSize(
        width,
        height,
        false
      );

      // When the browser enters/leaves fullscreen or the layout changes,
      // refit the already-loaded terrain so it remains centered and visible.
      const terrain = terrainRef.current;

      if (terrain) {
        const box = new THREE.Box3().setFromObject(terrain);
        const sphere = box.getBoundingSphere(new THREE.Sphere());

        const verticalFov =
          THREE.MathUtils.degToRad(camera.fov);

        const horizontalFov =
          2 *
          Math.atan(
            Math.tan(verticalFov / 2) *
              camera.aspect
          );

        const limitingFov = Math.min(
          verticalFov,
          horizontalFov
        );

        const fitDistance =
          (
            sphere.radius /
            Math.sin(limitingFov / 2)
          ) * 1.32;

        const direction = new THREE.Vector3(
          0,
          0.58,
          0.82
        ).normalize();

        camera.position.copy(
          direction.multiplyScalar(fitDistance)
        );

        camera.position.y = Math.max(
          camera.position.y,
          750
        );

        controls.target.set(
          0,
          -TERRAIN_HEIGHT * 0.1,
          0
        );

        controls.update();
      }
    };

    window.addEventListener(
      "resize",
      handleResize
    );

    // ResizeObserver handles:
    // fullscreen, browser resizing,
    // DevTools and layout changes.
    const resizeObserver =
      new ResizeObserver(
        handleResize
      );

    resizeObserver.observe(
      mount
    );

    handleResize();

    // ========================================================
    // ANIMATION
    // ========================================================

    let animationId;

    const animate = () => {
      animationId =
        requestAnimationFrame(
          animate
        );

      controls.update();

      renderer.render(
        scene,
        camera
      );
    };

    animate();

    // ========================================================
    // CLEANUP
    // ========================================================

    return () => {
      cancelAnimationFrame(
        animationId
      );

      window.removeEventListener(
        "resize",
        handleResize
      );

      resizeObserver.disconnect();

      renderer.domElement.removeEventListener(
        "click",
        handleClick
      );

      controls.dispose();

      if (
        terrainRef.current
      ) {
        terrainRef.current.geometry.dispose();

        const material =
          terrainRef.current
            .material;

        if (
          Array.isArray(
            material
          )
        ) {
          material.forEach(
            (item) =>
              item.dispose()
          );
        } else {
          material.dispose();
        }

        terrainRef.current =
          null;
      }

      renderer.dispose();

      if (
        mount &&
        renderer.domElement &&
        mount.contains(
          renderer.domElement
        )
      ) {
        mount.removeChild(
          renderer.domElement
        );
      }
    };
  }, []);

  // ==========================================================
  // DISPLAY VALUES
  // ==========================================================

  const displayedRisk =
    selectedLocation
      ? selectedLocation.risk
      : 0;

  const displayedStatus =
    selectedLocation
      ? selectedLocation.status
      : "—";

  // Early warning is intentionally based on real trigger conditions,
  // not only on the Random Forest probability. This prevents a warning
  // from appearing when rainfall and soil moisture are essentially zero.
  const showWarning =
    Boolean(selectedLocation) &&
    selectedLocation.slope >= 20 &&
    (rainfall >= 30 || soilMoisture >= 70);

  const warningReason =
    rainfall >= 30 && soilMoisture >= 70
      ? "High rainfall and high soil moisture on a steep slope."
      : rainfall >= 30
        ? "Significant rainfall combined with a steep slope."
        : "High soil moisture combined with a steep slope.";

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <>
      <style>{`

        /* ======================================================
           GLOBAL
        ====================================================== */

        * {
          box-sizing: border-box;
        }

        html,
        body,
        #root {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
          overflow: hidden;
          background: #06111f;
        }

        /* ======================================================
           MAIN TERRAIN
        ====================================================== */

        .terrain-root {
          position: fixed;

          inset: 0;

          width: 100vw;

          height: 100vh;

          height: 100dvh;

          min-height: 100%;

          overflow: hidden;

          background: #06111f;

          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        /* ======================================================
           THREE.JS CANVAS
        ====================================================== */

        .terrain-canvas {
          position: absolute;

          inset: 0;

          width: 100%;

          height: 100%;

          z-index: 1;
        }

        /* ======================================================
           PANELS
        ====================================================== */

        .risk-panel,
        .location-panel {
          position: absolute;

          z-index: 10;

          color: white;

          background:
            rgba(
              4,
              16,
              30,
              0.92
            );

          border:
            1px solid
            rgba(
              75,
              105,
              135,
              0.55
            );

          box-shadow:
            0 14px 40px
            rgba(
              0,
              0,
              0,
              0.28
            );

          backdrop-filter:
            blur(8px);

          -webkit-backdrop-filter:
            blur(8px);
        }

        /* ======================================================
           LEFT PANEL
        ====================================================== */

        .risk-panel {
          top:
            clamp(
              16px,
              2.2vh,
              28px
            );

          left:
            clamp(
              16px,
              2vw,
              30px
            );

          width:
            min(
              380px,
              27vw
            );

          min-width: 310px;

          padding: 24px;

          border-radius: 17px;
        }

        /* ======================================================
           RIGHT PANEL
        ====================================================== */

        .location-panel {
          top:
            clamp(
              16px,
              2.2vh,
              28px
            );

          right:
            clamp(
              16px,
              2vw,
              30px
            );

          width:
            min(
              355px,
              25vw
            );

          min-width: 300px;

          padding: 22px;

          border-radius: 17px;
        }

        /* ======================================================
           TITLES
        ====================================================== */

        .panel-title {
          margin:
            0 0 25px;

          font-size:
            clamp(
              20px,
              1.55vw,
              27px
            );

          line-height: 1.2;

          letter-spacing:
            -0.3px;
        }

        .location-title {
          margin:
            0 0 22px;

          font-size:
            clamp(
              19px,
              1.35vw,
              24px
            );

          line-height: 1.2;
        }

        /* ======================================================
           SLIDER ROW
        ====================================================== */

        .slider-row {
          display: flex;

          justify-content:
            space-between;

          align-items: center;

          gap: 15px;

          margin-bottom: 10px;

          font-size:
            clamp(
              16px,
              1.05vw,
              19px
            );
        }

        .slider-row strong {
          white-space: nowrap;
        }

        /* ======================================================
           SLIDERS
        ====================================================== */

        .terrain-slider {
          display: block;

          width: 100%;

          height: 6px;

          margin: 0;

          accent-color: #1688ff;

          cursor: pointer;
        }

        .slider-spacer {
          height: 29px;
        }

        /* ======================================================
           DIVIDER
        ====================================================== */

        .divider {
          height: 1px;

          margin:
            0 0 17px;

          background:
            rgba(
              75,
              105,
              135,
              0.55
            );
        }

        /* ======================================================
           STATISTICS
        ====================================================== */

        .stat-row {
          display: flex;

          justify-content:
            space-between;

          align-items: center;

          gap: 15px;

          margin-bottom: 11px;

          font-size:
            clamp(
              15px,
              1vw,
              18px
            );
        }

        .stat-row:last-child {
          margin-bottom: 0;
        }

        /* ======================================================
           LOCATION DATA
        ====================================================== */

        .location-data {
          font-size:
            clamp(
              15px,
              1vw,
              18px
            );

          line-height: 1.7;
        }

        .location-data strong {
          font-weight: 700;
        }

        /* ======================================================
           RISK BOX
        ====================================================== */

        .risk-box {
          margin-top: 17px;

          padding: 14px;

          border-radius: 10px;

          background:
            rgba(
              38,
              55,
              72,
              0.75
            );

          font-size:
            clamp(
              15px,
              1vw,
              18px
            );

          line-height: 1.55;
        }

        .api-badge {
          margin-top: 10px;

          font-size: 12px;

          opacity: 0.72;
        }

        .warning-box {
          margin-top: 12px;
          padding: 14px;
          border-radius: 10px;
          border: 1px solid rgba(255, 80, 100, 0.65);
          background: rgba(90, 20, 35, 0.55);
          color: #ffffff;
          font-size: 13px;
          line-height: 1.45;
        }

        .warning-title {
          font-weight: 800;
          margin-bottom: 6px;
        }

        /* ======================================================
           LEGEND
        ====================================================== */

        .risk-legend {
          position: absolute;

          left:
            clamp(
              20px,
              2.2vw,
              40px
            );

          bottom:
            clamp(
              20px,
              3.2vh,
              38px
            );

          z-index: 10;

          color: white;

          font-size:
            clamp(
              14px,
              1vw,
              17px
            );

          line-height: 1.55;

          text-shadow:
            0 1px 4px black;

          pointer-events: none;
        }

        .legend-title {
          margin-bottom: 7px;

          font-weight: 700;
        }

        .legend-item {
          white-space: nowrap;
        }

        /* ======================================================
           API STATUS
        ====================================================== */

        .connection-status {
          position: absolute;

          right:
            clamp(
              16px,
              2vw,
              30px
            );

          bottom:
            clamp(
              16px,
              2vh,
              25px
            );

          z-index: 11;

          padding:
            6px 10px;

          border-radius: 8px;

          color:
            rgba(
              255,
              255,
              255,
              0.65
            );

          background:
            rgba(
              4,
              16,
              30,
              0.58
            );

          font-size: 11px;

          pointer-events: none;
        }

        /* ======================================================
           TABLET
        ====================================================== */

        @media (max-width: 1100px) {

          .risk-panel {
            width: 330px;

            min-width: 0;

            padding: 19px;
          }

          .location-panel {
            width: 310px;

            min-width: 0;

            padding: 18px;
          }
        }

        /* ======================================================
           SHORT SCREEN
        ====================================================== */

        @media
          (max-height: 720px)
          and (min-width: 701px) {

          .risk-panel,
          .location-panel {
            transform:
              scale(0.88);
          }

          .risk-panel {
            transform-origin:
              top left;
          }

          .location-panel {
            transform-origin:
              top right;
          }

          .risk-legend {
            transform:
              scale(0.88);

            transform-origin:
              bottom left;
          }
        }

        /* ======================================================
           MOBILE
        ====================================================== */

        @media (max-width: 700px) {

          .risk-panel {
            top: 10px;

            left: 10px;

            width:
              calc(
                100vw - 20px
              );

            padding: 15px;
          }

          .location-panel {
            top: auto;

            right: 10px;

            bottom: 10px;

            left: 10px;

            width:
              calc(
                100vw - 20px
              );

            padding: 14px;
          }

          .panel-title {
            margin-bottom: 15px;

            font-size: 19px;
          }

          .location-title {
            margin-bottom: 10px;

            font-size: 18px;
          }

          .slider-spacer {
            height: 18px;
          }

          .location-data {
            font-size: 14px;

            line-height: 1.5;
          }

          .risk-box {
            margin-top: 8px;

            padding: 9px;

            font-size: 14px;
          }

          .risk-legend {
            display: none;
          }

          .connection-status {
            display: none;
          }
        }

      `}</style>

      {/* ======================================================
          MAIN ROOT
      ====================================================== */}

      <div className="terrain-root">

        {/* ====================================================
            THREE.JS TERRAIN
        ==================================================== */}

        <div
          ref={mountRef}
          className="terrain-canvas"
        />

        {/* ====================================================
            LEFT CONTROL PANEL
        ==================================================== */}

        <div className="risk-panel">

          <h2 className="panel-title">
            Landslide Risk Monitor
          </h2>

          {/* ------------------------------------------------
              RAINFALL
          ------------------------------------------------ */}

          <div className="slider-row">

            <span>
              Rainfall (24h)
            </span>

            <strong>
              {rainfall} mm
            </strong>

          </div>

          <input
            className="terrain-slider"
            type="range"
            min="0"
            max="500"
            value={rainfall}
            onChange={
              handleRainfallChange
            }
          />

          <div className="slider-spacer" />

          {/* ------------------------------------------------
              SOIL MOISTURE
          ------------------------------------------------ */}

          <div className="slider-row">

            <span>
              Soil Moisture
            </span>

            <strong>
              {soilMoisture}%
            </strong>

          </div>

          <input
            className="terrain-slider"
            type="range"
            min="0"
            max="100"
            value={soilMoisture}
            onChange={
              handleSoilChange
            }
          />

          <div className="slider-spacer" />

          {/* ------------------------------------------------
              STATISTICS
          ------------------------------------------------ */}

          <div className="divider" />

          <div className="stat-row">

            <span>
              Average Risk
            </span>

            <strong>
              {averageRisk.toFixed(1)}%
            </strong>

          </div>

          <div className="stat-row">

            <span>
              Maximum Risk
            </span>

            <strong>
              {maximumRisk.toFixed(1)}%
            </strong>

          </div>

        </div>

        {/* ====================================================
            RIGHT SELECTED LOCATION PANEL
        ==================================================== */}

        {selectedLocation && (

          <div className="location-panel">

            <h2 className="location-title">
              📍 Selected Location
            </h2>

            <div className="location-data">

              <div>
                Coordinates:{" "}

                <strong>
                  {selectedLocation.x},{" "}
                  {selectedLocation.z}
                </strong>
              </div>

              <div>
                Elevation:{" "}

                <strong>
                  {selectedLocation.elevation.toFixed(
                    1
                  )}{" "}
                  m
                </strong>
              </div>

              <div>
                Slope:{" "}

                <strong>
                  {selectedLocation.slope.toFixed(
                    1
                  )}
                  °
                </strong>
              </div>

              <div>
                Rainfall:{" "}

                <strong>
                  {rainfall} mm
                </strong>
              </div>

              <div>
                Soil Moisture:{" "}

                <strong>
                  {soilMoisture}%
                </strong>
              </div>

            </div>

            {/* ------------------------------------------------
                RISK RESULT
            ------------------------------------------------ */}

            <div className="risk-box">

              <div>
                Risk:{" "}

                <strong>
                  {displayedRisk.toFixed(
                    1
                  )}
                  %
                </strong>
              </div>

              <div>
                Status:{" "}

                <strong>
                  {displayedStatus}
                </strong>
              </div>

              <div className="api-badge">

                {selectedLocation.apiRisk !== null
                  ? `Random Forest API: ${selectedLocation.apiStatus}`
                  : "Using frontend heatmap calculation"}

              </div>

            </div>

            {showWarning && (
              <div className="warning-box">
                <div className="warning-title">
                  🚨 EARLY WARNING
                </div>
                <div>
                  High landslide risk detected at this location.
                  Avoid unnecessary travel and monitor conditions.
                </div>
                <div style={{ marginTop: "6px", opacity: 0.85 }}>
                  {warningReason}
                </div>
              </div>
            )}

          </div>

        )}

        {/* ====================================================
            RISK LEGEND
        ==================================================== */}

        <div className="risk-legend">

          <div className="legend-title">
            Landslide Risk
          </div>

          <div className="legend-item">
            🟢 Low: 0–25%
          </div>

          <div className="legend-item">
            🟡 Moderate: 25–50%
          </div>

          <div className="legend-item">
            🟠 High: 50–75%
          </div>

          <div className="legend-item">
            🔴 Critical: 75–100%
          </div>

        </div>

        {/* ====================================================
            API CONNECTION STATUS
        ==================================================== */}

        <div className="connection-status">
          API: {apiStatus}
        </div>

      </div>
    </>
  );
}

export default TerrainViewer;