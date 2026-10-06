"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Swords, Heart, ShieldAlert } from "lucide-react";

export const Footer: React.FC = () => {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  return (
    <footer className="border-t-4 border-[#3b1c5a] bg-[#05010a]/95 py-12 relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[#de1659] border-2 border-[#f755bc] flex items-center justify-center text-white">
                <Swords className="w-4 h-4 text-white" />
              </div>
              <span className="font-pixel text-sm text-white tracking-wider">
                CLASS <span className="text-[#f755bc]">ROYALE</span>
              </span>
            </div>
            <p className="font-retro text-base text-[#a79bb7] max-w-sm leading-relaxed">
              Authentic 8-bit gamified learning. Complete quests, defeat quiz bosses, and level up.
            </p>
            <div className="text-xs font-pixel text-[#f755bc] flex items-center gap-2">
              <span>INSERT COIN TO CONTINUE</span>
              <span className="animate-blink">█</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-pixel text-xs text-[#f755bc] tracking-wider uppercase">GAME REALMS</h4>
            <ul className="space-y-2 font-retro text-base text-[#a79bb7]">
              <li><Link href="/quests" className="hover:text-white transition-colors">Quest Board</Link></li>
              <li><Link href="/learn" className="hover:text-white transition-colors">Class Selection</Link></li>
              <li><Link href="/arena" className="hover:text-white transition-colors">Battle Arena</Link></li>
              <li><Link href="/ai-tutor" className="hover:text-[#f755bc] transition-colors">AI Sage Tutor</Link></li>
              <li><Link href="/leaderboard" className="hover:text-white transition-colors">High Scores</Link></li>
            </ul>
          </div>

          {/* Rules / System Info */}
          <div className="space-y-3">
            <h4 className="font-pixel text-xs text-[#de1659] tracking-wider uppercase">SYSTEM SPECS</h4>
            <div className="p-3 bg-[#0d0617] border-2 border-[#3b1c5a] text-xs font-mono text-[#a79bb7] space-y-1">
              <div>ENGINE: NEXT.JS APP ROUTER</div>
              <div>GRAPHICS: CRT / THREE.JS</div>
              <div>AUDIO: 8-BIT SYNTH</div>
              <div>VERSION: 1.0.4-RELEASE</div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-[#3b1c5a]/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-pixel text-[#7e6e91]">
          <p>© 2026 CLASS ROYALE. ALL RIGHTS RESERVED.</p>
          <div className="flex items-center gap-2">
            <span>BUILT WITH RETRO PASSION</span>
            <Heart className="w-3.5 h-3.5 text-[#de1659] fill-[#de1659]" />
          </div>
        </div>
      </div>
    </footer>
  );
};