"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crosshair, RegistrationMark, CornerFrame } from "./TechnicalSystem";
import { retroSound } from "@/lib/sound";

interface PreloaderProps {
  onComplete?: () => void;
}

export function Preloader({ onComplete }: PreloaderProps) {
  const [count, setCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [bootStatus, setBootStatus] = useState("INITIALIZING ZERO-GRAVITY SYLLABUS...");

  useEffect(() => {
    // Check if previously loaded in this session to allow quick entry if desired
    const alreadyLoaded = sessionStorage.getItem("cr_preloaded_v2");
    const targetDuration = alreadyLoaded ? 800 : 1800; // fast on repeat, cinematic on first load
    const intervalTime = 25;
    const increment = 100 / (targetDuration / intervalTime);

    const interval = setInterval(() => {
      setCount((prev) => {
        const next = Math.min(100, Math.round(prev + increment));

        if (next < 30) {
          setBootStatus("CALIBRATING 0-GRAVITY PHYSICS & MATHEMATICS...");
        } else if (next < 60) {
          setBootStatus("SPAWNING DSA NODES & TECH STACK ENGINES...");
        } else if (next < 90) {
          setBootStatus("SYNCHRONIZING ADAPTIVE RETRIEVAL ENGINE...");
        } else {
          setBootStatus("SYSTEM ONLINE // CLASS ROYALE READY");
        }

        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            sessionStorage.setItem("cr_preloaded_v2", "true");
            retroSound.playLevelUp();
            setIsFinished(true);
            setTimeout(() => {
              if (onComplete) onComplete();
            }, 600);
          }, 200);
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [onComplete]);

  const handleSkip = () => {
    sessionStorage.setItem("cr_preloaded_v2", "true");
    retroSound.playClick();
    setIsFinished(true);
    if (onComplete) onComplete();
  };

  return (
    <AnimatePresence>
      {!isFinished && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ y: "-100%", opacity: 0.95 }}
          transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-50 bg-[#050505] text-white flex flex-col justify-between p-6 sm:p-12 md:p-16 select-none"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between font-mono text-xs text-white/50 uppercase tracking-widest border-b border-white/[0.08] pb-6">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span className="text-white font-bold">CLASS ROYALE</span>
            </div>

            <button
              type="button"
              onClick={handleSkip}
              className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/20 text-white/70 hover:text-white transition-colors cursor-pointer font-mono text-xs tracking-wider uppercase flex items-center gap-1.5"
            >
              <span>Skip &rarr;</span>
            </button>
          </div>

          {/* Center Counter */}
          <div className="my-auto flex flex-col items-center justify-center text-center space-y-4">
            <div className="font-condensed font-black text-8xl sm:text-9xl md:text-[14rem] lg:text-[18rem] tracking-tighter text-white uppercase leading-[0.8]">
              {count < 10 ? `0${count}` : count}
              <span className="text-cyan-400 font-light text-4xl sm:text-6xl md:text-8xl ml-2">%</span>
            </div>

            <div className="flex items-center gap-3 text-xs sm:text-sm font-mono text-cyan-300 tracking-widest uppercase">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>{bootStatus}</span>
            </div>

            {/* Progress bar line */}
            <div className="w-64 sm:w-96 h-1 bg-white/10 rounded-full overflow-hidden mt-6">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all duration-75"
                style={{ width: `${count}%` }}
              />
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs text-zinc-500 uppercase tracking-wider border-t border-white/[0.08] pt-6">
            <div className="flex items-center gap-4">
              <span className="text-cyan-400">ENGINEERING EDUCATION</span>
              <span>&bull;</span>
              <span>ADAPTIVE LEARNING</span>
            </div>

            <span>CLASS ROYALE &bull; UNIVERSITY PLATFORM</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
