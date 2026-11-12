import React from "react";

export const SocratesLoadingFallback: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 h-screen w-screen bg-[#02040a] flex flex-col items-center justify-center space-y-4 select-none">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin" />
        <span className="absolute w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee] animate-pulse" />
      </div>
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="font-condensed font-black tracking-widest text-white text-base uppercase">
          INITIALIZING SOCRATES AI WORKSPACE
        </span>
        <span className="font-mono text-xs text-cyan-400/70">
          Connecting to dialectic neural substrate...
        </span>
      </div>
    </div>
  );
};

export default SocratesLoadingFallback;
