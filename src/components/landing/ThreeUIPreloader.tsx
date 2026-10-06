"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { retroSound } from "@/lib/sound";

interface PreloaderProps {
  onComplete?: () => void;
}

export function ThreeUIPreloader({ onComplete }: PreloaderProps) {
  const [progress, setProgress] = useState(0);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [mounted, setMounted] = useState(false);

  const phases = [
    "INITIALIZING NEURAL CURRICULUM CORE",
    "MAPPING ADAPTIVE KNOWLEDGE TOPOLOGY",
    "SYNCHRONIZING ZERO-GRAVITY ENGINE",
    "SYSTEM ARMED // CLASS ROYALE",
  ];

  useEffect(() => {
    setMounted(true);

    const startTime = performance.now();
    const duration = 3600; // 3.6s smooth cinematic sequence

    let animId: number;
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const rawProgress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - rawProgress, 3);
      const pct = Math.floor(eased * 100);
      setProgress(pct);

      if (pct < 30) setPhaseIndex(0);
      else if (pct < 65) setPhaseIndex(1);
      else if (pct < 92) setPhaseIndex(2);
      else setPhaseIndex(3);

      if (rawProgress < 1) {
        animId = requestAnimationFrame(tick);
      } else {
        setTimeout(() => {
          handleComplete();
        }, 300);
      }
    };

    animId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animId);
  }, []);

  const handleComplete = () => {
    retroSound.playLevelUp();
    setIsFinished(true);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 700);
  };

  if (!mounted) return null;

  const titleChars = "CLASS ROYALE".split("");

  return (
    <AnimatePresence>
      {!isFinished && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ y: "-100%", opacity: 0.9 }}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-50 bg-[#050505] text-white flex flex-col justify-between p-8 sm:p-14 select-none overflow-hidden"
        >
          {/* Top Bar: Brand & Skip */}
          <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
            <div className="flex items-center gap-2.5 font-mono text-xs text-white/50 tracking-widest uppercase">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee]" />
              <span>BOOT SEQUENCE // SYSTEM 2026</span>
            </div>

            <button
              type="button"
              onClick={handleComplete}
              className="px-4 py-1.5 rounded-full border border-white/10 hover:border-cyan-400/50 bg-white/[0.03] hover:bg-white/[0.08] text-white/60 hover:text-white font-mono text-[11px] tracking-wider uppercase transition-all"
            >
              SKIP [SPACE]
            </button>
          </div>

          {/* Center Stage: Cinematic Animated CLASS ROYALE Title */}
          <div className="my-auto flex flex-col items-center justify-center text-center space-y-8">
            {/* Glowing Aura backdrop */}
            <div className="relative">
              <div className="absolute -inset-10 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

              {/* Individual Animated Letters */}
              <h1 className="relative font-condensed font-black text-5xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight text-white uppercase flex items-center justify-center gap-1 sm:gap-2">
                {titleChars.map((char, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
                    animate={{
                      opacity: progress > i * 7 ? 1 : 0.15,
                      y: progress > i * 7 ? 0 : 20,
                      filter: progress > i * 7 ? "blur(0px)" : "blur(4px)",
                    }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className={`inline-block will-change-transform ${
                      char === " " ? "w-4 sm:w-8" : ""
                    }`}
                    style={{
                      textShadow:
                        progress > i * 7
                          ? "0 0 40px rgba(34, 211, 238, 0.4), 0 0 80px rgba(168, 85, 247, 0.2)"
                          : "none",
                    }}
                  >
                    {char}
                  </motion.span>
                ))}
              </h1>
            </div>

            {/* Sub-status and Phase indicator */}
            <div className="h-6 flex items-center justify-center">
              <motion.p
                key={phaseIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="font-mono text-xs sm:text-sm text-cyan-400 tracking-widest uppercase font-medium"
              >
                {phases[phaseIndex]}
              </motion.p>
            </div>
          </div>

          {/* Bottom Bar: Precision Progress Bar & Numerical Value */}
          <div className="w-full max-w-7xl mx-auto space-y-3">
            <div className="flex items-center justify-between font-mono text-xs text-white/50 tracking-wider">
              <span>ACTIVE ADAPTIVE PROTOCOL</span>
              <span className="text-white font-bold text-sm">
                {progress < 10 ? `0${progress}` : progress}%
              </span>
            </div>

            {/* Track and Progress Bar */}
            <div className="relative w-full h-[3px] bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-400 via-cyan-300 to-white shadow-[0_0_12px_#22d3ee]"
                style={{ width: `${progress}%` }}
                transition={{ ease: "easeOut" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
