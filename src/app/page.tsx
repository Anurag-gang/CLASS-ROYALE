"use client";

import React, { useState } from "react";
import { SmoothScrollProvider } from "@/components/landing/SmoothScrollProvider";
import { CustomCursor } from "@/components/landing/CustomCursor";
import { Hero } from "@/components/landing/Hero";
import { ThreeUIPreloader } from "@/components/landing/ThreeUIPreloader";
import { ScrollStrokeSection } from "@/components/landing/ScrollStrokeSection";
import { InfiniteMarquee } from "@/components/landing/InfiniteMarquee";
import { Section01Subjects } from "@/components/landing/Section01Subjects";
import { ParallaxGallerySection } from "@/components/landing/ParallaxGallerySection";
import { Section02Quizzes } from "@/components/landing/Section02Quizzes";
import { Section03Adaptive } from "@/components/landing/Section03Adaptive";
import { Section04Mastery } from "@/components/landing/Section04Mastery";
import { Section05Badges } from "@/components/landing/Section05Badges";
import { Section06Clans } from "@/components/landing/Section06Clans";
import { Section07Faculty } from "@/components/landing/Section07Faculty";
import { SectionFinalCTA } from "@/components/landing/SectionFinalCTA";
import { SectionConnectorStroke } from "@/components/motion/SectionConnectorStroke";

export default function LandingPage() {
  const [preloaderDone, setPreloaderDone] = useState(false);

  return (
    <SmoothScrollProvider>
      <div className="relative min-h-screen bg-[#050505] text-white selection:bg-cyan-400 selection:text-slate-950 font-body overflow-x-hidden">
        {/* Full-Screen Preloader Animation (ThreeUI TextAnimationCollection) */}
        <ThreeUIPreloader onComplete={() => setPreloaderDone(true)} />

        {/* Subtle Technical Precision Cursor */}
        <CustomCursor />

        {/* Cinematic Journey Sections */}
        <main className="relative z-10 flex flex-col">
          {/* Hero: 0-Gravity Universe + "CLASS ROYALE" */}
          <Hero />

          {/* Infinite Scroll Ticker: Core Engineering Tracks */}
          <InfiniteMarquee />

          {/* Skiper19: The Stroke that follows the Scroll Progress */}
          <ScrollStrokeSection />

          <SectionConnectorStroke variant="curve-left" />

          {/* 01: Subjects */}
          <Section01Subjects />

          <SectionConnectorStroke variant="curve-right" />

          {/* Skiper30: Multi-column Parallax Gallery of Real Engineering & Labs */}
          <ParallaxGallerySection />

          <SectionConnectorStroke variant="s-curve" />

          {/* 02: Quizzes */}
          <Section02Quizzes />

          <SectionConnectorStroke variant="curve-left" />

          {/* 03: Adaptive Learning */}
          <Section03Adaptive />

          <SectionConnectorStroke variant="curve-right" />

          {/* 04: Topic Mastery */}
          <Section04Mastery />

          <SectionConnectorStroke variant="s-curve" />

          {/* 05: Badges */}
          <Section05Badges />

          <SectionConnectorStroke variant="curve-left" />

          {/* 06: Clans */}
          <Section06Clans />

          <SectionConnectorStroke variant="curve-right" />

          {/* 07: Faculty */}
          <Section07Faculty />

          <SectionConnectorStroke variant="s-curve" />

          {/* Final Call to Action */}
          <SectionFinalCTA />
        </main>
      </div>
    </SmoothScrollProvider>
  );
}