"use client";

import { useEffect } from "react";
import { RetroButton } from "@/components/retro/RetroButton";
import { AlertOctagon, RefreshCw } from "lucide-react";
import { retroSound } from "@/lib/sound";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    retroSound.playWrong();
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full pixel-box-crimson p-8 bg-[#14020a] text-center space-y-6 shadow-[0_0_30px_rgba(222,22,89,0.2)]">
        <div className="w-16 h-16 bg-[#2a0410] border-4 border-[#de1659] mx-auto flex items-center justify-center text-4xl shadow-[4px_4px_0px_0px_#000000]">
          👾
        </div>

        <div className="space-y-3">
          <div className="font-pixel text-xs text-red-400">STATUS CODE 500</div>
          <h1 className="font-pixel text-xl sm:text-2xl text-white">
            SYSTEM ERROR
          </h1>
          <p className="font-pixel text-xs text-amber-300 leading-relaxed">
            THE KNOWLEDGE ENGINE ENCOUNTERED AN ERROR.
          </p>
          <p className="font-retro text-xl text-[#a79bb7]">
            A glitch disrupted transmission. Reset the game cartridge to continue.
          </p>
        </div>

        <div className="pt-4">
          <RetroButton
            variant="crimson"
            size="md"
            className="w-full"
            onClick={() => {
              retroSound.playClick();
              reset();
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            [ RETRY CARTRIDGE ]
          </RetroButton>
        </div>
      </div>
    </div>
  );
}