"use client";

import React, { useRef, useEffect } from "react";

interface WordLightUpTextProps {
  text: string;
  className?: string;
  start?: string;
  end?: string;
}

export function WordLightUpText({
  text,
  className = "",
  start = "top 75%",
  end = "bottom 45%",
}: WordLightUpTextProps) {
  const containerRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;
    let ctx: any;

    const init = async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      const wordEls = containerRef.current?.querySelectorAll(".lightup-word");
      if (!wordEls || wordEls.length === 0) return;

      ctx = gsap.context(() => {
        gsap.to(wordEls, {
          color: "#ffffff",
          opacity: 1,
          stagger: 0.1,
          scrollTrigger: {
            trigger: containerRef.current,
            start,
            end,
            scrub: true,
          },
        });
      }, containerRef);
    };

    init();
    return () => ctx?.revert();
  }, [text, start, end]);

  const words = text.split(/\s+/);

  return (
    <p
      ref={containerRef}
      className={`font-body text-base sm:text-xl leading-relaxed ${className}`}
    >
      {words.map((w, idx) => (
        <span
          key={idx}
          className="lightup-word inline-block will-change-transform text-white/20 transition-colors"
        >
          {w}&nbsp;
        </span>
      ))}
    </p>
  );
}
