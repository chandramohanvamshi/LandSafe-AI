import { forwardRef, useEffect, useRef } from 'react';
import * as THREE from 'three';
import './Hero.css';

const Hero = forwardRef(({ onLaunch }, ref) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
    });

    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    renderer.setClearColor(0x020b18, 1);

    // Create a simple terrain-like geometry for hero
    const geometry = new THREE.BufferGeometry();
    const size = 200;
    const divisions = 64;

    const positions = new Float32Array(divisions * divisions * 3);
    let index = 0;

    for (let i = 0; i < divisions; i++) {
      for (let j = 0; j < divisions; j++) {
        const x = (i / (divisions - 1)) * size - size / 2;
        const z = (j / (divisions - 1)) * size - size / 2;
        const y = Math.sin(i * 0.1) * Math.cos(j * 0.1) * 20;

        positions[index * 3] = x;
        positions[index * 3 + 1] = y;
        positions[index * 3 + 2] = z;
        index++;
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Create indices for the geometry
    const indices = [];
    for (let i = 0; i < divisions - 1; i++) {
      for (let j = 0; j < divisions - 1; j++) {
        const a = i * divisions + j;
        const b = a + 1;
        const c = a + divisions;
        const d = c + 1;

        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
    geometry.computeVertexNormals();

    // Create material with gradient
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 256, 256);
    gradient.addColorStop(0, '#1683ff');
    gradient.addColorStop(0.5, '#00d4ff');
    gradient.addColorStop(1, '#0a4d7a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshPhongMaterial({
      map: texture,
      emissive: 0x1a3a52,
      emissiveIntensity: 0.5,
      wireframe: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -0.5;
    mesh.position.y = -30;
    scene.add(mesh);

    // Add lighting
    const light = new THREE.DirectionalLight(0xffffff, 0.6);
    light.position.set(50, 100, 50);
    scene.add(light);

    const ambientLight = new THREE.AmbientLight(0x4488aa, 0.4);
    scene.add(ambientLight);

    camera.position.z = 150;

    // Animation loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      mesh.rotation.z += 0.0002;
      mesh.rotation.x = -0.5 + Math.sin(Date.now() * 0.0001) * 0.2;

      renderer.render(scene, camera);
    };

    // Handle resize
    const handleResize = () => {
      if (!canvasRef.current) return;
      const width = canvasRef.current.clientWidth;
      const height = canvasRef.current.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <section ref={ref} className="hero">
      <canvas ref={canvasRef} className="hero-canvas"></canvas>
      <div className="hero-overlay"></div>
      <div className="hero-content">
        <h1 className="hero-title">
          Predict Landslides.<br />
          Protect Communities.
        </h1>
        <p className="hero-subtitle">
          AI-powered landslide risk monitoring and early warning for Northeast India.
        </p>
        <button className="hero-button" onClick={onLaunch}>
          Launch Dashboard
          <span className="button-arrow">→</span>
        </button>
      </div>
    </section>
  );
});

Hero.displayName = 'Hero';

export default Hero;