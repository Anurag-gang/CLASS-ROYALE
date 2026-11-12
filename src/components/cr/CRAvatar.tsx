"use client";

import React from "react";
import { SocratesAvatar, SocratesAnimation } from "@/components/avatar/SocratesAvatar";

export interface CRAvatarProps {
  size?: "sm" | "md" | "lg" | "xl" | number;
  status?: "idle" | "thinking" | "speaking" | "victory" | "inquiry" | "sleeping";
  className?: string;
  showBadge?: boolean;
}

const PIXEL_SIZES: Record<"sm" | "md" | "lg" | "xl", number> = {
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
};

export const CRAvatar: React.FC<CRAvatarProps> = ({
  size = "md",
  status = "idle",
  className = "",
  showBadge = true,
}) => {
  const pixelDimension = typeof size === "number" ? size : PIXEL_SIZES[size] || 48;
  const isSmall = pixelDimension <= 36;

  const statusAura = {
    idle: "border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]",
    thinking: "border-violet-400/60 shadow-[0_0_20px_rgba(139,92,246,0.4)] animate-pulse",
    speaking: "border-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.35)]",
    inquiry: "border-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.4)]",
    sleeping: "border-zinc-700 shadow-[0_0_10px_rgba(0,0,0,0.5)]",
    victory: "border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.5)]",
  };

  const currentAura = statusAura[status] || statusAura.idle;

  return (
    <div
      className={`relative inline-flex items-center justify-center bg-[#080d24] border ${isSmall ? "rounded-xl" : "rounded-2xl"} select-none overflow-hidden transition-all duration-300 ${currentAura} ${className}`}
      style={{
        width: `${pixelDimension}px`,
        height: `${pixelDimension}px`,
      }}
      title={`Socrates AI Tutor [${status.toUpperCase()}]`}
    >
      <SocratesAvatar
        size={pixelDimension - 4}
        status={status}
        ariaLabel={`Socrates AI Tutor - ${status}`}
      />
      {showBadge && (
        <span
          className={`absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border border-[#080d24] ${
            status === "thinking"
              ? "bg-violet-400 animate-ping"
              : status === "speaking"
              ? "bg-amber-400"
              : status === "victory"
              ? "bg-emerald-400"
              : status === "sleeping"
              ? "bg-zinc-600"
              : "bg-cyan-400"
          }`}
        />
      )}
    </div>
  );
};

export default CRAvatar;
