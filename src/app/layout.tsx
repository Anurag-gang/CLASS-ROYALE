import type { Metadata } from "next";
import "./globals.css";
import { UnifiedNavbar } from "@/components/navigation/UnifiedNavbar";
import { UnifiedFooter } from "@/components/navigation/UnifiedFooter";
import { CRLauncher } from "@/components/cr/CRLauncher";

export const metadata: Metadata = {
  title: "Class Royale — Engineering Learning & Adaptive Quiz Platform",
  description:
    "A modern engineering learning platform helping university students master their subjects through structured quizzes, adaptive machine learning, topic mastery, and collaborative clans.",
  openGraph: {
    title: "Class Royale — Engineering Learning & Adaptive Quiz Platform",
    description:
      "Structured engineering diagnostics, real-time Bayesian mastery, weak-topic recommendations, and collaborative clan challenges.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="bg-[#050505] text-[#f4f0fa] antialiased min-h-screen relative flex flex-col selection:bg-cyan-400 selection:text-slate-950 font-body">
        {/* Unified Top Navigation */}
        <UnifiedNavbar />

        {/* Page Content Container */}
        <div className="relative z-10 flex-1 flex flex-col">
          {children}
        </div>

        {/* Floating Global CR AI Companion Launcher */}
        <CRLauncher />

        {/* Unified Global Footer */}
        <UnifiedFooter />
      </body>
    </html>
  );
}