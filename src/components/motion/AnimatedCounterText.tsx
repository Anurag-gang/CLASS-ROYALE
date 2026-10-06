"use client";

import React, { useRef, useEffect } from "react";

interface AnimatedCounterTextProps {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function AnimatedCounterText({
  value,
  prefix = "",
  suffix = "",
  className = "",
}: AnimatedCounterTextProps) {
  const elRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !elRef.current) return;
    let ctx: any;

    const init = async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      const obj = { val: 0 };
      ctx = gsap.context(() => {
        gsap.to(obj, {
          val: value,
          ease: "none",
          scrollTrigger: {
            trigger: elRef.current,
            start: "top 90%",
            end: "bottom 65%",
            scrub: true,
          },
          onUpdate: () => {
            if (elRef.current) {
              const formatted = Math.round(obj.val).toLocaleString();
              elRef.current.textContent = `${prefix}${formatted}${suffix}`;
            }
          },
        });
      });
    };

    init();
    return () => ctx?.revert();
  }, [value, prefix, suffix]);

  return (
    <span ref={elRef} className={`font-mono will-change-transform ${className}`}>
      {prefix}0{suffix}
    </span>
  );
}
