"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LearnPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/subjects");
  }, [router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <span className="w-6 h-6 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      <p className="font-hud text-xs text-zinc-400">
        Redirecting to <Link href="/subjects" className="text-cyan-400 underline">Subjects Map</Link>...
      </p>
    </div>
  );
}