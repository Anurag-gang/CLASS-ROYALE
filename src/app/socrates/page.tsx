import type { Metadata } from "next";
import { Suspense } from "react";
import { SocratesWorkspace } from "@/components/socrates/SocratesWorkspace";
import { SocratesLoadingFallback } from "@/components/socrates/SocratesLoadingFallback";

export const metadata: Metadata = {
  title: "Socrates AI — Socratic Dialectic Workspace | Class Royale",
  description:
    "Immersive full-screen blue-black glassmorphism AI workspace powered by Qwen 30B via local Colibri inference.",
};

export default function SocratesPage() {
  return (
    <Suspense fallback={<SocratesLoadingFallback />}>
      <SocratesWorkspace />
    </Suspense>
  );
}