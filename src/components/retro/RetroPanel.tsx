import React from "react";
import { cn } from "@/lib/utils";

export interface RetroPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  badge?: string;
  variant?: "default" | "pink" | "crimson";
  children: React.ReactNode;
}

export const RetroPanel: React.FC<RetroPanelProps> = ({
  title,
  badge,
  variant = "default",
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        "pixel-box relative p-5 pt-7",
        variant === "pink" && "border-[#f755bc]",
        variant === "crimson" && "border-[#de1659]",
        className
      )}
      {...props}
    >
      {title && (
        <div className="absolute -top-3.5 left-4 px-3 py-0.5 bg-[#05010a] border-2 border-[#f755bc] text-[#f755bc] font-pixel text-[10px] uppercase tracking-wider flex items-center gap-2">
          <span>{title}</span>
          {badge && (
            <span className="bg-[#de1659] text-white px-1.5 py-0.2 text-[8px]">
              {badge}
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  );
};