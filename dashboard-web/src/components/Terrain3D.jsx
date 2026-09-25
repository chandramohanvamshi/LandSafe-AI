import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const HEIGHTMAP_URL = "/models/terrain.raw";

const TERRAIN_WIDTH = 3600;
const TERRAIN_HEIGHT = 600;
const TERRAIN_DEPTH = 3600;

const HEIGHTMAP_SIZE = 1025;
const RENDER_SIZE = 257;

function Terrain3D() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // --------------------------------------------------
    // SCENE
    // --------------------------------------------------

    const scene = new THREE.Scene();

    scene.background = new THREE.Color(0x020b14);

    // --------------------------------------------------
    // CAMERA
    // --------------------------------------------------

    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      1,
      20000
    );

    camera.position.set(
      4200,
      2600,
      4200
    );

    // --------------------------------------------------
    // RENDERER
    // --------------------------------------------------

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, 2)
    );

    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    containerRef.current.appendChild(renderer.domElement);

    // --------------------------------------------------
    // CONTROLS
    // --------------------------------------------------

    const controls = new OrbitControls(
      camera,
      renderer.domElement
    );

    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    controls.minDistance = 500;
    controls.maxDistance = 10000;

    controls.maxPolarAngle = Math.PI / 2.05;

    // --------------------------------------------------
    // LIGHTS
    // --------------------------------------------------

    const ambientLight = new THREE.AmbientLight(
      0x6b8ca8,
      1.5
    );

    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(
      0xffffff,
      3
    );

    sunLight.position.set(
      3000,
      5000,
      2000
    );

    sunLight.castShadow = true;

    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;

    scene.add(sunLight);

    // --------------------------------------------------
    // GRID
    // --------------------------------------------------

    const grid = new THREE.GridHelper(
      6000,
      30,
      0x00d9ff,
      0x123344
    );

    grid.position.y = -30;

    scene.add(grid);

    // --------------------------------------------------
    // LOAD RAW HEIGHTMAP
    // --------------------------------------------------

    let terrainMesh = null;

    const loadTerrain = async () => {
      try {
        const response = await fetch(HEIGHTMAP_URL);

        if (!response.ok) {
          throw new Error(
            `Could not load ${HEIGHTMAP_URL}`
          );
        }

        const buffer = await response.arrayBuffer();

        const heightData = new Float32Array(
          HEIGHTMAP_SIZE * HEIGHTMAP_SIZE
        );

        // ------------------------------------------------
        // RAW FILE
        // ------------------------------------------------

        const uint16Data = new Uint16Array(buffer);

        for (
          let i = 0;
          i < heightData.length;
          i++
        ) {
          if (i < uint16Data.length) {
            heightData[i] =
              uint16Data[i] / 65535;
          } else {
            heightData[i] = 0;
          }
        }

        // ------------------------------------------------
        // TERRAIN GEOMETRY
        // ------------------------------------------------

        const geometry =
          new THREE.PlaneGeometry(
            TERRAIN_WIDTH,
            TERRAIN_DEPTH,
            RENDER_SIZE - 1,
            RENDER_SIZE - 1
          );

        const position =
          geometry.attributes.position;

        // ------------------------------------------------
        // HEIGHT SCALE
        // ------------------------------------------------

        const heightScale =
          TERRAIN_HEIGHT;

        // ------------------------------------------------
        // APPLY HEIGHTMAP
        // ------------------------------------------------

        for (
          let z = 0;
          z < RENDER_SIZE;
          z++
        ) {
          for (
            let x = 0;
            x < RENDER_SIZE;
            x++
          ) {
            const renderIndex =
              z * RENDER_SIZE + x;

            const sourceX = Math.floor(
              (x / (RENDER_SIZE - 1)) *
                (HEIGHTMAP_SIZE - 1)
            );

            const sourceZ = Math.floor(
              (z / (RENDER_SIZE - 1)) *
                (HEIGHTMAP_SIZE - 1)
            );

            const sourceIndex =
              sourceZ *
                HEIGHTMAP_SIZE +
              sourceX;

            const height =
              heightData[sourceIndex] || 0;

            position.setY(
              renderIndex,
              height * heightScale
            );
          }
        }

        geometry.computeVertexNormals();

        // ------------------------------------------------
        // TERRAIN MATERIAL
        // ------------------------------------------------

        const material =
          new THREE.MeshStandardMaterial({
            color: 0x315f48,
            roughness: 0.85,
            metalness: 0.05,
            side: THREE.DoubleSide,
          });

        terrainMesh =
          new THREE.Mesh(
            geometry,
            material
          );

        terrainMesh.rotation.x =
          -Math.PI / 2;

        terrainMesh.castShadow = true;
        terrainMesh.receiveShadow = true;

        scene.add(terrainMesh);

        // ------------------------------------------------
        // RISK ZONES
        // ------------------------------------------------

        createRiskZone(
          scene,
          500,
          350,
          80,
          0xff3030
        );

        createRiskZone(
          scene,
          -700,
          -450,
          100,
          0xff9f00
        );

        createRiskZone(
          scene,
          1000,
          -800,
          70,
          0xffd400
        );

        // ------------------------------------------------
        // BEACON
        // ------------------------------------------------

        createBeacon(
          scene,
          350,
          900,
          0
        );

      } catch (error) {
        console.error(
          "Terrain loading error:",
          error
        );

        // Fallback terrain
        createFallbackTerrain(scene);
      }
    };

    loadTerrain();

    // --------------------------------------------------
    // RESIZE
    // --------------------------------------------------

    const handleResize = () => {
      camera.aspect =
        window.innerWidth /
        window.innerHeight;

      camera.updateProjectionMatrix();

      renderer.setSize(
        window.innerWidth,
        window.innerHeight
      );
    };

    window.addEventListener(
      "resize",
      handleResize
    );

    // --------------------------------------------------
    // ANIMATION
    // --------------------------------------------------

    let animationId;

    const animate = () => {
      animationId =
        requestAnimationFrame(animate);

      controls.update();

      renderer.render(
        scene,
        camera
      );
    };

    animate();

    // --------------------------------------------------
    // CLEANUP
    // --------------------------------------------------

    return () => {
      cancelAnimationFrame(
        animationId
      );

      window.removeEventListener(
        "resize",
        handleResize
      );

      controls.dispose();

      if (terrainMesh) {
        terrainMesh.geometry.dispose();
        terrainMesh.material.dispose();
      }

      renderer.dispose();

      if (
        containerRef.current &&
        renderer.domElement.parentNode ===
          containerRef.current
      ) {
        containerRef.current.removeChild(
          renderer.domElement
        );
      }
    };

  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        position: "relative",
        background: "#020b14",
      }}
    >

      {/* TITLE */}

      <div
        style={{
          position: "absolute",
          top: "25px",
          left: "30px",
          zIndex: 10,
          color: "#ffffff",
          fontFamily: "Arial, sans-serif",
        }}
      >

        <div
          style={{
            fontSize: "26px",
            fontWeight: "800",
            letterSpacing: "0.5px",
          }}
        >
          LandSafe AI
        </div>

        <div
          style={{
            marginTop: "6px",
            color: "#00d9ff",
            fontSize: "14px",
            fontWeight: "600",
          }}
        >
          3D TERRAIN VISUALIZATION
        </div>

      </div>

      {/* STATUS PANEL */}

      <div
        style={{
          position: "absolute",
          top: "25px",
          right: "30px",
          zIndex: 10,
          padding: "16px 20px",
          borderRadius: "12px",
          background:
            "rgba(5,20,32,0.85)",
          border:
            "1px solid rgba(0,217,255,0.25)",
          backdropFilter: "blur(12px)",
          color: "#ffffff",
          fontFamily: "Arial, sans-serif",
          minWidth: "210px",
        }}
      >

        <div
          style={{
            fontSize: "12px",
            color: "#8ba8b8",
            marginBottom: "8px",
          }}
        >
          CURRENT RISK
        </div>

        <div
          style={{
            color: "#ff3030",
            fontSize: "24px",
            fontWeight: "800",
          }}
        >
          HIGH
        </div>

        <div
          style={{
            marginTop: "5px",
            fontSize: "13px",
            color: "#b7cbd4",
          }}
        >
          Risk probability: 82%
        </div>

      </div>

      {/* CONTROLS HELP */}

      <div
        style={{
          position: "absolute",
          bottom: "25px",
          left: "30px",
          zIndex: 10,
          padding: "12px 16px",
          borderRadius: "10px",
          background:
            "rgba(5,20,32,0.8)",
          border:
            "1px solid rgba(255,255,255,0.1)",
          color: "#b7cbd4",
          fontFamily: "Arial, sans-serif",
          fontSize: "13px",
        }}
      >
        🖱️ Drag to rotate &nbsp; • &nbsp;
        Scroll to zoom &nbsp; • &nbsp;
        Right-drag to pan
      </div>

    </div>
  );
}


// ======================================================
// RISK ZONE
// ======================================================

function createRiskZone(
  scene,
  x,
  z,
  radius,
  color
) {

  const geometry =
    new THREE.CircleGeometry(
      radius,
      64
    );

  const material =
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });

  const zone =
    new THREE.Mesh(
      geometry,
      material
    );

  zone.rotation.x =
    -Math.PI / 2;

  zone.position.set(
    x,
    25,
    z
  );

  scene.add(zone);

  // Outer ring

  const ringGeometry =
    new THREE.RingGeometry(
      radius * 0.85,
      radius,
      64
    );

  const ringMaterial =
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    });

  const ring =
    new THREE.Mesh(
      ringGeometry,
      ringMaterial
    );

  ring.rotation.x =
    -Math.PI / 2;

  ring.position.set(
    x,
    28,
    z
  );

  scene.add(ring);
}


// ======================================================
// BEACON
// ======================================================

function createBeacon(
  scene,
  x,
  z,
  y
) {

  // Pole

  const poleGeometry =
    new THREE.CylinderGeometry(
      8,
      8,
      100,
      16
    );

  const poleMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x263a44,
      metalness: 0.6,
      roughness: 0.4,
    });

  const pole =
    new THREE.Mesh(
      poleGeometry,
      poleMaterial
    );

  pole.position.set(
    x,
    y + 50,
    z
  );

  scene.add(pole);

  // Beacon

  const beaconGeometry =
    new THREE.SphereGeometry(
      25,
      32,
      32
    );

  const beaconMaterial =
    new THREE.MeshBasicMaterial({
      color: 0x00d9ff,
    });

  const beacon =
    new THREE.Mesh(
      beaconGeometry,
      beaconMaterial
    );

  beacon.position.set(
    x,
    y + 110,
    z
  );

  scene.add(beacon);

  // Point light

  const light =
    new THREE.PointLight(
      0x00d9ff,
      5,
      500
    );

  light.position.set(
    x,
    y + 110,
    z
  );

  scene.add(light);
}


// ======================================================
// FALLBACK TERRAIN
// ======================================================

function createFallbackTerrain(
  scene
) {

  const geometry =
    new THREE.PlaneGeometry(
      3600,
      3600,
      64,
      64
    );

  const position =
    geometry.attributes.position;

  for (
    let i = 0;
    i < position.count;
    i++
  ) {

    const x =
      position.getX(i);

    const y =
      position.getY(i);

    const height =
      Math.sin(x * 0.003) * 180 +
      Math.cos(y * 0.004) * 150 +
      Math.sin(
        (x + y) * 0.002
      ) * 100;

    position.setZ(
      i,
      height
    );
  }

  geometry.computeVertexNormals();

  const material =
    new THREE.MeshStandardMaterial({
      color: 0x315f48,
      roughness: 0.9,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });

  const terrain =
    new THREE.Mesh(
      geometry,
      material
    );

  terrain.rotation.x =
    -Math.PI / 2;

  terrain.receiveShadow = true;
  terrain.castShadow = true;

  scene.add(terrain);
}

export default Terrain3D;