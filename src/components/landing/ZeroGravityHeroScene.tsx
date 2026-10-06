"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { safeCreateWebGLRenderer } from "@/lib/webgl";

interface ZeroGravityHeroSceneProps {
  className?: string;
  onSceneReady?: () => void;
}

export function ZeroGravityHeroScene({ className = "", onSceneReady }: ZeroGravityHeroSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Try creating WebGL renderer safely
    const renderer = safeCreateWebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      alpha: false,
    });

    // =========================================================================
    // FALLBACK: 2D Canvas Zero-Gravity Engine (when WebGL is disabled/unsupported)
    // =========================================================================
    if (!renderer) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.display = "block";
      container.appendChild(canvas);

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        if (onSceneReady) onSceneReady();
        return;
      }

      // Zero-Gravity 2D Item definitions
      interface CanvasItem {
        type: "book" | "math" | "dsa" | "tech";
        x: number;
        y: number;
        baseX: number;
        baseY: number;
        vx: number;
        vy: number;
        rot: number;
        rotSpeed: number;
        scale: number;
        color: string;
        label: string;
        subLabel?: string;
        phase: number;
      }

      const items: CanvasItem[] = [
        // Books
        { type: "book", x: width * 0.2, y: height * 0.35, baseX: width * 0.2, baseY: height * 0.35, vx: 0, vy: 0, rot: -0.2, rotSpeed: 0.003, scale: 1, color: "#1e1b4b", label: "ALGORITHMS", phase: 0 },
        { type: "book", x: width * 0.8, y: height * 0.4, baseX: width * 0.8, baseY: height * 0.4, vx: 0, vy: 0, rot: 0.25, rotSpeed: -0.002, scale: 0.9, color: "#064e3b", label: "OS KERNEL", phase: 1.5 },
        { type: "book", x: width * 0.32, y: height * 0.78, baseX: width * 0.32, baseY: height * 0.78, vx: 0, vy: 0, rot: 0.15, rotSpeed: 0.0025, scale: 0.85, color: "#4c0519", label: "COMPILERS", phase: 3.1 },
        { type: "book", x: width * 0.72, y: height * 0.75, baseX: width * 0.72, baseY: height * 0.75, vx: 0, vy: 0, rot: -0.18, rotSpeed: -0.003, scale: 0.95, color: "#172554", label: "DATABASES", phase: 4.2 },

        // Mathematics Signs
        { type: "math", x: width * 0.15, y: height * 0.2, baseX: width * 0.15, baseY: height * 0.2, vx: 0, vy: 0, rot: 0, rotSpeed: 0.004, scale: 1, color: "#22d3ee", label: "∑", phase: 0.8 },
        { type: "math", x: width * 0.85, y: height * 0.22, baseX: width * 0.85, baseY: height * 0.22, vx: 0, vy: 0, rot: 0, rotSpeed: -0.003, scale: 1.1, color: "#a855f7", label: "∫", phase: 2.2 },
        { type: "math", x: width * 0.48, y: height * 0.18, baseX: width * 0.48, baseY: height * 0.18, vx: 0, vy: 0, rot: 0, rotSpeed: 0.002, scale: 0.9, color: "#38bdf8", label: "∞", phase: 1.1 },
        { type: "math", x: width * 0.25, y: height * 0.62, baseX: width * 0.25, baseY: height * 0.62, vx: 0, vy: 0, rot: 0, rotSpeed: -0.004, scale: 0.95, color: "#22d3ee", label: "π", phase: 3.8 },
        { type: "math", x: width * 0.78, y: height * 0.6, baseX: width * 0.78, baseY: height * 0.6, vx: 0, vy: 0, rot: 0, rotSpeed: 0.003, scale: 1, color: "#c084fc", label: "√x", phase: 5.0 },
        { type: "math", x: width * 0.12, y: height * 0.55, baseX: width * 0.12, baseY: height * 0.55, vx: 0, vy: 0, rot: 0, rotSpeed: 0.002, scale: 0.85, color: "#38bdf8", label: "O(n)", phase: 2.9 },

        // Tech Badges
        { type: "tech", x: width * 0.18, y: height * 0.72, baseX: width * 0.18, baseY: height * 0.72, vx: 0, vy: 0, rot: 0.05, rotSpeed: 0.001, scale: 1, color: "#38bdf8", label: "REACT", subLabel: "V19.0", phase: 0.5 },
        { type: "tech", x: width * 0.82, y: height * 0.78, baseX: width * 0.82, baseY: height * 0.78, vx: 0, vy: 0, rot: -0.08, rotSpeed: -0.0015, scale: 1, color: "#fbbf24", label: "PYTHON", subLabel: "3.12", phase: 2.7 },
        { type: "tech", x: width * 0.38, y: height * 0.28, baseX: width * 0.38, baseY: height * 0.28, vx: 0, vy: 0, rot: -0.05, rotSpeed: 0.002, scale: 0.95, color: "#60a5fa", label: "C++", subLabel: "C++23", phase: 4.1 },
        { type: "tech", x: width * 0.65, y: height * 0.25, baseX: width * 0.65, baseY: height * 0.25, vx: 0, vy: 0, rot: 0.07, rotSpeed: -0.002, scale: 0.95, color: "#06b6d4", label: "DOCKER", subLabel: "OCI", phase: 1.9 },

        // DSA Tree/Graph cluster
        { type: "dsa", x: width * 0.88, y: height * 0.38, baseX: width * 0.88, baseY: height * 0.38, vx: 0, vy: 0, rot: 0, rotSpeed: 0.001, scale: 1, color: "#22d3ee", label: "BST NODE", phase: 3.5 },
        { type: "dsa", x: width * 0.1, y: height * 0.38, baseX: width * 0.1, baseY: height * 0.38, vx: 0, vy: 0, rot: 0, rotSpeed: -0.001, scale: 1, color: "#a855f7", label: "DAG GRAPH", phase: 1.2 },
      ];

      // Cosmic background particles
      const particles: { x: number; y: number; size: number; alpha: number; speed: number }[] = [];
      for (let i = 0; i < 90; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 2 + 0.5,
          alpha: Math.random() * 0.6 + 0.2,
          speed: Math.random() * 0.4 + 0.1,
        });
      }

      let mouseX = 0;
      let mouseY = 0;
      let targetMouseX = 0;
      let targetMouseY = 0;

      const onMouseMove = (e: MouseEvent) => {
        targetMouseX = (e.clientX / window.innerWidth - 0.5) * 30;
        targetMouseY = (e.clientY / window.innerHeight - 0.5) * 30;
      };
      window.addEventListener("mousemove", onMouseMove);

      const onResize = () => {
        const newW = container.clientWidth || window.innerWidth;
        const newH = container.clientHeight || window.innerHeight;
        canvas.width = newW;
        canvas.height = newH;
      };
      window.addEventListener("resize", onResize);

      if (onSceneReady) {
        onSceneReady();
      }

      let animId = 0;
      let time = 0;

      const render2DFallback = () => {
        time += 0.016;
        mouseX += (targetMouseX - mouseX) * 0.05;
        mouseY += (targetMouseY - mouseY) * 0.05;

        ctx.fillStyle = "#050505";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid lines
        ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
        ctx.lineWidth = 1;
        const gridSize = 60;
        for (let x = 0; x < canvas.width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }

        // Draw cosmic particles
        particles.forEach((p) => {
          p.y -= p.speed;
          if (p.y < 0) p.y = canvas.height;
          ctx.fillStyle = `rgba(34, 211, 238, ${p.alpha})`;
          ctx.beginPath();
          ctx.arc(p.x + mouseX * 0.2, p.y + mouseY * 0.2, p.size, 0, Math.PI * 2);
          ctx.fill();
        });

        // Draw Zero-Gravity Items
        items.forEach((item) => {
          if (!prefersReducedMotion) {
            item.rot += item.rotSpeed;
            const floatY = Math.sin(time * 1.5 + item.phase) * 14;
            const floatX = Math.cos(time * 0.8 + item.phase) * 8;
            item.x = item.baseX + floatX + mouseX;
            item.y = item.baseY + floatY + mouseY;
          }

          ctx.save();
          ctx.translate(item.x, item.y);
          ctx.rotate(item.rot);
          ctx.scale(item.scale, item.scale);

          if (item.type === "book") {
            // Isometric floating book
            ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
            ctx.shadowBlur = 20;

            // Spine & cover
            ctx.fillStyle = item.color;
            ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
            ctx.lineWidth = 1.5;
            ctx.fillRect(-45, -60, 90, 120);
            ctx.strokeRect(-45, -60, 90, 120);

            // Page edges
            ctx.fillStyle = "#e2e8f0";
            ctx.fillRect(40, -56, 8, 112);

            // Title
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 9px 'JetBrains Mono', monospace";
            ctx.textAlign = "center";
            ctx.fillText(item.label, 0, 0);

            // Tech accent line
            ctx.strokeStyle = "#22d3ee";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-35, -40);
            ctx.lineTo(35, -40);
            ctx.stroke();
          } else if (item.type === "math") {
            // Glowing Math Circle Token
            ctx.shadowColor = item.color;
            ctx.shadowBlur = 15;

            ctx.fillStyle = "rgba(8, 15, 30, 0.85)";
            ctx.strokeStyle = item.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 26, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 20px 'JetBrains Mono', serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(item.label, 0, 0);
          } else if (item.type === "tech") {
            // Tech Badge Token
            ctx.shadowColor = item.color;
            ctx.shadowBlur = 12;

            ctx.fillStyle = "rgba(10, 14, 25, 0.9)";
            ctx.strokeStyle = item.color;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(-36, -20, 72, 40);
            ctx.fillRect(-36, -20, 72, 40);

            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 11px 'JetBrains Mono', monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(item.label, 0, -4);

            if (item.subLabel) {
              ctx.fillStyle = item.color;
              ctx.font = "8px 'JetBrains Mono', monospace";
              ctx.fillText(item.subLabel, 0, 9);
            }
          } else if (item.type === "dsa") {
            // Tree/Graph Node Cluster
            ctx.shadowColor = item.color;
            ctx.shadowBlur = 12;

            // Connected edges
            ctx.strokeStyle = "rgba(34, 211, 238, 0.4)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-24, 28);
            ctx.moveTo(0, 0);
            ctx.lineTo(24, 28);
            ctx.stroke();

            // Root node
            ctx.fillStyle = item.color;
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fill();

            // Children nodes
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(-24, 28, 5, 0, Math.PI * 2);
            ctx.arc(24, 28, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
            ctx.font = "8px 'JetBrains Mono', monospace";
            ctx.textAlign = "center";
            ctx.fillText(item.label, 0, -12);
          }

          ctx.restore();
        });

        animId = requestAnimationFrame(render2DFallback);
      };

      animId = requestAnimationFrame(render2DFallback);

      return () => {
        cancelAnimationFrame(animId);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("resize", onResize);
        if (container.contains(canvas)) {
          container.removeChild(canvas);
        }
      };
    }

    // =========================================================================
    // PRIMARY ENGINE: 3D Three.js WebGL Simulation
    // =========================================================================
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    scene.fog = new THREE.FogExp2(0x050505, 0.018);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    camera.position.set(0, 0, 24);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0x0a1020, 3.0);
    scene.add(ambientLight);

    const cyanLight = new THREE.PointLight(0x06b6d4, 80, 60);
    cyanLight.position.set(-15, 12, 10);
    scene.add(cyanLight);

    const violetLight = new THREE.PointLight(0xa855f7, 80, 60);
    violetLight.position.set(15, -10, 10);
    scene.add(violetLight);

    const centralLight = new THREE.PointLight(0x38bdf8, 40, 40);
    centralLight.position.set(0, 0, 5);
    scene.add(centralLight);

    // Array of zero-gravity floating objects
    interface FloatingItem {
      mesh: THREE.Object3D;
      rotSpeed: { x: number; y: number; z: number };
      floatSpeed: number;
      floatAmp: number;
      initialPos: THREE.Vector3;
      phase: number;
    }
    const floatingItems: FloatingItem[] = [];

    // Helper: Canvas Texture for Math Signs
    const createMathTexture = (symbol: string, color = "#22d3ee") => {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, 256, 256);

      ctx.beginPath();
      ctx.arc(128, 128, 110, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.fillStyle = "rgba(8, 15, 30, 0.75)";
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 90px 'JetBrains Mono', 'Plus Jakarta Sans', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(symbol, 128, 134);

      return new THREE.CanvasTexture(canvas);
    };

    // Helper: Canvas Texture for Tech Stack Logos
    const createTechTexture = (label: string, sub: string, color = "#a855f7") => {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 140;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, 256, 140);

      ctx.fillStyle = "rgba(6, 11, 24, 0.85)";
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.strokeRect(6, 6, 244, 128);
      ctx.fillRect(6, 6, 244, 128);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 44px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(label, 128, 65);

      ctx.fillStyle = color;
      ctx.font = "bold 20px 'JetBrains Mono', monospace";
      ctx.fillText(sub, 128, 105);

      return new THREE.CanvasTexture(canvas);
    };

    // Helper: Canvas Texture for Book Covers
    const createBookCoverTexture = (title: string, color: string, code: string) => {
      const canvas = document.createElement("canvas");
      canvas.width = 300;
      canvas.height = 420;
      const ctx = canvas.getContext("2d")!;

      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 300, 420);

      ctx.fillStyle = "#020408";
      ctx.fillRect(0, 0, 30, 420);

      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 20, 240, 380);

      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "bold 14px 'JetBrains Mono', monospace";
      ctx.fillText(code, 55, 55);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px 'Plus Jakarta Sans', sans-serif";
      const words = title.split(" ");
      let y = 140;
      words.forEach((word) => {
        ctx.fillText(word, 55, y);
        y += 34;
      });

      ctx.fillStyle = "#22d3ee";
      ctx.fillRect(55, 230, 40, 4);

      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = "12px 'JetBrains Mono', monospace";
      ctx.fillText("CLASS ROYALE ARCHIVE", 55, 370);

      return new THREE.CanvasTexture(canvas);
    };

    // 1. Spawning 3D Zero-Gravity Books
    const bookDefs = [
      { title: "ALGORITHMS & STRUCTURES", code: "CS-201", color: "#1e1b4b", pos: new THREE.Vector3(-11, 4.5, 3), rot: new THREE.Euler(0.3, 0.6, -0.2) },
      { title: "OPERATING SYSTEMS", code: "CS-202", color: "#064e3b", pos: new THREE.Vector3(12, 5, 2), rot: new THREE.Euler(-0.4, -0.5, 0.3) },
      { title: "DATABASE INTERNALS", code: "CS-203", color: "#172554", pos: new THREE.Vector3(-8, -6, 5), rot: new THREE.Euler(0.5, -0.4, 0.1) },
      { title: "COMPILER DESIGN", code: "CS-301", color: "#4c0519", pos: new THREE.Vector3(9.5, -5.5, 4), rot: new THREE.Euler(-0.2, 0.7, -0.4) },
      { title: "COMPUTER NETWORKS", code: "CS-204", color: "#312e81", pos: new THREE.Vector3(0, 8.5, -1), rot: new THREE.Euler(0.6, 0.1, 0.5) },
    ];

    bookDefs.forEach((b, idx) => {
      const bookGroup = new THREE.Group();
      const coverMat = new THREE.MeshStandardMaterial({
        map: createBookCoverTexture(b.title, b.color, b.code),
        roughness: 0.35,
        metalness: 0.15,
      });
      const pagesMat = new THREE.MeshStandardMaterial({
        color: 0xf1f5f9,
        roughness: 0.8,
      });
      const spineMat = new THREE.MeshStandardMaterial({
        color: 0x090d16,
        roughness: 0.4,
      });

      const materials = [
        pagesMat,
        spineMat,
        pagesMat,
        pagesMat,
        coverMat,
        coverMat,
      ];

      const bookGeo = new THREE.BoxGeometry(2.4, 3.4, 0.5);
      const bookMesh = new THREE.Mesh(bookGeo, materials);
      bookGroup.add(bookMesh);

      bookGroup.position.copy(b.pos);
      bookGroup.rotation.copy(b.rot);
      scene.add(bookGroup);

      floatingItems.push({
        mesh: bookGroup,
        rotSpeed: {
          x: (Math.random() - 0.5) * 0.18,
          y: (Math.random() - 0.5) * 0.22,
          z: (Math.random() - 0.5) * 0.15,
        },
        floatSpeed: 0.7 + idx * 0.15,
        floatAmp: 0.5 + Math.random() * 0.35,
        initialPos: b.pos.clone(),
        phase: Math.random() * Math.PI * 2,
      });
    });

    // 2. Spawning 3D Mathematical Signs
    const mathSymbols = [
      { sym: "∑", col: "#22d3ee", pos: new THREE.Vector3(-14, 1.5, 6) },
      { sym: "∫", col: "#38bdf8", pos: new THREE.Vector3(14, -1, 5) },
      { sym: "π", col: "#a855f7", pos: new THREE.Vector3(-6, 7, 4) },
      { sym: "∞", col: "#22d3ee", pos: new THREE.Vector3(6.5, 7.5, 3) },
      { sym: "√x", col: "#c084fc", pos: new THREE.Vector3(-12, -3.5, 5) },
      { sym: "O(n)", col: "#38bdf8", pos: new THREE.Vector3(13, 3, 4) },
      { sym: "λ", col: "#a855f7", pos: new THREE.Vector3(4, -7.5, 6) },
      { sym: "Δ", col: "#22d3ee", pos: new THREE.Vector3(-4, -8, 5) },
    ];

    mathSymbols.forEach((m, idx) => {
      const discGeo = new THREE.CylinderGeometry(1.1, 1.1, 0.12, 32);
      discGeo.rotateX(Math.PI / 2);

      const discMat = new THREE.MeshStandardMaterial({
        map: createMathTexture(m.sym, m.col),
        roughness: 0.2,
        metalness: 0.4,
        emissive: new THREE.Color(m.col),
        emissiveIntensity: 0.25,
      });

      const discMesh = new THREE.Mesh(discGeo, discMat);
      discMesh.position.copy(m.pos);
      scene.add(discMesh);

      floatingItems.push({
        mesh: discMesh,
        rotSpeed: {
          x: (Math.random() - 0.5) * 0.3,
          y: (Math.random() - 0.5) * 0.35,
          z: (Math.random() - 0.5) * 0.25,
        },
        floatSpeed: 0.8 + idx * 0.12,
        floatAmp: 0.6 + Math.random() * 0.4,
        initialPos: m.pos.clone(),
        phase: Math.random() * Math.PI * 2,
      });
    });

    // 3. Spawning 3D DSA Structures (Binary Search Tree & Directed Graphs)
    const create3DTree = (pos: THREE.Vector3, color = 0x22d3ee) => {
      const group = new THREE.Group();
      const nodeGeo = new THREE.SphereGeometry(0.35, 16, 16);
      const nodeMat = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.6,
        roughness: 0.2,
      });

      const rootNode = new THREE.Mesh(nodeGeo, nodeMat);
      rootNode.position.set(0, 1.2, 0);
      group.add(rootNode);

      const leftChild = new THREE.Mesh(nodeGeo, nodeMat);
      leftChild.position.set(-1.1, 0, 0);
      group.add(leftChild);

      const rightChild = new THREE.Mesh(nodeGeo, nodeMat);
      rightChild.position.set(1.1, 0, 0);
      group.add(rightChild);

      const leftLeft = new THREE.Mesh(nodeGeo, nodeMat);
      leftLeft.position.set(-1.7, -1.2, 0);
      group.add(leftLeft);

      const leftRight = new THREE.Mesh(nodeGeo, nodeMat);
      leftRight.position.set(-0.6, -1.2, 0);
      group.add(leftRight);

      const lineMat = new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: 0.6 });
      const addEdge = (p1: THREE.Vector3, p2: THREE.Vector3) => {
        const geo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
        const line = new THREE.Line(geo, lineMat);
        group.add(line);
      };

      addEdge(rootNode.position, leftChild.position);
      addEdge(rootNode.position, rightChild.position);
      addEdge(leftChild.position, leftLeft.position);
      addEdge(leftChild.position, leftRight.position);

      group.position.copy(pos);
      scene.add(group);

      floatingItems.push({
        mesh: group,
        rotSpeed: { x: 0.08, y: 0.12, z: 0.05 },
        floatSpeed: 0.65,
        floatAmp: 0.7,
        initialPos: pos.clone(),
        phase: 1.2,
      });
    };

    create3DTree(new THREE.Vector3(-13, -7, 4), 0x22d3ee);
    create3DTree(new THREE.Vector3(12, 8, 3), 0xa855f7);

    // 4. Spawning 3D Tech Stack Badges
    const techStack = [
      { name: "PYTHON", sub: "3.12 CORE", col: "#fbbf24", pos: new THREE.Vector3(-5, -3, 8) },
      { name: "REACT", sub: "V19.0", col: "#38bdf8", pos: new THREE.Vector3(5, -3, 8) },
      { name: "C++", sub: "C++23", col: "#60a5fa", pos: new THREE.Vector3(-7, 3, 7) },
      { name: "DOCKER", sub: "CONTAINER", col: "#06b6d4", pos: new THREE.Vector3(7, 3, 7) },
      { name: "LINUX", sub: "POSIX KERNEL", col: "#facc15", pos: new THREE.Vector3(-2, 5.5, 9) },
      { name: "SQL", sub: "ACID STORAGE", col: "#c084fc", pos: new THREE.Vector3(2, 5.5, 9) },
    ];

    techStack.forEach((t, idx) => {
      const planeGeo = new THREE.BoxGeometry(2.0, 1.1, 0.12);
      const badgeMat = new THREE.MeshStandardMaterial({
        map: createTechTexture(t.name, t.sub, t.col),
        roughness: 0.25,
        metalness: 0.35,
        emissive: new THREE.Color(t.col),
        emissiveIntensity: 0.2,
      });

      const badgeMesh = new THREE.Mesh(planeGeo, badgeMat);
      badgeMesh.position.copy(t.pos);
      scene.add(badgeMesh);

      floatingItems.push({
        mesh: badgeMesh,
        rotSpeed: {
          x: (Math.random() - 0.5) * 0.15,
          y: (Math.random() - 0.5) * 0.2,
          z: (Math.random() - 0.5) * 0.1,
        },
        floatSpeed: 0.75 + idx * 0.1,
        floatAmp: 0.45 + Math.random() * 0.25,
        initialPos: t.pos.clone(),
        phase: Math.random() * Math.PI * 2,
      });
    });

    // 5. Cosmic Ambient Dust Particles
    const particleCount = 200;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 50;
      particlePositions[i + 1] = (Math.random() - 0.5) * 35;
      particlePositions[i + 2] = (Math.random() - 0.5) * 30;
    }

    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));

    const particlesMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.12,
      transparent: true,
      opacity: 0.5,
    });
    const particleSystem = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particleSystem);

    // Mouse Tracking for Parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onMouseMove = (e: MouseEvent) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 3.5;
      targetY = (-(e.clientY / window.innerHeight) + 0.5) * 3.0;
    };

    window.addEventListener("mousemove", onMouseMove);

    const onResize = () => {
      const newW = container.clientWidth || window.innerWidth;
      const newH = container.clientHeight || window.innerHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener("resize", onResize);

    if (onSceneReady) {
      onSceneReady();
    }

    // Animation Loop
    let animId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      mouseX += (targetX - mouseX) * 0.04;
      mouseY += (targetY - mouseY) * 0.04;

      camera.position.x = mouseX;
      camera.position.y = mouseY;
      camera.lookAt(0, 0, 0);

      if (!prefersReducedMotion) {
        floatingItems.forEach((item) => {
          item.mesh.rotation.x += item.rotSpeed.x * delta;
          item.mesh.rotation.y += item.rotSpeed.y * delta;
          item.mesh.rotation.z += item.rotSpeed.z * delta;

          const floatOffset = Math.sin(time * item.floatSpeed + item.phase) * item.floatAmp;
          const lateralOffset = Math.cos(time * (item.floatSpeed * 0.7) + item.phase) * (item.floatAmp * 0.5);

          item.mesh.position.y = item.initialPos.y + floatOffset;
          item.mesh.position.x = item.initialPos.x + lateralOffset;
        });

        particleSystem.rotation.y = time * 0.02;
        particleSystem.rotation.x = time * 0.01;
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);

      renderer.dispose();
      particlesGeo.dispose();
      particlesMat.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [onSceneReady]);

  return <div ref={mountRef} className={`relative w-full h-full overflow-hidden ${className}`} />;
}
