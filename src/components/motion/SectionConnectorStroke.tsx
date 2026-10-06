"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface SectionConnectorStrokeProps {
  variant?: "straight" | "curve-left" | "curve-right" | "s-curve";
  className?: string;
  glowColor?: string;
}

export function SectionConnectorStroke({
  variant = "s-curve",
  className = "",
  glowColor = "#22d3ee",
}: SectionConnectorStrokeProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const pathLength = useTransform(scrollYProgress, [0.1, 0.9], [0, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.2, 0.9, 0.9, 0.2]);

  let pathData = "M 50 0 C 50 100, 50 200, 50 300"; // straight default

  if (variant === "s-curve") {
    pathData = "M 20 0 C 80 80, 20 160, 80 240 L 50 300";
  } else if (variant === "curve-left") {
    pathData = "M 80 0 C 80 120, 20 180, 20 300";
  } else if (variant === "curve-right") {
    pathData = "M 20 0 C 20 120, 80 180, 80 300";
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-32 sm:h-44 flex items-center justify-center overflow-hidden pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 300"
        fill="none"
        preserveAspectRatio="none"
        className="w-16 sm:w-24 h-full"
      >
        {/* Subtle background track */}
        <path
          d={pathData}
          stroke="rgba(255, 255, 255, 0.06)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Dynamic drawn stroke */}
        <motion.path
          d={pathData}
          stroke={glowColor}
          strokeWidth="2"
          strokeLinecap="round"
          style={{
            pathLength,
            opacity,
            filter: `drop-shadow(0 0 8px ${glowColor})`,
          }}
        />
      </svg>
    </div>
  );
}
