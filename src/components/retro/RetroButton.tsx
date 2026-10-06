"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { retroSound } from "@/lib/sound";

export interface RetroButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "pink" | "crimson" | "secondary" | "green" | "yellow";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const RetroButton = React.forwardRef<HTMLButtonElement, RetroButtonProps>(
  ({ variant = "pink", size = "md", className, children, onClick, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      retroSound.playClick();
      if (onClick) onClick(e);
    };

    const variantClass = {
      pink: "pixel-btn",
      crimson: "pixel-btn pixel-btn-crimson",
      secondary: "pixel-btn pixel-btn-secondary",
      green: "pixel-btn bg-emerald-600 text-white border-emerald-300 shadow-[inset_-3px_-3px_0px_0px_#064e3b,inset_3px_3px_0px_0px_#34d399,0_5px_0px_0px_#000000]",
      yellow: "pixel-btn bg-amber-400 text-black border-yellow-200 shadow-[inset_-3px_-3px_0px_0px_#854d0e,inset_3px_3px_0px_0px_#fef08a,0_5px_0px_0px_#000000]",
    }[variant];

    const sizeClass = {
      sm: "px-3 py-1.5 text-[10px]",
      md: "px-5 py-3 text-xs",
      lg: "px-7 py-4 text-sm",
    }[size];

    return (
      <button
        ref={ref}
        className={cn(variantClass, sizeClass, className)}
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    );
  }
);
RetroButton.displayName = "RetroButton";