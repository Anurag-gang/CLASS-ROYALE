"use client";

import React, { useState } from "react";
import { RetroCard } from "@/components/retro/RetroCard";
import { RetroButton } from "@/components/retro/RetroButton";
import { PixelBadge } from "@/components/retro/PixelBadge";

interface RevisionCard {
  id: string;
  front: string;
  back: string;
  category: string;
}

interface CRRevisionPackCardProps {
  packId?: string;
  topic: string;
  summary?: string;
  cards: RevisionCard[];
}

export const CRRevisionPackCard: React.FC<CRRevisionPackCardProps> = ({
  topic,
  summary,
  cards,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const card = cards[currentIdx];

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIdx < cards.length - 1) setCurrentIdx((prev) => prev + 1);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    if (currentIdx > 0) setCurrentIdx((prev) => prev - 1);
  };

  return (
    <RetroCard
      variant="yellow"
      className="my-3 border-2 border-[#ffe600] bg-[#141208] p-4 text-white shadow-[0_0_15px_rgba(255,230,0,0.2)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ffe600]/30 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚡</span>
          <div>
            <h4 className="font-arcade text-xs uppercase tracking-wider text-[#ffe600]">
              REVISION VAULT: {topic}
            </h4>
            {summary && <p className="font-mono text-[10px] text-zinc-400">{summary}</p>}
          </div>
        </div>
        <PixelBadge variant="yellow" className="font-arcade text-[10px]">
          CARD {currentIdx + 1} / {cards.length}
        </PixelBadge>
      </div>

      {card && (
        <div className="mt-4">
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="cursor-pointer min-h-[140px] rounded border-2 border-dashed border-zinc-700 bg-black/60 p-5 flex flex-col items-center justify-center text-center transition-all hover:border-[#ffe600]/60"
          >
            <span className="font-arcade text-[9px] uppercase tracking-widest text-zinc-500 mb-2">
              {isFlipped ? "— EXPLANATION / ANSWER —" : "— ACTIVE RECALL PROMPT —"}
            </span>

            <p className="font-mono text-sm leading-relaxed text-zinc-200">
              {isFlipped ? card.back : card.front}
            </p>

            <span className="font-mono text-[9px] text-[#00ffcc] mt-3 underline">
              [ CLICK TO {isFlipped ? "HIDE ANSWER" : "REVEAL ANSWER"} ]
            </span>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex gap-2">
              <RetroButton
                size="sm"
                variant="secondary"
                disabled={currentIdx === 0}
                onClick={handlePrev}
                className="text-[10px]"
              >
                ◄ PREV
              </RetroButton>
              <RetroButton
                size="sm"
                variant="secondary"
                disabled={currentIdx === cards.length - 1}
                onClick={handleNext}
                className="text-[10px]"
              >
                NEXT ►
              </RetroButton>
            </div>

            <PixelBadge variant="purple" className="font-mono text-[10px]">
              {card.category}
            </PixelBadge>
          </div>
        </div>
      )}
    </RetroCard>
  );
};
