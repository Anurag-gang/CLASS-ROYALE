"use client";

import React from "react";

interface CRAvatarProps {
  size?: "sm" | "md" | "lg" | "xl";
  status?: "idle" | "thinking" | "speaking" | "victory";
  className?: string;
}

export const CRAvatar: React.FC<CRAvatarProps> = ({
  size = "md",
  status = "idle",
  className = "",
}) => {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-base",
    lg: "w-16 h-16 text-xl",
    xl: "w-24 h-24 text-3xl",
  };

  const statusGlow = {
    idle: "border-[#00ffcc] shadow-[0_0_12px_rgba(0,255,204,0.4)]",
    thinking: "border-[#ff00ff] shadow-[0_0_15px_rgba(255,0,255,0.6)] animate-pulse",
    speaking: "border-[#ffe600] shadow-[0_0_15px_rgba(255,230,0,0.6)]",
    victory: "border-[#00ff66] shadow-[0_0_20px_rgba(0,255,102,0.8)] animate-bounce",
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center bg-[#0d121d] border-2 select-none font-arcade ${sizeClasses[size]} ${statusGlow[status]} ${className}`}
      style={{
        imageRendering: "pixelated",
        boxShadow: "inset 2px 2px 0px rgba(255,255,255,0.1), inset -2px -2px 0px rgba(0,0,0,0.8)",
      }}
    >
      <div className="flex flex-col items-center justify-center">
        <span className="leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">👑</span>
        <div className="flex items-center gap-1 mt-0.5">
          <span
            className={`inline-block w-1.5 h-1.5 ${
              status === "thinking"
                ? "bg-[#ff00ff] animate-ping"
                : status === "victory"
                ? "bg-[#00ff66]"
                : "bg-[#00ffcc]"
            }`}
          />
          <span
            className={`inline-block w-1.5 h-1.5 ${
              status === "thinking"
                ? "bg-[#ff00ff] animate-ping"
                : status === "victory"
                ? "bg-[#00ff66]"
                : "bg-[#00ffcc]"
            }`}
          />
        </div>
      </div>
      <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-[#00ff66] border border-black" />
    </div>
  );
};
