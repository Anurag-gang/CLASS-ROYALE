"use client";

import React from "react";
import { RetroCard } from "@/components/retro/RetroCard";
import { PixelBadge } from "@/components/retro/PixelBadge";

interface Task {
  timeMin: number;
  action: string;
  description: string;
}

interface PlanDay {
  day: number;
  dateStr?: string;
  topic: string;
  tasks: Task[];
}

interface CRStudyPlanCardProps {
  planId?: string;
  subject: string;
  targetDate?: string;
  schedule: PlanDay[];
}

export const CRStudyPlanCard: React.FC<CRStudyPlanCardProps> = ({
  subject,
  targetDate,
  schedule,
}) => {
  return (
    <RetroCard
      variant="default"
      className="my-3 border-2 border-[#00ffcc] bg-[#0c121e] p-4 text-white shadow-[0_0_15px_rgba(0,255,204,0.2)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#00ffcc]/30 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🗺️</span>
          <div>
            <h4 className="font-arcade text-xs uppercase tracking-wider text-[#00ffcc]">
              CR ROADMAP: {subject}
            </h4>
            {targetDate && <p className="font-mono text-[10px] text-zinc-400">Target Date: {targetDate}</p>}
          </div>
        </div>
        <PixelBadge variant="cyan" className="font-arcade text-[10px]">
          {schedule.length}-DAY QUEST
        </PixelBadge>
      </div>

      <div className="mt-4 space-y-3">
        {schedule.map((dayItem) => (
          <div
            key={dayItem.day}
            className="rounded border border-zinc-800 bg-black/40 p-3 font-mono text-xs"
          >
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
              <span className="font-arcade text-[11px] text-[#ffe600]">
                {dayItem.dateStr || `DAY ${dayItem.day}`}
              </span>
              <span className="text-[10px] text-zinc-300 font-semibold">{dayItem.topic}</span>
            </div>

            <div className="mt-2 space-y-1.5">
              {dayItem.tasks.map((task, tIdx) => (
                <div key={tIdx} className="flex items-center gap-2 text-[11px] text-zinc-400">
                  <span className="font-arcade text-[9px] text-[#00ffcc] px-1 py-0.5 border border-[#00ffcc]/30 bg-[#00ffcc]/10">
                    {task.action}
                  </span>
                  <span className="text-zinc-500 font-mono text-[10px]">{task.timeMin}m</span>
                  <span className="flex-1 text-zinc-300">{task.description}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </RetroCard>
  );
};
