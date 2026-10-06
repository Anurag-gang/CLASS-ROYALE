"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { safeCreateWebGLRenderer } from "@/lib/webgl";
import { isReducedMotionPreferred } from "@/lib/animations/gsap";

interface SubjectNodeMeta {
  id: string;
  name: string;
  code: string;
  mastery: number;
  color: number;
  x: number;
  y: number;
  z: number;
}

const subjectNodesMeta: SubjectNodeMeta[] = [
  { id: "dsa", name: "Data Structures & Algorithms", code: "CS-201", mastery: 94, color: 0x8b5cf6, x: -3.8, y: 1.5, z: 0.5 },
  { id: "os", name: "Operating Systems", code: "CS-202", mastery: 72, color: 0x06b6d4, x: 3.8, y: 1.2, z: -0.5 },
  { id: "dbms", name: "Database Management Systems", code: "CS-203", mastery: 86, color: 0x10b981, x: -3.2, y: -2.0, z: -0.2 },
  { id: "networks", name: "Computer Networks", code: "CS-204", mastery: 64, color: 0x3b82f6, x: 3.4, y: -1.8, z: 0.3 },
  { id: "devops", name: "DevOps & Cloud Engineering", code: "CS-301", mastery: 80, color: 0xf59e0b, x: 0, y: 3.2, z: -0.6 },
];

interface WorldSceneProps {
  className?: string;
  interactive?: boolean;
}

export const WorldScene: React.FC<WorldSceneProps> = ({
  className = "absolute inset-0 w-full h-full",
  interactive = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<SubjectNodeMeta | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reducedMotion = isReducedMotionPreferred();

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030712, 0.04);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      60
    );
    camera.position.set(0, 0, 11);

    // 2. Renderer
    const renderer = safeCreateWebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    if (!renderer) {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    container.appendChild(renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0x0a1024, 2.0);
    scene.add(ambientLight);

    const centerPointLight = new THREE.PointLight(0x8b5cf6, 3.5, 16);
    centerPointLight.position.set(0, 0, 0);
    scene.add(centerPointLight);

    // 4. Central Class Royale Learning Core
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // Core Icosahedron Wireframe
    const coreWireGeo = new THREE.IcosahedronGeometry(1.4, 1);
    const coreWireMat = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const coreWireMesh = new THREE.Mesh(coreWireGeo, coreWireMat);
    coreGroup.add(coreWireMesh);

    // Inner Nucleus Octahedron
    const nucleusGeo = new THREE.OctahedronGeometry(0.8, 0);
    const nucleusMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x8b5cf6,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8,
    });
    const nucleusMesh = new THREE.Mesh(nucleusGeo, nucleusMat);
    coreGroup.add(nucleusMesh);

    // Orbiting Orbital Rings
    const ringGeo = new THREE.TorusGeometry(1.9, 0.015, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.4,
    });
    const ring1 = new THREE.Mesh(ringGeo, ringMat);
    ring1.rotation.x = Math.PI / 3;
    coreGroup.add(ring1);

    const ring2 = new THREE.Mesh(ringGeo, ringMat);
    ring2.rotation.y = Math.PI / 3;
    ring2.rotation.x = -Math.PI / 4;
    coreGroup.add(ring2);

    // 5. Floating Engineering Subject Nodes
    const subjectMeshes: { meta: SubjectNodeMeta; mesh: THREE.Mesh; initY: number; speed: number }[] = [];
    const nodeGeo = new THREE.DodecahedronGeometry(0.55, 0);

    subjectNodesMeta.forEach((meta, idx) => {
      // Completed / high mastery nodes are brighter and emissive
      const isMastered = meta.mastery >= 85;
      const nodeMat = new THREE.MeshStandardMaterial({
        color: meta.color,
        emissive: meta.color,
        emissiveIntensity: isMastered ? 0.9 : 0.35,
        roughness: 0.3,
        metalness: 0.6,
        wireframe: !isMastered && meta.mastery < 70,
      });

      const mesh = new THREE.Mesh(nodeGeo, nodeMat);
      mesh.position.set(meta.x, meta.y, meta.z);
      mesh.userData = { meta };
      scene.add(mesh);

      subjectMeshes.push({
        meta,
        mesh,
        initY: meta.y,
        speed: 1.2 + idx * 0.2,
      });

      // Connecting data line to central core
      const linePoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(meta.x, meta.y, meta.z)];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
      const lineMat = new THREE.LineBasicMaterial({
        color: meta.color,
        transparent: true,
        opacity: isMastered ? 0.3 : 0.15,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      scene.add(line);
    });

    // 6. Background Particles (Subtle Knowledge Field)
    const particleCount = reducedMotion ? 60 : 180;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 25;
      particlePositions[i + 1] = (Math.random() - 0.5) * 20;
      particlePositions[i + 2] = (Math.random() - 0.5) * 15;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x8b5cf6,
      size: 0.045,
      transparent: true,
      opacity: 0.5,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 7. Raycasting & Mouse Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      mouse.x = x;
      mouse.y = y;

      targetX = (event.clientX / window.innerWidth - 0.5) * 0.8;
      targetY = (event.clientY / window.innerHeight - 0.5) * 0.8;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // 8. Resize Observer
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 9. Visibility Detection
    let isTabVisible = true;
    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 10. Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isTabVisible) return;

      const elapsed = clock.getElapsedTime();
      const rotSpeed = reducedMotion ? 0.2 : 1.0;

      // Parallax easing
      camera.position.x += (targetX - camera.position.x) * 0.04;
      camera.position.y += (-targetY - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      // Core rotation
      coreGroup.rotation.y = elapsed * 0.25 * rotSpeed;
      coreGroup.rotation.x = elapsed * 0.15 * rotSpeed;

      const scalePulse = 1.0 + Math.sin(elapsed * 2.0) * 0.04;
      nucleusMesh.scale.set(scalePulse, scalePulse, scalePulse);

      ring1.rotation.z = elapsed * 0.4 * rotSpeed;
      ring2.rotation.z = -elapsed * 0.3 * rotSpeed;

      // Float subject nodes
      subjectMeshes.forEach((item) => {
        item.mesh.position.y = item.initY + Math.sin(elapsed * item.speed) * 0.2;
        item.mesh.rotation.y = elapsed * 0.5 * rotSpeed;
        item.mesh.rotation.x = elapsed * 0.3 * rotSpeed;
      });

      // Raycast subject hover
      raycaster.setFromCamera(mouse, camera);
      const meshesToTest = subjectMeshes.map((s) => s.mesh);
      const intersects = raycaster.intersectObjects(meshesToTest);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const meta = hit.userData?.meta as SubjectNodeMeta;
        if (meta) {
          setHoveredNode(meta);
          document.body.style.cursor = "pointer";
        }
      } else {
        setHoveredNode(null);
        document.body.style.cursor = "default";
      }

      particles.rotation.y = elapsed * 0.02 * rotSpeed;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      resizeObserver.disconnect();
      document.body.style.cursor = "default";

      // Dispose Three.js resources
      coreWireGeo.dispose();
      coreWireMat.dispose();
      nucleusGeo.dispose();
      nucleusMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      nodeGeo.dispose();
      particleGeo.dispose();
      particleMat.dispose();

      subjectMeshes.forEach((item) => {
        if (Array.isArray(item.mesh.material)) {
          item.mesh.material.forEach((m) => m.dispose());
        } else {
          item.mesh.material.dispose();
        }
      });

      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [interactive]);

  return (
    <div className={`relative ${className}`}>
      <div ref={containerRef} className="w-full h-full" />

      {/* Floating Hover Card HUD when node is inspected */}
      {hoveredNode && (
        <div
          className="absolute top-20 right-8 z-30 p-4 rounded-xl bg-[#080d24]/90 border border-violet-500/40 backdrop-blur-xl shadow-2xl space-y-2 pointer-events-none animate-fade-in max-w-xs"
        >
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-cyan-400 font-bold">{hoveredNode.code}</span>
            <span className="px-2 py-0.5 rounded bg-violet-950 text-violet-300 font-semibold">
              {hoveredNode.mastery}% Mastery
            </span>
          </div>
          <h4 className="font-display font-bold text-sm text-white">{hoveredNode.name}</h4>
          <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full"
              style={{ width: `${hoveredNode.mastery}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-zinc-400 block pt-0.5">
            Click to explore syllabus &amp; practice quizzes
          </span>
        </div>
      )}
    </div>
  );
};
