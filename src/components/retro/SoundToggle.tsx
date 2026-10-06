"use client";

import React, { useState, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { retroSound } from "@/lib/sound";

export const SoundToggle: React.FC = () => {
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(retroSound.isMuted());
  }, []);

  const handleToggle = () => {
    const isNowMuted = retroSound.toggleMute();
    setMuted(isNowMuted);
    if (!isNowMuted) {
      retroSound.playCoin();
    }
  };

  return (
    <button
      onClick={handleToggle}
      title={muted ? "Unmute 8-Bit Audio" : "Mute 8-Bit Audio"}
      aria-label="Toggle 8-Bit Audio"
      className="p-2 bg-[#0d0617] border-2 border-[#3b1c5a] text-[#f755bc] hover:border-[#f755bc] transition-colors shadow-[2px_2px_0px_0px_#000000] active:translate-y-0.5"
    >
      {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-[#f755bc]" />}
    </button>
  );
};