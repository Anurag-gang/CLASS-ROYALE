import Link from "next/link";
import { RetroButton } from "@/components/retro/RetroButton";
import { Compass, HelpCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full pixel-box-pink p-8 bg-[#0e021a] text-center space-y-6 shadow-[0_0_30px_rgba(247,85,188,0.2)]">
        <div className="w-16 h-16 bg-[#1f0b35] border-4 border-[#f755bc] mx-auto flex items-center justify-center text-4xl shadow-[4px_4px_0px_0px_#000000]">
          🗺️
        </div>

        <div className="space-y-3">
          <div className="font-pixel text-xs text-[#de1659]">ERROR 404</div>
          <h1 className="font-pixel text-xl sm:text-2xl text-white">
            QUEST NOT FOUND
          </h1>
          <p className="font-pixel text-xs text-amber-300">
            THE PATH DOES NOT EXIST.
          </p>
          <p className="font-retro text-xl text-[#a79bb7]">
            You ventured beyond the mapped realms of Class Royale.
          </p>
        </div>

        <div className="pt-4">
          <Link href="/">
            <RetroButton variant="pink" size="md" className="w-full">
              [ RETURN HOME ]
            </RetroButton>
          </Link>
        </div>
      </div>
    </div>
  );
}