"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Shield, Sparkles, AlertCircle } from "lucide-react";
import { RealmMap } from "@/components/realm/RealmMap";
import { KnowledgeKingdomQuizEngine } from "@/components/quiz/KnowledgeKingdomQuizEngine";
import { QuizSessionDTO } from "@/types/quiz";
import { retroSound } from "@/lib/sound";

export default function RealmTrialPage() {
  const params = useParams();
  const router = useRouter();
  const subjectSlug = (params?.subjectSlug as string) || "data-structures-and-algorithms";

  const [activeSession, setActiveSession] = useState<QuizSessionDTO | null>(null);
  const [startingTrial, setStartingTrial] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleStartLevel = async (levelNumber: number) => {
    setStartingTrial(true);
    setErrorMsg(null);
    retroSound.playClick();

    try {
      const res = await fetch("/api/quiz/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectSlug,
          levelNumber,
        }),
      });

      const data = await res.json();
      if (data.success && data.session) {
        setActiveSession(data.session);
        retroSound.playLevelUp();
      } else {
        setErrorMsg(data.error || "Failed to commence tier trial.");
        retroSound.playWrong();
      }
    } catch (err: any) {
      console.error("Trial start error:", err);
      setErrorMsg("Network failure while initiating trial.");
      retroSound.playWrong();
    } finally {
      setStartingTrial(false);
    }
  };

  const handleExitQuiz = () => {
    setActiveSession(null);
    setRefreshKey((prev) => prev + 1);
  };

  const handleCompleteLevel = (nextLevelNumber?: number) => {
    if (nextLevelNumber && nextLevelNumber <= 7) {
      handleStartLevel(nextLevelNumber);
    } else {
      handleExitQuiz();
    }
  };

  return (
    <div className="min-h-screen bg-[#030612] text-zinc-100 pt-20 pb-20 px-4 sm:px-6 lg:px-8">
      {/* Top Breadcrumb Nav */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between">
        <Link
          href="/arena"
          onClick={() => retroSound.playClick()}
          className="inline-flex items-center gap-2 text-xs font-inter font-medium text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          <span>Return to Territory Map</span>
        </Link>

        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-xs text-cyan-300 font-semibold uppercase tracking-wider">
            Knowledge Kingdom
          </span>
        </div>
      </div>

      {/* Starting Trial Spinner */}
      {startingTrial && (
        <div className="max-w-md mx-auto my-16 p-8 rounded-3xl bg-[#090e24] border border-cyan-500/30 text-center space-y-4 shadow-2xl">
          <div className="w-10 h-10 mx-auto rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <h3 className="font-condensed font-black text-xl text-white uppercase tracking-tight">
            Preparing Sovereign Trial
          </h3>
          <p className="font-inter text-xs text-zinc-400">
            Authorizing 12 academic challenges with authoritative timers...
          </p>
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && !startingTrial && (
        <div className="max-w-md mx-auto mb-6 p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 font-inter text-xs flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-white hover:text-zinc-300 underline font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Render Active Quiz Engine if Session Active */}
      {!startingTrial && activeSession ? (
        <KnowledgeKingdomQuizEngine
          initialSession={activeSession}
          onExit={handleExitQuiz}
          onCompleteLevel={handleCompleteLevel}
        />
      ) : !startingTrial ? (
        /* Render Realm Trail Map */
        <RealmMap
          key={refreshKey}
          subjectSlug={subjectSlug}
          onSelectLevel={handleStartLevel}
        />
      ) : null}
    </div>
  );
}