"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { RetroCard } from "@/components/retro/RetroCard";
import { RetroButton } from "@/components/retro/RetroButton";
import { PixelBadge } from "@/components/retro/PixelBadge";
import { CRAvatar } from "./CRAvatar";

export const CRDashboardWidget: React.FC = () => {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTelemetry() {
      try {
        const res = await fetch("/api/cr/context");
        if (res.ok) {
          const data = await res.json();
          setTelemetry(data.context);
        }
      } catch (e) {
        console.error("Failed loading CR telemetry", e);
      } finally {
        setLoading(false);
      }
    }
    loadTelemetry();
  }, []);

  const weakTopic = telemetry?.mastery?.weakTopics?.[0] || "Data Structures";
  const accuracy = telemetry?.progress?.averageQuizScorePercent || 0;
  const quizUrl = "/cr?prompt=" + encodeURIComponent("CR, quiz me on " + weakTopic);

  return (
    <RetroCard
      variant="default"
      className="relative overflow-hidden border-2 border-[#00ffcc] bg-gradient-to-r from-[#0d1627] via-[#09101d] to-[#120e24] p-5 shadow-[0_0_20px_rgba(0,255,204,0.15)]"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <CRAvatar size="lg" status="idle" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-arcade text-sm text-[#00ffcc] tracking-wider uppercase">
                CR LEARNING COMPANION
              </h3>
              <PixelBadge variant="green" className="font-arcade text-[9px]">
                ONLINE
              </PixelBadge>
            </div>

            <p className="mt-1 font-mono text-xs text-zinc-300 max-w-xl">
              {loading ? (
                "Synchronizing student telemetry..."
              ) : (
                <span>
                  Diagnostic update: Your current mastery accuracy is{" "}
                  <strong className="text-[#00ff66]">{accuracy}%</strong>. CR recommends a 10-min battle drill on{" "}
                  <strong className="text-[#ff00ff]">{weakTopic}</strong> before your next quest.
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <Link href={quizUrl}>
            <RetroButton size="sm" variant="crimson" className="font-arcade text-xs">
              ⚔️ BATTLE QUIZ
            </RetroButton>
          </Link>
          <Link href="/cr">
            <RetroButton size="sm" variant="pink" className="font-arcade text-xs">
              👑 OPEN CR
            </RetroButton>
          </Link>
        </div>
      </div>
    </RetroCard>
  );
};
