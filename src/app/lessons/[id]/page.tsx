"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { RetroCard } from "@/components/retro/RetroCard";
import { RetroButton } from "@/components/retro/RetroButton";
import { PixelBadge } from "@/components/retro/PixelBadge";
import {
  BookOpen,
  CheckCircle2,
  Swords,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Zap,
} from "lucide-react";
import confetti from "canvas-confetti";
import { retroSound } from "@/lib/sound";

export default function LessonPage() {
  const params = useParams();
  const lessonId = params?.id as string;
  const router = useRouter();

  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [completeResult, setCompleteResult] = useState<any>(null);

  useEffect(() => {
    if (!lessonId) return;
    fetch(`/api/lessons/${lessonId}`)
      .then((res) => res.json())
      .then((data) => {
        setLesson(data.lesson || null);
        if (data.lesson?.completed) {
          setCompleteResult({ alreadyCompleted: true });
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [lessonId]);

  const handleComplete = async () => {
    if (completing || completeResult?.alreadyCompleted) return;
    setCompleting(true);

    try {
      const res = await fetch(`/api/lessons/${lessonId}/complete`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok) {
        retroSound.playLevelUp();
        setCompleteResult(data);
        try {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 },
            colors: ["#f755bc", "#de1659", "#facc15", "#4ade80"],
          });
        } catch {}
      } else {
        retroSound.playWrong();
      }
    } catch {
      retroSound.playWrong();
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="font-pixel text-xs text-[#f755bc] animate-pulse">
          FETCHING LESSON SCROLL...
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="font-pixel text-lg text-white">LESSON NOT FOUND</h2>
        <Link href="/learn">
          <RetroButton variant="pink" size="sm">
            BACK TO REALMS
          </RetroButton>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href={`/learn/${lesson.course.slug}`}
          onClick={() => retroSound.playClick()}
          className="inline-flex items-center gap-2 font-pixel text-[10px] text-[#a79bb7] hover:text-[#f755bc]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>COURSE ROADMAP ({lesson.course.title})</span>
        </Link>
        <PixelBadge variant="pink">+{lesson.xpReward} XP REWARD</PixelBadge>
      </div>

      {/* Lesson Container */}
      <article className="pixel-box-pink p-6 sm:p-10 bg-[#0c0217] space-y-8 shadow-[0_0_35px_rgba(247,85,188,0.15)]">
        {/* Title Header */}
        <div className="border-b-2 border-[#3b1c5a] pb-6 space-y-3">
          <div className="flex items-center gap-2 text-[#de1659] font-pixel text-xs">
            <BookOpen className="w-4 h-4" />
            <span>KNOWLEDGE ARCHIVES</span>
          </div>
          <h1 className="font-pixel text-xl sm:text-3xl text-white tracking-wide leading-snug">
            {lesson.title}
          </h1>
          <p className="font-retro text-xl text-[#a79bb7]">
            {lesson.description}
          </p>
        </div>

        {/* Lesson Content Body */}
        <div className="prose prose-invert max-w-none text-[#e2d9ee] font-sans space-y-6 leading-relaxed text-base">
          {lesson.content.split("\n\n").map((para: string, idx: number) => {
            if (para.startsWith("# ")) {
              return (
                <h2 key={idx} className="font-pixel text-lg text-[#f755bc] pt-4 border-t border-[#3b1c5a]">
                  {para.replace("# ", "")}
                </h2>
              );
            }
            if (para.startsWith("### ")) {
              return (
                <h3 key={idx} className="font-pixel text-sm text-amber-300 pt-2">
                  {para.replace("### ", "")}
                </h3>
              );
            }
            if (para.startsWith("```")) {
              const codeLines = para.replace(/```[a-z]*\n?/g, "");
              return (
                <pre key={idx} className="p-4 bg-[#05010a] border-2 border-[#3b1c5a] font-mono text-xs text-emerald-400 overflow-x-auto my-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
                  <code>{codeLines}</code>
                </pre>
              );
            }
            if (para.startsWith("- ") || para.startsWith("* ")) {
              return (
                <ul key={idx} className="list-disc list-inside space-y-1 pl-2 text-gray-300">
                  {para.split("\n").map((item, i) => (
                    <li key={i}>{item.replace(/^[-*]\s*/, "")}</li>
                  ))}
                </ul>
              );
            }
            return <p key={idx}>{para}</p>;
          })}
        </div>

        {/* Completion Status & Claim Action */}
        <div className="pt-8 border-t-2 border-[#3b1c5a] space-y-4">
          {completeResult?.xpEarned ? (
            <div className="p-5 bg-[#042416] border-2 border-[#10b981] text-left space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 font-pixel text-xs text-[#4ade80]">
                <CheckCircle2 className="w-5 h-5 text-[#4ade80]" />
                <span>QUEST COMPLETED! +{completeResult.xpEarned} XP AWARDED</span>
              </div>
              {completeResult.xpResult?.leveledUp && (
                <p className="font-pixel text-xs text-amber-300 animate-bounce">
                  ⭐ LEVEL UP! YOU REACHED LEVEL {completeResult.xpResult.newLevel}!
                </p>
              )}
            </div>
          ) : completeResult?.alreadyCompleted ? (
            <div className="p-4 bg-[#140522] border border-[#3b1c5a] font-pixel text-xs text-[#a79bb7] flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>LESSON ALREADY CLEARED</span>
              </div>
              <span className="text-[10px] text-gray-500">EXP LOGGED PREVIOUSLY</span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#140522] border-2 border-[#f755bc]">
              <div>
                <h4 className="font-pixel text-xs text-white">READY TO CLAIM XP?</h4>
                <p className="font-retro text-base text-[#a79bb7]">
                  Verify understanding and log this lesson into your character sheet.
                </p>
              </div>
              <RetroButton
                variant="pink"
                size="md"
                disabled={completing}
                onClick={handleComplete}
                className="whitespace-nowrap"
              >
                <Zap className="w-4 h-4 mr-2" />
                {completing ? "VERIFYING..." : "COMPLETE & CLAIM +100 XP"}
              </RetroButton>
            </div>
          )}

          {/* Navigation Between Lessons / Boss Quiz */}
          <div className="flex items-center justify-between pt-4">
            {lesson.prevLesson ? (
              <Link href={`/lessons/${lesson.prevLesson.id}`}>
                <button className="px-3 py-2 bg-[#0d0617] border border-[#3b1c5a] hover:border-[#f755bc] font-pixel text-[10px] text-[#a79bb7] hover:text-white flex items-center gap-1.5">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>PREV LESSON</span>
                </button>
              </Link>
            ) : <div />}

            {lesson.nextLesson ? (
              <Link href={`/lessons/${lesson.nextLesson.id}`}>
                <button className="px-4 py-2 bg-[#1f0b35] border border-[#f755bc] hover:bg-[#f755bc] hover:text-black font-pixel text-[10px] text-[#f755bc] flex items-center gap-1.5 transition-colors">
                  <span>NEXT LESSON</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </Link>
            ) : (
              <Link href={`/quiz/${lesson.course.slug}`}>
                <RetroButton variant="crimson" size="sm">
                  <Swords className="w-4 h-4 mr-1.5" />
                  ENTER BOSS QUIZ BATTLE
                </RetroButton>
              </Link>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}