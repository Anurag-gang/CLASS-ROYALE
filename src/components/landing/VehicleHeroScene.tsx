"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { safeCreateWebGLRenderer } from "@/lib/webgl";

interface VehicleHeroSceneProps {
  className?: string;
  onSceneReady?: () => void;
}

export function VehicleHeroScene({ className = "", onSceneReady }: VehicleHeroSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    scene.fog = new THREE.FogExp2(0x050505, 0.015);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 1000);
    // Vehicle cockpit position: low, forward-facing
    camera.position.set(0, 1.8, 0);

    const renderer = safeCreateWebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      alpha: false,
    });
    if (!renderer) {
      if (onSceneReady) onSceneReady();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0x0d111a, 2.0);
    scene.add(ambientLight);

    const vehicleHeadlightLeft = new THREE.SpotLight(0x38bdf8, 40, 120, Math.PI / 6, 0.6);
    vehicleHeadlightLeft.position.set(-1.2, 1.4, 0);
    vehicleHeadlightLeft.target.position.set(-1.5, 0, -40);
    scene.add(vehicleHeadlightLeft);
    scene.add(vehicleHeadlightLeft.target);

    const vehicleHeadlightRight = new THREE.SpotLight(0xa855f7, 40, 120, Math.PI / 6, 0.6);
    vehicleHeadlightRight.position.set(1.2, 1.4, 0);
    vehicleHeadlightRight.target.position.set(1.5, 0, -40);
    scene.add(vehicleHeadlightRight);
    scene.add(vehicleHeadlightRight.target);

    // 3. Digital Grid Highway
    const ROAD_LENGTH = 300;
    const roadGeometry = new THREE.PlaneGeometry(16, ROAD_LENGTH, 32, 128);
    const roadMaterial = new THREE.MeshBasicMaterial({
      color: 0x080c14,
      wireframe: false,
    });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, -ROAD_LENGTH / 2 + 10);
    scene.add(road);

    // Grid lines along the road
    const gridHelper = new THREE.GridHelper(ROAD_LENGTH, 120, 0x8b5cf6, 0x1e293b);
    gridHelper.position.set(0, 0.05, -ROAD_LENGTH / 2 + 10);
    scene.add(gridHelper);

    // Road glowing edge rails
    const railGeometry = new THREE.BoxGeometry(0.3, 0.4, ROAD_LENGTH);
    const railMaterialLeft = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const railLeft = new THREE.Mesh(railGeometry, railMaterialLeft);
    railLeft.position.set(-8, 0.2, -ROAD_LENGTH / 2 + 10);
    scene.add(railLeft);

    const railMaterialRight = new THREE.MeshBasicMaterial({ color: 0x8b5cf6 });
    const railRight = new THREE.Mesh(railGeometry, railMaterialRight);
    railRight.position.set(8, 0.2, -ROAD_LENGTH / 2 + 10);
    scene.add(railRight);

    // 4. Data Towers & Academic Monoliths on sides
    const towers: THREE.Group[] = [];
    const towerGeo = new THREE.BoxGeometry(1, 1, 1);

    for (let i = 0; i < 36; i++) {
      const towerGroup = new THREE.Group();

      const h = 20 + Math.random() * 60;
      const w = 4 + Math.random() * 8;
      const d = 6 + Math.random() * 12;

      // Solid body
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x07090e,
        roughness: 0.8,
        metalness: 0.5,
      });
      const body = new THREE.Mesh(towerGeo, bodyMat);
      body.scale.set(w, h, d);
      body.position.y = h / 2;
      towerGroup.add(body);

      // Edge wireframe / glowing circuits
      const wireGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d));
      const wireMat = new THREE.LineBasicMaterial({
        color: i % 2 === 0 ? 0x06b6d4 : 0x8b5cf6,
        transparent: true,
        opacity: 0.35,
      });
      const wire = new THREE.LineSegments(wireGeo, wireMat);
      wire.position.y = h / 2;
      towerGroup.add(wire);

      // Position to the left or right of the highway
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * (14 + Math.random() * 25);
      const z = -((i * 14) % ROAD_LENGTH);
      towerGroup.position.set(x, 0, z);

      scene.add(towerGroup);
      towers.push(towerGroup);
    }

    // 5. Floating Subject Nodes suspended above highway
    const subjectNodes: THREE.Mesh[] = [];
    const nodeTypes = [
      { name: "DSA", color: 0x06b6d4 },
      { name: "OS", color: 0x8b5cf6 },
      { name: "DBMS", color: 0x38bdf8 },
      { name: "NETWORKS", color: 0xa855f7 },
      { name: "DEVOPS", color: 0x10b981 },
      { name: "SECURITY", color: 0xf59e0b },
    ];

    nodeTypes.forEach((node, idx) => {
      const nodeGeo = new THREE.IcosahedronGeometry(2.2, 1);
      const nodeMat = new THREE.MeshBasicMaterial({
        color: node.color,
        wireframe: true,
      });
      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      const z = -35 - idx * 45;
      const x = (idx % 2 === 0 ? -1 : 1) * 3.5;
      nodeMesh.position.set(x, 6.5, z);
      scene.add(nodeMesh);
      subjectNodes.push(nodeMesh);

      // Glowing core inside node
      const coreGeo = new THREE.SphereGeometry(1.0, 16, 16);
      const coreMat = new THREE.MeshBasicMaterial({
        color: node.color,
        transparent: true,
        opacity: 0.6,
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      nodeMesh.add(coreMesh);
    });

    // 6. Particle Slipstream
    const particleCount = prefersReducedMotion ? 150 : 600;
    const particlesGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);

    for (let p = 0; p < particleCount; p++) {
      particlePos[p * 3] = (Math.random() - 0.5) * 40;
      particlePos[p * 3 + 1] = Math.random() * 20;
      particlePos[p * 3 + 2] = -Math.random() * ROAD_LENGTH;
    }

    particlesGeo.setAttribute("position", new THREE.BufferAttribute(particlePos, 3));
    const particlesMat = new THREE.PointsMaterial({
      color: 0x67e8f9,
      size: 0.18,
      transparent: true,
      opacity: 0.6,
    });
    const particleSystem = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particleSystem);

    // 7. Minimal Futuristic Vehicle Cockpit / Chassis Frame Foreground
    const vehicleGroup = new THREE.Group();

    // Dark sleek chassis hood base
    const hoodGeo = new THREE.BoxGeometry(4.0, 0.4, 2.5);
    const hoodMat = new THREE.MeshStandardMaterial({
      color: 0x0a0c12,
      roughness: 0.4,
      metalness: 0.9,
    });
    const hood = new THREE.Mesh(hoodGeo, hoodMat);
    hood.position.set(0, 0.5, -1.8);
    hood.rotation.x = -0.15;
    vehicleGroup.add(hood);

    // Hood center technical intake ridge
    const ridgeGeo = new THREE.BoxGeometry(0.1, 0.15, 2.2);
    const ridgeMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const ridge = new THREE.Mesh(ridgeGeo, ridgeMat);
    ridge.position.set(0, 0.72, -1.8);
    ridge.rotation.x = -0.15;
    vehicleGroup.add(ridge);

    // HUD Target Reticle projected just ahead
    const reticleGeo = new THREE.RingGeometry(0.2, 0.22, 32);
    const reticleMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    });
    const reticle = new THREE.Mesh(reticleGeo, reticleMat);
    reticle.position.set(0, 1.8, -4.5);
    vehicleGroup.add(reticle);

    scene.add(vehicleGroup);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = -(e.clientY / window.innerHeight) * 2 + 1;
      targetX = normX * 0.4;
      targetY = normY * 0.2;
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });

    // Handle Resize
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", onResize);

    if (onSceneReady) {
      onSceneReady();
    }

    // 8. Animation Loop
    let animId = 0;
    let clock = new THREE.Clock();
    const SPEED = prefersReducedMotion ? 8 : 38;

    const animate = () => {
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Smooth camera sway toward mouse
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      camera.position.x = mouseX * 1.5;
      camera.position.y = 1.8 + mouseY * 0.8;
      camera.rotation.y = -mouseX * 0.15;
      camera.rotation.z = -mouseX * 0.05;
      camera.rotation.x = mouseY * 0.1;

      // Vehicle follows camera subtly
      vehicleGroup.position.x = camera.position.x * 0.85;
      vehicleGroup.position.y = camera.position.y * 0.85;
      vehicleGroup.rotation.y = camera.rotation.y * 0.9;
      vehicleGroup.rotation.z = camera.rotation.z * 1.2;

      // Move grid / road elements backward to simulate forward motion
      if (!prefersReducedMotion) {
        const moveDist = SPEED * delta;

        // Animate towers
        towers.forEach((t) => {
          t.position.z += moveDist;
          if (t.position.z > 5) {
            t.position.z -= ROAD_LENGTH;
          }
        });

        // Animate subject nodes
        subjectNodes.forEach((node) => {
          node.rotation.x += 0.01;
          node.rotation.y += 0.015;
          node.position.z += moveDist;
          if (node.position.z > 10) {
            node.position.z -= ROAD_LENGTH;
          }
        });

        // Animate particles
        const posAttr = particlesGeo.attributes.position as THREE.BufferAttribute;
        const array = posAttr.array as Float32Array;
        for (let i = 0; i < particleCount; i++) {
          array[i * 3 + 2] += moveDist * 1.8;
          if (array[i * 3 + 2] > 5) {
            array[i * 3 + 2] = -ROAD_LENGTH;
          }
        }
        posAttr.needsUpdate = true;
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);

      // Dispose
      renderer.dispose();
      roadGeometry.dispose();
      roadMaterial.dispose();
      railGeometry.dispose();
      towerGeo.dispose();
      particlesGeo.dispose();
      particlesMat.dispose();
      hoodGeo.dispose();
      hoodMat.dispose();
      reticleGeo.dispose();
      reticleMat.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [onSceneReady]);

  return <div ref={mountRef} className={`relative w-full h-full overflow-hidden ${className}`} />;
}
