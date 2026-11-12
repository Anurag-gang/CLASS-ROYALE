"use client";

import React from "react";
import { Search, Brain } from "lucide-react";

export interface SocratesActivityIndicatorProps {
  stage: "grounding" | "inference" | "streaming" | string | null;
  stageText?: string;
  modelName?: string;
  className?: string;
}

export function SocratesActivityIndicator({
  stage,
  stageText,
  modelName,
  className = "",
}: SocratesActivityIndicatorProps) {
  if (!stage) return null;

  // Resolve default text by stage if not provided
  const displayText =
    stageText ||
    (stage === "grounding"
      ? "Searching academic curriculum invariants..."
      : stage === "inference"
      ? "Formulating dialectic reasoning..."
      : "Formulating dialectic response...");

  return (
    <div
      role="status"
      aria-live="polite"
      className={`my-2 flex items-center gap-3 px-3.5 py-2 rounded-xl bg-[#070e22]/90 border border-cyan-500/30 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.15)] animate-in fade-in duration-300 w-fit max-w-full ${className}`}
    >
      {/* Dynamic Animated Status Icon */}
      <div className="relative flex items-center justify-center w-5 h-5 shrink-0">
        {stage === "grounding" && (
          <>
            <span className="absolute w-full h-full rounded-full bg-cyan-400/20 animate-ping" />
            <Search className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          </>
        )}

        {stage === "inference" && (
          <>
            <span className="absolute w-full h-full rounded-full bg-blue-500/30 animate-ping" />
            <Brain className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
          </>
        )}

        {stage !== "grounding" && stage !== "inference" && (
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] animate-pulse" />
        )}
      </div>

      {/* Stage Description & Live Badges */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-medium text-cyan-300 truncate">
            {displayText}
          </span>
          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-cyan-950/70 text-cyan-400 border border-cyan-800/40 shrink-0">
            {stage === "grounding" ? "GROUNDED" : "LIVE SSE"}
          </span>
        </div>
      </div>

      {/* Synchronized Wave Dots */}
      <div className="flex items-center gap-1 ml-1 shrink-0">
        <span className="w-1 h-1 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1 h-1 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1 h-1 rounded-full bg-cyan-400 animate-bounce" />
      </div>
    </div>
  );
}

export default SocratesActivityIndicator;
