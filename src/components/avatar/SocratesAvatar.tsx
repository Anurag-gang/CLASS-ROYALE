"use client";

import React, { useEffect, useState } from "react";
import { createAvatar } from "@bible-strong/avatar-react";
import "@bible-strong/avatar-react/styles.css";
import socratesJson from "./socrates.avatar.json";

// Concrete typed avatar created via @bible-strong/avatar-react factory
export const BaseSocratesAvatar = createAvatar(socratesJson);

export type SocratesAnimation = "idle" | "thinking" | "speaking" | "inquiry" | "sleeping";
export type SocratesExpression = "neutral" | "thinking" | "speaking" | "inquiry" | "sleeping";

export interface SocratesAvatarProps {
  size?: number | string;
  animation?: SocratesAnimation;
  expression?: SocratesExpression;
  defaultAnimation?: SocratesAnimation;
  defaultExpression?: SocratesExpression;
  /** Friendly shortcut status for quick toggles across Class Royale */
  status?: "idle" | "thinking" | "speaking" | "inquiry" | "sleeping" | "victory";
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
  autoplay?: boolean;
}

export function SocratesAvatar({
  size = 120,
  animation,
  expression,
  defaultAnimation = "idle",
  defaultExpression,
  status,
  className = "",
  style,
  ariaLabel = "Socrates AI Tutor",
  autoplay = true,
}: SocratesAvatarProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Map high-level status prop if provided and explicit animation/expression is omitted
  let resolvedAnimation = animation;
  if (!resolvedAnimation && !expression && status) {
    if (status === "victory") resolvedAnimation = "speaking";
    else resolvedAnimation = status;
  }

  // SSR fallback placeholder preserving dimensions and sage theme
  if (!mounted) {
    const numericSize = typeof size === "number" ? `${size}px` : size;
    return (
      <div
        className={`inline-flex items-center justify-center rounded-full bg-[#1b072c] border-2 border-[#f755bc]/40 text-[#f755bc] select-none ${className}`}
        style={{
          width: numericSize,
          height: numericSize,
          ...style,
        }}
        aria-label={ariaLabel}
      >
        <span className="font-pixel text-xs tracking-wider animate-pulse">🏛️</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-block relative select-none ${className}`}
      style={{
        width: typeof size === "number" ? `${size}px` : size,
        height: typeof size === "number" ? `${size}px` : size,
        ...style,
      }}
    >
      <BaseSocratesAvatar
        size="100%"
        animation={resolvedAnimation}
        expression={expression}
        defaultAnimation={defaultAnimation}
        defaultExpression={defaultExpression}
        autoplay={autoplay}
        ariaLabel={ariaLabel}
      />
    </div>
  );
}

export default SocratesAvatar;
