import React from "react";
import { cn } from "@/lib/utils";

export interface PixelBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "pink" | "crimson" | "green" | "yellow" | "purple" | "cyan";
  children: React.ReactNode;
}

export const PixelBadge: React.FC<PixelBadgeProps> = ({
  variant = "pink",
  className,
  children,
  ...props
}) => {
  const variantStyles = {
    pink: "bg-[#25041b] text-[#f755bc] border-[#f755bc]",
    crimson: "bg-[#25040e] text-[#ff4d79] border-[#de1659]",
    green: "bg-[#042416] text-[#4ade80] border-[#10b981]",
    yellow: "bg-[#272102] text-[#facc15] border-[#eab308]",
    purple: "bg-[#180829] text-[#c084fc] border-[#9333ea]",
    cyan: "bg-[#04202c] text-[#38bdf8] border-[#0ea5e9]",
  }[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 font-pixel text-[9px] uppercase tracking-wider border-2 shadow-[2px_2px_0px_0px_#000000]",
        variantStyles,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};