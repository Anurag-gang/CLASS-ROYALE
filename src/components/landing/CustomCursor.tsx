"use client";

import React, { useEffect, useState, useRef } from "react";

export function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [hovered, setHovered] = useState(false);
  const [cursorText, setCursorText] = useState("");
  const [visible, setVisible] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    // Check touch devices or prefers-reduced-motion
    if (window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsTouch(true);
      return;
    }

    const onMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (!visible) setVisible(true);

      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = target.closest("a, button, [data-cursor], [role='button'], input, select");
        if (interactive) {
          setHovered(true);
          const customText = interactive.getAttribute("data-cursor") || "";
          setCursorText(customText);
        } else {
          setHovered(false);
          setCursorText("");
        }
      }
    };

    const onMouseLeave = () => setVisible(false);
    const onMouseEnter = () => setVisible(true);

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
    };
  }, [visible]);

  if (isTouch || !visible) return null;

  return (
    <div
      className="fixed top-0 left-0 pointer-events-none z-50 transition-transform duration-75 ease-out"
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
      }}
    >
      <div className="relative -top-1/2 -left-1/2 flex items-center justify-center">
        {/* Center dot */}
        <div
          className={`rounded-full transition-all duration-200 ${
            hovered
              ? "w-8 h-8 bg-cyan-400/10 border border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
              : "w-2 h-2 bg-white"
          }`}
        />

        {/* Precision Crosshair accents when hovered */}
        {hovered && (
          <>
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-px h-1 bg-cyan-400" />
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-px h-1 bg-cyan-400" />
            <span className="absolute top-1/2 -left-2 -translate-y-1/2 w-1 h-px bg-cyan-400" />
            <span className="absolute top-1/2 -right-2 -translate-y-1/2 w-1 h-px bg-cyan-400" />
          </>
        )}

        {/* Text tag if present */}
        {cursorText && (
          <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 font-mono text-[9px] uppercase tracking-widest text-cyan-300 font-bold whitespace-nowrap bg-black/80 px-1 py-0.5 border border-cyan-500/30">
            {cursorText}
          </span>
        )}
      </div>
    </div>
  );
}
