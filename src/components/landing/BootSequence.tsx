"use client";

import React, { useState, useEffect } from "react";
import { Terminal, Shield, Sparkles } from "lucide-react";
import { retroSound } from "@/lib/sound";

export interface BootSequenceProps {
  onComplete: () => void;
}

export const BootSequence: React.FC<BootSequenceProps> = ({ onComplete }) => {
  const [lines, setLines] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Check if user already booted recently
    const hasBooted = sessionStorage.getItem("class_royale_booted");
    if (hasBooted) {
      onComplete();
      return;
    }

    const script = [
      "CLASS ROYALE SYSTEM v1.0.4",
      "INITIALIZING HARDWARE CONTROLLERS...",
      "LOADING KNOWLEDGE ENGINE V8...",
      "CALIBRATING CRT SHADERS & AUDIO SYNTH...",
      "PLAYER CONNECTION ESTABLISHED [OK]",
      "WELCOME TO THE ARENA, PLAYER.",
    ];

    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < script.length) {
        setLines((prev) => [...prev, script[currentLine]]);
        setProgress((prev) => Math.min(100, Math.round(((currentLine + 1) / script.length) * 100)));
        retroSound.playClick();
        currentLine++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setDone(true);
          sessionStorage.setItem("class_royale_booted", "true");
          retroSound.playLevelUp();
          setTimeout(onComplete, 400);
        }, 500);
      }
    }, 380);

    return () => clearInterval(interval);
  }, [onComplete]);

  const handleSkip = () => {
    sessionStorage.setItem("class_royale_booted", "true");
    retroSound.playClick();
    onComplete();
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#05010a] flex flex-col items-center justify-center p-6 transition-opacity duration-500 ${
        done ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="w-full max-w-xl pixel-box-pink p-6 bg-[#090214] text-left">
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b-2 border-[#3b1c5a] pb-3 mb-4">
          <div className="flex items-center gap-2 text-[#f755bc] font-pixel text-xs">
            <Terminal className="w-4 h-4" />
            <span>BOOT_SEQUENCE.EXE</span>
          </div>
          <button
            onClick={handleSkip}
            className="text-[10px] font-pixel text-[#a79bb7] hover:text-[#f755bc] uppercase underline cursor-pointer"
          >
            [SKIP BOOT]
          </button>
        </div>

        {/* Lines Output */}
        <div className="space-y-2 font-pixel text-xs text-white min-h-[160px]">
          {lines.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[#f755bc]">&gt;</span>
              <span className={i === lines.length - 1 ? "text-amber-300" : "text-white"}>{l}</span>
            </div>
          ))}
          <div className="flex items-center gap-1 text-[#f755bc]">
            <span>&gt;</span>
            <span className="animate-blink">█</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 pt-4 border-t-2 border-[#3b1c5a]">
          <div className="flex justify-between items-center text-[10px] font-pixel text-[#a79bb7] mb-2">
            <span>LOADING ASSETS</span>
            <span className="text-[#f755bc]">{progress}%</span>
          </div>
          <div className="w-full h-4 bg-[#05010a] border-2 border-[#f755bc] p-0.5">
            <div
              className="h-full bg-gradient-to-r from-[#de1659] to-[#f755bc] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};