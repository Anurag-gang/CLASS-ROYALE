/**
 * Safe WebGL Capability Detector and Renderer Creator
 * Prevents uncaught "THREE.WebGLRenderer: Error creating WebGL context" crashes
 * in environments where WebGL/hardware acceleration is disabled, sandboxed, or unsupported.
 */

import * as THREE from "three";

export function isWebGLAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    return Boolean(gl && gl instanceof WebGLRenderingContext || (typeof WebGL2RenderingContext !== "undefined" && gl instanceof WebGL2RenderingContext));
  } catch (e) {
    return false;
  }
}

export function safeCreateWebGLRenderer(
  parameters?: THREE.WebGLRendererParameters
): THREE.WebGLRenderer | null {
  if (!isWebGLAvailable()) {
    return null;
  }

  try {
    const renderer = new THREE.WebGLRenderer(parameters);
    return renderer;
  } catch (err) {
    console.warn("WebGL initialization failed, falling back to 2D/CSS mode:", err);
    return null;
  }
}
