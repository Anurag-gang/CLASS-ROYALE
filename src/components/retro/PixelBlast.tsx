"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { safeCreateWebGLRenderer } from "@/lib/webgl";
import "./PixelBlast.css";

type PixelBlastVariant = "square" | "circle" | "triangle" | "diamond";

export type PixelBlastProps = {
  variant?: PixelBlastVariant;
  pixelSize?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  antialias?: boolean;
  patternScale?: number;
  patternDensity?: number;
  enableRipples?: boolean;
  rippleIntensityScale?: number;
  rippleThickness?: number;
  rippleSpeed?: number;
  autoPauseOffscreen?: boolean;
  speed?: number;
  transparent?: boolean;
  edgeFade?: number;
};

const SHAPE_MAP: Record<PixelBlastVariant, number> = {
  square: 0,
  circle: 1,
  triangle: 2,
  diamond: 3,
};

const VERTEX_SRC = `
void main() {
  gl_Position = vec4(position, 1.0);
}
`;

const FRAGMENT_SRC = `
precision highp float;

uniform vec3  uColor;
uniform vec2  uResolution;
uniform float uTime;
uniform float uPixelSize;
uniform float uScale;
uniform float uDensity;
uniform int   uEnableRipples;
uniform float uRippleSpeed;
uniform float uRippleThickness;
uniform float uRippleIntensity;
uniform float uEdgeFade;
uniform int   uShapeType;

const int MAX_CLICKS = 6;
uniform vec2  uClickPos[MAX_CLICKS];
uniform float uClickTimes[MAX_CLICKS];

out vec4 fragColor;

float Bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2. + a.y * a.y * .75);
}
#define Bayer4(a) (Bayer2(.5*(a))*0.25 + Bayer2(a))
#define Bayer8(a) (Bayer4(.5*(a))*0.25 + Bayer2(a))

float hash11(float n){ return fract(sin(n)*43758.5453); }

float vnoise(vec3 p){
  vec3 ip = floor(p);
  vec3 fp = fract(p);
  float n000 = hash11(dot(ip + vec3(0.0,0.0,0.0), vec3(1.0,57.0,113.0)));
  float n100 = hash11(dot(ip + vec3(1.0,0.0,0.0), vec3(1.0,57.0,113.0)));
  float n010 = hash11(dot(ip + vec3(0.0,1.0,0.0), vec3(1.0,57.0,113.0)));
  float n110 = hash11(dot(ip + vec3(1.0,1.0,0.0), vec3(1.0,57.0,113.0)));
  float n001 = hash11(dot(ip + vec3(0.0,0.0,1.0), vec3(1.0,57.0,113.0)));
  float n101 = hash11(dot(ip + vec3(1.0,0.0,1.0), vec3(1.0,57.0,113.0)));
  float n011 = hash11(dot(ip + vec3(0.0,1.0,1.0), vec3(1.0,57.0,113.0)));
  float n111 = hash11(dot(ip + vec3(1.0,1.0,1.0), vec3(1.0,57.0,113.0)));
  vec3 w = fp*fp*fp*(fp*(fp*6.0-15.0)+10.0);
  float x00 = mix(n000, n100, w.x);
  float x10 = mix(n010, n110, w.x);
  float x01 = mix(n001, n101, w.x);
  float x11 = mix(n011, n111, w.x);
  float y0  = mix(x00, x10, w.y);
  float y1  = mix(x01, x11, w.y);
  return mix(y0, y1, w.z) * 2.0 - 1.0;
}

float fbm2(vec2 uv, float t){
  vec3 p = vec3(uv * uScale, t);
  float amp = 1.0;
  float freq = 1.0;
  float sum = 1.0;
  for (int i = 0; i < 4; ++i){
    sum  += amp * vnoise(p * freq);
    freq *= 1.25;
    amp  *= 1.0;
  }
  return sum * 0.5 + 0.5;
}

float maskDiamond(vec2 p, float cov){
  float r = sqrt(cov) * 0.564;
  return step(abs(p.x - 0.49) + abs(p.y - 0.49), r);
}

void main(){
  float pixelSize = max(uPixelSize, 1.0);
  vec2 fragCoord = gl_FragCoord.xy - uResolution * .5;
  float aspectRatio = uResolution.x / max(uResolution.y, 1.0);

  vec2 pixelUV = fract(fragCoord / pixelSize);
  float cellPixelSize = 8.0 * pixelSize;
  vec2 cellId = floor(fragCoord / cellPixelSize);
  vec2 cellCoord = cellId * cellPixelSize;
  vec2 uv = cellCoord / uResolution * vec2(aspectRatio, 1.0);

  float base = fbm2(uv, uTime * 0.05);
  base = base * 0.5 - 0.65;
  float feed = base + (uDensity - 0.5) * 0.3;

  float bayer = Bayer8(fragCoord / pixelSize) - 0.5;
  float bw = step(0.5, feed + bayer);
  float coverage = bw;

  float M = maskDiamond(pixelUV, coverage);

  if (uEdgeFade > 0.0) {
    vec2 norm = gl_FragCoord.xy / uResolution;
    float edge = min(min(norm.x, norm.y), min(1.0 - norm.x, 1.0 - norm.y));
    float fade = smoothstep(0.0, uEdgeFade, edge);
    M *= fade;
  }

  fragColor = vec4(uColor, M * 0.35);
}
`;

const MAX_CLICKS = 6;

const PixelBlast: React.FC<PixelBlastProps> = ({
  variant = "diamond",
  pixelSize = 5,
  color = "#de1659",
  className,
  style,
  patternScale = 2,
  patternDensity = 1.2,
  enableRipples = true,
  rippleIntensityScale = 1.3,
  rippleThickness = 0.25,
  rippleSpeed = 0.3,
  autoPauseOffscreen = true,
  speed = 0.5,
  transparent = true,
  edgeFade = 0.5,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const visibilityRef = useRef({ visible: true });
  const speedRef = useRef(speed);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = safeCreateWebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: "low-power",
    });
    if (!renderer) {
      return;
    }
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.setPixelRatio(Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 1.5));
    container.appendChild(renderer.domElement);

    if (transparent) renderer.setClearAlpha(0);
    else renderer.setClearColor(0x05010a, 1);

    const uniforms = {
      uResolution: { value: new THREE.Vector2(0, 0) },
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uClickPos: {
        value: Array.from({ length: MAX_CLICKS }, () => new THREE.Vector2(-1, -1)),
      },
      uClickTimes: { value: new Float32Array(MAX_CLICKS) },
      uShapeType: { value: SHAPE_MAP[variant] ?? 3 },
      uPixelSize: { value: pixelSize * renderer.getPixelRatio() },
      uScale: { value: patternScale },
      uDensity: { value: patternDensity },
      uEnableRipples: { value: enableRipples ? 1 : 0 },
      uRippleSpeed: { value: rippleSpeed },
      uRippleThickness: { value: rippleThickness },
      uRippleIntensity: { value: rippleIntensityScale },
      uEdgeFade: { value: edgeFade },
    };

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SRC,
      fragmentShader: FRAGMENT_SRC,
      uniforms,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      glslVersion: THREE.GLSL3,
    });

    const quadGeom = new THREE.PlaneGeometry(2, 2);
    const quad = new THREE.Mesh(quadGeom, material);
    scene.add(quad);

    const clock = new THREE.Clock();

    const setSize = () => {
      const w = Math.max(container.clientWidth, 1);
      const h = Math.max(container.clientHeight, 1);
      renderer.setSize(w, h, false);
      uniforms.uResolution.value.set(renderer.domElement.width, renderer.domElement.height);
      uniforms.uPixelSize.value = pixelSize * renderer.getPixelRatio();
    };

    setSize();
    const ro = new ResizeObserver(setSize);
    ro.observe(container);

    let raf = 0;
    const animate = () => {
      if (autoPauseOffscreen && !visibilityRef.current.visible) {
        raf = requestAnimationFrame(animate);
        return;
      }
      uniforms.uTime.value = clock.getElapsedTime() * speedRef.current;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      quadGeom.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [
    pixelSize,
    patternScale,
    patternDensity,
    enableRipples,
    rippleIntensityScale,
    rippleThickness,
    rippleSpeed,
    edgeFade,
    transparent,
    autoPauseOffscreen,
    variant,
    color,
  ]);

  return (
    <div
      ref={containerRef}
      className={`pixel-blast-container ${className ?? ""}`}
      style={style}
      aria-hidden="true"
    />
  );
};

export default PixelBlast;