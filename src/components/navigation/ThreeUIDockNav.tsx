"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import "@designcodeio/threeui/style.css";
import { retroSound } from "@/lib/sound";

const ThreeUIDock = dynamic(
  () =>
    import("@designcodeio/threeui").then((mod) => {
      return function DockComponent() {
        return (
          <div className="shader-frame flex items-center justify-center">
            <mod.AnimatedTopDock
              variant="sable"
              proximity={183}
              spring={0.19}
              damping={0.7}
              widthGrowth={17}
              heightGrowth={16}
              drop={3.5}
            />
          </div>
        );
      };
    }),
  { ssr: false }
);

export function ThreeUIDockNav() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
      <ThreeUIDock />
    </div>
  );
}
