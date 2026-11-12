"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Brain, Sparkles, Swords } from "lucide-react";
import { CRAvatar } from "./CRAvatar";
import { retroSound } from "@/lib/sound";

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
  const accuracy = telemetry?.progress?.averageQuizScorePercent || 74;
  const quizUrl = "/cr?prompt=" + encodeURIComponent("Socrates, drill me on " + weakTopic + " invariants.");

  return (
    <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-[#0d162d]/90 via-[#0a1024]/80 to-[#120e2e]/90 p-5 shadow-[0_10px_35px_rgba(6,182,212,0.12)] backdrop-blur-xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <CRAvatar size="lg" status="idle" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-condensed font-black text-sm text-white tracking-wide uppercase">
                SOCRATES <span className="text-cyan-400">// LEARNING COMPANION</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[9px] font-mono text-emerald-400 font-semibold uppercase">
                ONLINE
              </span>
            </div>

            <p className="font-inter text-xs text-zinc-300 max-w-xl leading-relaxed">
              {loading ? (
                "Synchronizing student telemetry..."
              ) : (
                <span>
                  Diagnostic update: Your current mastery accuracy is{" "}
                  <strong className="text-emerald-400 font-semibold">{accuracy}%</strong>. Socrates recommends a 10-min battle drill on{" "}
                  <strong className="text-violet-400 font-semibold">{weakTopic}</strong> before your next quest.
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0">
          <Link
            href={quizUrl}
            onClick={() => retroSound.playClick()}
            className="px-4 py-2 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 border border-violet-400/40 text-violet-200 font-inter text-xs font-semibold transition-all shadow-[0_0_12px_rgba(139,92,246,0.2)] flex items-center gap-1.5"
          >
            <Swords className="w-3.5 h-3.5" />
            <span>BATTLE DRILL</span>
          </Link>
          <Link
            href="/cr"
            onClick={() => retroSound.playClick()}
            className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 font-inter text-xs font-semibold transition-all shadow-[0_0_12px_rgba(6,182,212,0.2)] flex items-center gap-1.5"
          >
            <Brain className="w-3.5 h-3.5" />
            <span>OPEN SOCRATES</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CRDashboardWidget;
