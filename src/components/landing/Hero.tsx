"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { ZeroGravityHeroScene } from "./ZeroGravityHeroScene";

// Dynamically import TechText from React Bits for client-only canvas support
const TechText = dynamic(() => import("@/components/reactbits/TechText"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center font-condensed font-black text-6xl sm:text-8xl md:text-9xl tracking-tighter text-white uppercase select-none opacity-40">
      CLASS ROYALE
    </div>
  ),
});

export function Hero() {
  const [revealed, setRevealed] = useState(false);

  return (
    <section className="relative w-full h-screen min-h-[700px] flex items-center justify-center overflow-hidden bg-[#050505]">
      {/* 3D Zero-Gravity Floating Universe */}
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <ZeroGravityHeroScene onSceneReady={() => setRevealed(true)} />
      </div>

      {/* Subtle Dark Vignette & Atmospheric Gradients */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/70" />
      <div className="absolute inset-0 z-10 pointer-events-none bg-radial from-transparent via-transparent to-[#050505]/80" />

      {/* Clean Minimal Overlay Frame */}
      <div className="absolute inset-0 z-20 pointer-events-none p-6 sm:p-10 md:p-14 flex flex-col justify-end items-center">
        {/* Minimal Persistent Scroll Indicator */}
        <div className="flex flex-col items-center gap-2 text-white/50">
          <div className="w-px h-8 bg-gradient-to-b from-white/60 via-cyan-400 to-transparent animate-pulse" />
        </div>
      </div>

      {/* Main Single Major Hero Wordmark with TechText from React Bits */}
      <div className="relative z-20 w-full max-w-6xl h-[300px] sm:h-[400px] md:h-[480px] mx-auto px-4 flex flex-col items-center justify-center pointer-events-auto">
        <TechText
          text="Class Royale"
          fontWeight={900}
          fontSize={175}
          reveal="letter"
          dashLength={13}
          dashGap={2}
          specks={37}
          accentColor="#22d3ee"
          color="#ffffff"
          strokeWidth={3.25}
          speed={1.2}
        />
      </div>
    </section>
  );
}
