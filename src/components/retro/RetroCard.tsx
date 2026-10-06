import React from "react";
import { cn } from "@/lib/utils";

export interface RetroCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "pink" | "crimson" | "green" | "yellow";
  children: React.ReactNode;
}

export const RetroCard: React.FC<RetroCardProps> = ({
  variant = "default",
  className,
  children,
  ...props
}) => {
  const variantClass = {
    default: "pixel-box",
    pink: "pixel-box-pink",
    crimson: "pixel-box-crimson",
    green: "pixel-box-green",
    yellow: "pixel-box-yellow",
  }[variant];

  return (
    <div className={cn(variantClass, "p-5", className)} {...props}>
      {children}
    </div>
  );
};