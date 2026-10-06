"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { RetroCard } from "@/components/retro/RetroCard";
import { RetroButton } from "@/components/retro/RetroButton";
import { PixelBadge } from "@/components/retro/PixelBadge";
import { PixelProgress } from "@/components/retro/PixelProgress";
import { BookOpen, CheckCircle2, Lock, Swords, ArrowLeft, Trophy, Sparkles } from "lucide-react";
import { retroSound } from "@/lib/sound";

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params?.courseId as string;

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;
    fetch(`/api/courses/${courseId}`)
      .then((res) => res.json())
      .then((data) => setCourse(data.course || null))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="font-pixel text-xs text-[#f755bc] animate-pulse">
          LOADING COURSE ROADMAP...
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="font-pixel text-lg text-white">COURSE NOT FOUND</h2>
        <Link href="/learn">
          <RetroButton variant="pink" size="sm">
            BACK TO REALMS
          </RetroButton>
        </Link>
      </div>
    );
  }

  const completedCount = course.lessons.filter((l: any) => l.completed).length;
  const totalCount = course.lessons.length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Link */}
      <div>
        <Link
          href="/learn"
          onClick={() => retroSound.playClick()}
          className="inline-flex items-center gap-2 font-pixel text-[10px] text-[#a79bb7] hover:text-[#f755bc]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>BACK TO ALL REALMS</span>
        </Link>
      </div>

      {/* Course Hero Banner */}
      <div className="pixel-box-pink p-6 sm:p-8 bg-[#0e021a] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <PixelBadge variant="purple">{course.subject.title}</PixelBadge>
              <PixelBadge variant="pink">{course.difficulty}</PixelBadge>
            </div>
            <h1 className="font-pixel text-xl sm:text-3xl text-white tracking-wide">
              {course.title}
            </h1>
            <p className="font-retro text-xl text-[#a79bb7] max-w-2xl">
              {course.description}
            </p>
          </div>

          <div className="sm:text-right space-y-2">
            <div className="font-pixel text-xs text-amber-300">
              +{course.xpReward} TOTAL COURSE XP
            </div>
            <Link href={`/quiz/${course.slug}`}>
              <RetroButton variant="crimson" size="sm" className="w-full sm:w-auto">
                <Swords className="w-4 h-4 mr-2" />
                BOSS QUIZ BATTLE
              </RetroButton>
            </Link>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="pt-2 border-t border-[#3b1c5a]">
          <PixelProgress
            value={completedCount}
            max={totalCount || 1}
            label="COURSE COMPLETION"
            sublabel={`${completedCount} OF ${totalCount} LESSONS COMPLETED`}
            variant="pink"
            showPercent
          />
        </div>
      </div>

      {/* Lesson Tree Roadmap */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 font-pixel text-sm text-white">
          <BookOpen className="w-4 h-4 text-[#f755bc]" />
          <span>LESSON ROADMAP</span>
        </div>

        <div className="space-y-3">
          {course.lessons.map((lesson: any, idx: number) => (
            <div
              key={lesson.id}
              className={`pixel-box p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-transform hover:-translate-y-0.5 ${
                lesson.completed ? "bg-[#06170d] border-[#10b981]" : "bg-[#0c0316]"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 border-2 flex items-center justify-center font-pixel text-xs shrink-0 ${
                    lesson.completed
                      ? "bg-[#042416] border-[#10b981] text-[#4ade80]"
                      : "bg-[#1f0b35] border-[#f755bc] text-white"
                  }`}
                >
                  {lesson.completed ? <CheckCircle2 className="w-5 h-5" /> : `0${idx + 1}`}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-pixel text-xs sm:text-sm text-white">
                      {lesson.title}
                    </h3>
                    {lesson.completed && (
                      <span className="font-pixel text-[9px] text-[#4ade80] bg-[#042416] px-1.5 py-0.5 border border-[#10b981]">
                        CLEARED
                      </span>
                    )}
                  </div>
                  <p className="font-retro text-base text-[#a79bb7]">
                    {lesson.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                <span className="font-pixel text-[10px] text-amber-300">
                  +{lesson.xpReward} XP
                </span>
                <Link href={`/lessons/${lesson.id}`}>
                  <RetroButton
                    variant={lesson.completed ? "secondary" : "pink"}
                    size="sm"
                  >
                    {lesson.completed ? "REVIEW" : "START QUEST"}
                  </RetroButton>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}