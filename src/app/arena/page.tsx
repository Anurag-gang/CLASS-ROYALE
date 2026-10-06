"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { RetroCard } from "@/components/retro/RetroCard";
import { RetroButton } from "@/components/retro/RetroButton";
import { PixelBadge } from "@/components/retro/PixelBadge";
import { Swords, Shield, Flame, Trophy, Sparkles, Skull } from "lucide-react";
import { retroSound } from "@/lib/sound";

export default function ArenaPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/subjects")
      .then((res) => res.json())
      .then((data) => {
        const allCourses: any[] = [];
        (data.subjects || []).forEach((s: any) => {
          (s.courses || []).forEach((c: any) => {
            allCourses.push({ ...c, subjectTitle: s.title, subjectIcon: s.icon });
          });
        });
        setCourses(allCourses);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="font-pixel text-xs text-[#de1659] animate-pulse">
          PREPARING ARENA COLISEUM...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b-4 border-[#3b1c5a] pb-6 space-y-2">
        <div className="flex items-center gap-2">
          <Swords className="w-6 h-6 text-[#de1659]" />
          <h1 className="font-pixel text-xl sm:text-3xl text-white uppercase tracking-tight">
            THE ARENA COLISEUM
          </h1>
        </div>
        <p className="font-retro text-xl text-[#a79bb7]">
          Engage in timed combat quizzes, defeat algorithm golems, and earn legendary loot.
        </p>
      </div>

      {/* Arena Trials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((c) => (
          <div
            key={c.id}
            className="pixel-box-crimson p-6 bg-[#12020e] flex flex-col justify-between space-y-5 hover:scale-[1.01] transition-transform"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl p-1 bg-[#1c0418] border border-[#de1659]">
                  {c.subjectIcon}
                </span>
                <PixelBadge variant="crimson">BOSS BATTLE</PixelBadge>
              </div>

              <div>
                <span className="font-pixel text-[10px] text-[#de1659]">
                  {c.subjectTitle}
                </span>
                <h3 className="font-pixel text-sm text-white mt-1 leading-relaxed">
                  {c.title}
                </h3>
              </div>

              <p className="font-retro text-base text-[#a79bb7]">
                Face the final knowledge challenge for this curriculum. Flawless run awards +100 bonus XP.
              </p>

              <div className="p-3 bg-[#1d0315] border border-[#de1659] text-[10px] font-pixel text-amber-300 flex justify-between items-center">
                <span>XP PURSE:</span>
                <span>+150 XP TO +250 XP</span>
              </div>
            </div>

            <div className="pt-2">
              <Link href={`/quiz/${c.slug}`}>
                <RetroButton variant="crimson" size="sm" className="w-full">
                  <Swords className="w-4 h-4 mr-2" />
                  ENTER BATTLE
                </RetroButton>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}