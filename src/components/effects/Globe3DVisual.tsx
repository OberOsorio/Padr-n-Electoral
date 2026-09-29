import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ShieldCheck, Zap } from 'lucide-react';

export const Globe3DVisual: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5.2;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Group for all sphere elements
    const sphereGroup = new THREE.Group();
    scene.add(sphereGroup);

    // 1. Core Sphere Geometry & Physical Material (#8B5CF6 to #3B82F6)
    const sphereRadius = 1.7;
    const geometry = new THREE.SphereGeometry(sphereRadius, 64, 64);
    const sphereMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x1e1b4b), // Deep indigo
      emissive: new THREE.Color(0x311042),
      emissiveIntensity: 0.35,
      roughness: 0.18,
      metalness: 0.72,
      clearcoat: 0.8,
      clearcoatRoughness: 0.2,
      reflectivity: 0.9,
    });
    const mainSphere = new THREE.Mesh(geometry, sphereMaterial);
    sphereGroup.add(mainSphere);

    // 2. Outer Wireframe Hologram Aura
    const wireGeometry = new THREE.SphereGeometry(sphereRadius * 1.05, 32, 32);
    const wireMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0x8b5cf6),
      wireframe: true,
      transparent: true,
      opacity: 0.16,
    });
    const wireSphere = new THREE.Mesh(wireGeometry, wireMaterial);
    sphereGroup.add(wireSphere);

    // 3. Orbiting Territorial Nodes (Particles)
    const nodeCount = 55;
    const nodeGeometry = new THREE.BufferGeometry();
    const nodePositions = new Float32Array(nodeCount * 3);
    for (let i = 0; i < nodeCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / nodeCount);
      const theta = Math.sqrt(nodeCount * Math.PI) * phi;
      const r = sphereRadius * (1.08 + Math.random() * 0.12);
      nodePositions[i * 3] = r * Math.cos(theta) * Math.sin(phi);
      nodePositions[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
      nodePositions[i * 3 + 2] = r * Math.cos(phi);
    }
    nodeGeometry.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3));
    const nodeMaterial = new THREE.PointsMaterial({
      color: 0x60a5fa,
      size: 0.05,
      transparent: true,
      opacity: 0.8,
    });
    const neuralPoints = new THREE.Points(nodeGeometry, nodeMaterial);
    sphereGroup.add(neuralPoints);

    // 4. Moving Orbiting Point Lights (Cyan, Purple, Blue)
    const lightPurple = new THREE.PointLight(0x8b5cf6, 4.5, 12);
    scene.add(lightPurple);
    const sparkPurple = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xc084fc })
    );
    scene.add(sparkPurple);

    const lightBlue = new THREE.PointLight(0x3b82f6, 4.0, 12);
    scene.add(lightBlue);
    const sparkBlue = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x60a5fa })
    );
    scene.add(sparkBlue);

    const lightCyan = new THREE.PointLight(0x06b6d4, 3.2, 10);
    scene.add(lightCyan);
    const sparkCyan = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xa5f3fc })
    );
    scene.add(sparkCyan);

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x0f172a, 2.2);
    scene.add(ambientLight);

    // Directional light rim
    const dirLight = new THREE.DirectionalLight(0xa78bfa, 1.2);
    dirLight.position.set(5, 4, 3);
    scene.add(dirLight);

    // Mouse tilt interaction
    let targetRotationX = 0;
    let targetRotationY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotationY = mouseX * 0.35;
      targetRotationX = -mouseY * 0.35;
    };

    const handleMouseLeave = () => {
      targetRotationX = 0;
      targetRotationY = 0;
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    const startTime = performance.now();
    let animationId: number | null = null;
    let isTabActive = !document.hidden;

    const animate = () => {
      if (!isTabActive) return;
      animationId = requestAnimationFrame(animate);

      const elapsedTime = (performance.now() - startTime) * 0.001;

      // Continuous rotation (0.001 rad/frame)
      sphereGroup.rotation.y += 0.001;
      sphereGroup.rotation.x += 0.0005;

      wireSphere.rotation.y -= 0.0012;
      neuralPoints.rotation.y += 0.0007;

      // Mouse tilt dampening
      sphereGroup.rotation.y += (targetRotationY - (sphereGroup.rotation.y % (Math.PI * 2))) * 0.05;
      sphereGroup.rotation.x += (targetRotationX - (sphereGroup.rotation.x % (Math.PI * 2))) * 0.05;

      // Orbiting lights
      const r1 = 2.5;
      const x1 = Math.cos(elapsedTime * 0.9) * r1;
      const y1 = Math.sin(elapsedTime * 0.7) * 1.5;
      const z1 = Math.sin(elapsedTime * 0.9) * r1;
      lightPurple.position.set(x1, y1, z1);
      sparkPurple.position.set(x1, y1, z1);

      const r2 = 2.6;
      const x2 = Math.cos(-elapsedTime * 0.8 + 2.0) * r2;
      const y2 = Math.cos(elapsedTime * 0.6) * 1.4;
      const z2 = Math.sin(-elapsedTime * 0.8 + 2.0) * r2;
      lightBlue.position.set(x2, y2, z2);
      sparkBlue.position.set(x2, y2, z2);

      const r3 = 2.3;
      const x3 = Math.sin(elapsedTime * 1.2) * r3;
      const y3 = Math.cos(elapsedTime * 1.1) * 1.8;
      const z3 = Math.cos(elapsedTime * 1.2) * 1.6;
      lightCyan.position.set(x3, y3, z3);
      sparkCyan.position.set(x3, y3, z3);

      renderer.render(scene, camera);
    };

    const handleVisibilityChange = () => {
      isTabActive = !document.hidden;
      if (isTabActive) {
        animate();
      } else if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    animate();

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animationId) cancelAnimationFrame(animationId);
      renderer.dispose();
      geometry.dispose();
      sphereMaterial.dispose();
      wireGeometry.dispose();
      wireMaterial.dispose();
      nodeGeometry.dispose();
      nodeMaterial.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full max-w-[420px] sm:max-w-[480px] h-[380px] sm:h-[450px] mx-auto flex items-center justify-center">
      {/* Resplandor radial de fondo */}
      <div
        className="absolute w-[280px] sm:w-[340px] h-[280px] sm:h-[340px] rounded-full bg-gradient-to-tr from-purple-600/30 via-blue-600/25 to-cyan-500/20 blur-[55px] pointer-events-none -z-10 animate-pulse"
        style={{ animationDuration: '4s' }}
        aria-hidden="true"
      />

      {/* Three.js Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing select-none"
      />

      {/* Floating Badges */}
      <div className="absolute -bottom-2 -left-2 sm:bottom-4 sm:-left-4 z-10 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700/80 shadow-xl shadow-purple-950/20 text-xs text-slate-200 animate-bounce" style={{ animationDuration: '4s' }}>
        <div className="p-1 rounded-md bg-purple-500/20 text-purple-400">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <span className="font-medium">Cifrado RLS: Activo</span>
      </div>

      <div className="absolute top-2 -right-2 sm:top-6 sm:-right-4 z-10 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700/80 shadow-xl shadow-cyan-950/20 text-xs text-slate-200 animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '1s' }}>
        <div className="p-1 rounded-md bg-cyan-500/20 text-cyan-400">
          <Zap className="w-4 h-4" />
        </div>
        <span className="font-medium font-mono">11ms Latencia Edge</span>
      </div>
    </div>
  );
};
