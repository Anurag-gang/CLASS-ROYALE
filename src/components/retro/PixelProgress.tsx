import React from "react";
import { cn } from "@/lib/utils";

export interface PixelProgressProps {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  sublabel?: string;
  variant?: "pink" | "crimson" | "green" | "yellow" | "cyan";
  showPercent?: boolean;
  className?: string;
}

export const PixelProgress: React.FC<PixelProgressProps> = ({
  value,
  max = 100,
  label,
  sublabel,
  variant = "pink",
  showPercent = true,
  className,
}) => {
  const percent = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const barColor = {
    pink: "bg-gradient-to-r from-[#de1659] to-[#f755bc]",
    crimson: "bg-gradient-to-r from-[#880826] to-[#de1659]",
    green: "bg-gradient-to-r from-[#047857] to-[#10b981]",
    yellow: "bg-gradient-to-r from-[#b45309] to-[#facc15]",
    cyan: "bg-gradient-to-r from-[#0369a1] to-[#38bdf8]",
  }[variant];

  return (
    <div className={cn("w-full space-y-1.5", className)}>
      {(label || showPercent) && (
        <div className="flex justify-between items-center text-[10px] font-pixel">
          <span className="text-[#a79bb7] flex items-center gap-2">
            {label}
            {sublabel && <span className="text-white font-bold">{sublabel}</span>}
          </span>
          {showPercent && <span className="text-[#f755bc]">{percent}%</span>}
        </div>
      )}
      <div className="w-full h-4 bg-[#05010a] border-2 border-[#3b1c5a] p-0.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] relative overflow-hidden">
        <div
          className={cn("h-full transition-all duration-500 relative", barColor)}
          style={{ width: `${percent}%` }}
        >
          {/* Pixel block stripes */}
          <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(90deg,transparent,transparent_4px,rgba(0,0,0,0.8)_4px,rgba(0,0,0,0.8)_8px)]" />
        </div>
      </div>
    </div>
  );
};