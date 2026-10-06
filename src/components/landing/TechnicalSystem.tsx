"use client";

import React from "react";

export function Crosshair({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none select-none flex items-center justify-center text-white/30 text-[10px] font-mono font-light ${className}`}
      aria-hidden="true"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="stroke-current">
        <line x1="6" y1="0" x2="6" y2="12" strokeWidth="0.75" />
        <line x1="0" y1="6" x2="12" y2="6" strokeWidth="0.75" />
      </svg>
    </div>
  );
}

export function RegistrationMark({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none select-none inline-flex items-center justify-center text-white/40 ${className}`}
      aria-hidden="true"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="stroke-current">
        <circle cx="7" cy="7" r="4.5" strokeWidth="0.75" />
        <line x1="7" y1="0" x2="7" y2="14" strokeWidth="0.75" />
        <line x1="0" y1="7" x2="14" y2="7" strokeWidth="0.75" />
      </svg>
    </div>
  );
}

export function CornerFrame({
  children,
  className = "",
  size = 8,
  borderColor = "border-white/20",
}: {
  children?: React.ReactNode;
  className?: string;
  size?: number;
  borderColor?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      {/* Top Left */}
      <span
        className={`absolute -top-px -left-px border-t border-l ${borderColor} pointer-events-none`}
        style={{ width: size, height: size }}
      />
      {/* Top Right */}
      <span
        className={`absolute -top-px -right-px border-t border-r ${borderColor} pointer-events-none`}
        style={{ width: size, height: size }}
      />
      {/* Bottom Left */}
      <span
        className={`absolute -bottom-px -left-px border-b border-l ${borderColor} pointer-events-none`}
        style={{ width: size, height: size }}
      />
      {/* Bottom Right */}
      <span
        className={`absolute -bottom-px -right-px border-b border-r ${borderColor} pointer-events-none`}
        style={{ width: size, height: size }}
      />
      {children}
    </div>
  );
}

export function TechnicalLabel({
  index,
  text,
  subtext,
  className = "",
}: {
  index?: string | number;
  text: string;
  subtext?: string;
  className?: string;
}) {
  return (
    <div className={`inline-flex items-center gap-2 font-mono text-[10px] tracking-wider uppercase ${className}`}>
      {index !== undefined && (
        <span className="text-cyan-400 font-semibold">[{typeof index === "number" && index < 10 ? `0${index}` : index}]</span>
      )}
      <span className="text-white/80">{text}</span>
      {subtext && <span className="text-white/40">// {subtext}</span>}
    </div>
  );
}

export function SectionHeader({
  number,
  category,
  title,
  subtitle,
  className = "",
}: {
  number?: string;
  category?: string;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const backRef = React.useRef<HTMLHeadingElement>(null);
  const midRef = React.useRef<HTMLHeadingElement>(null);
  const frontRef = React.useRef<HTMLParagraphElement>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const init = async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      if (!containerRef.current) return;

      if (backRef.current) {
        gsap.to(backRef.current, {
          y: -80,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      }
      if (midRef.current) {
        gsap.to(midRef.current, {
          y: -40,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      }
      if (frontRef.current) {
        gsap.to(frontRef.current, {
          y: -20,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      }
    };

    init();
  }, []);

  return (
    <div ref={containerRef} className={`parallax-layers relative py-6 overflow-visible ${className}`}>
      {/* Back Parallax Layer */}
      <h3
        ref={backRef}
        className="back absolute -top-8 sm:-top-12 left-0 font-condensed font-black text-6xl sm:text-8xl md:text-9xl uppercase tracking-tighter text-white pointer-events-none select-none opacity-10 leading-none whitespace-nowrap will-change-transform"
        aria-hidden="true"
      >
        {title}
      </h3>

      {/* Mid Parallax Layer */}
      <h2
        ref={midRef}
        className="mid relative z-10 font-condensed font-black text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight text-white uppercase leading-[0.88] cr-heading-hover cursor-default will-change-transform"
      >
        {title}
      </h2>

      {/* Front Parallax Layer */}
      {subtitle && (
        <p
          ref={frontRef}
          className="front relative z-10 font-body text-xs sm:text-sm text-zinc-400 max-w-xl font-normal mt-3 will-change-transform"
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function TechnicalBorder({ className = "" }: { className?: string }) {
  // Line divider removed per design requirement: seamless transitions without harsh dividing lines
  return null;
}
