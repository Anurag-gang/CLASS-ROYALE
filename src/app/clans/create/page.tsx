"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, Shield, Sparkles, CheckCircle2 } from "lucide-react";
import { retroSound } from "@/lib/sound";

export default function CreateClanPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("STUDY_GROUP");
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please provide a clan name");
      return;
    }

    setSubmitting(true);
    setError(null);
    retroSound.playClick();

    try {
      const res = await fetch("/api/clans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          category,
          isPrivate,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        retroSound.playLevelUp();
        router.push(`/clans/${data.clan.id}`);
      } else {
        retroSound.playWrong();
        setError(data.error || "Failed to create clan");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      {/* Back Link */}
      <div>
        <Link
          href="/clans"
          onClick={() => retroSound.playClick()}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Clans</span>
        </Link>
      </div>

      {/* Header */}
      <div className="space-y-2">
        <span className="font-hud text-xs text-cyan-400 uppercase tracking-widest font-semibold">
          NEW PEER COHORT
        </span>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
          Create an Academic Clan
        </h1>
        <p className="font-body text-xs sm:text-sm text-zinc-400">
          Form a study group for exam preparation, placement prep, or university course collaboration. As the
          creator, you become Clan Leader and can publish quizzes and activities.
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl p-6 sm:p-8 bg-[#070c20]/80 border border-violet-500/20 backdrop-blur-xl space-y-6"
      >
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs font-mono text-rose-200">
            {error}
          </div>
        )}

        {/* Clan Name */}
        <div className="space-y-2">
          <label className="block text-xs font-mono text-zinc-300 uppercase tracking-wider font-semibold">
            Clan Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. DSA Placement Prep or OS Batch 2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400/50"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="block text-xs font-mono text-zinc-300 uppercase tracking-wider font-semibold">
            Description
          </label>
          <textarea
            rows={3}
            placeholder="Describe your clan's academic focus, target exams, or meeting rhythm..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400/50 resize-none"
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <label className="block text-xs font-mono text-zinc-300 uppercase tracking-wider font-semibold">
            Clan Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[#090e24] border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400/50"
          >
            <option value="STUDY_GROUP">Study Group (Peer-led revision &amp; practice)</option>
            <option value="CLASSROOM">University Classroom (Course cohort)</option>
            <option value="COMPETITIVE">Competitive League (High-stakes exam prep)</option>
          </select>
        </div>

        {/* Visibility */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
          <div>
            <h4 className="font-display font-medium text-sm text-white">Private Clan</h4>
            <p className="font-body text-xs text-zinc-400">
              Only students with your unique Join Code will be able to join.
            </p>
          </div>

          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="w-5 h-5 accent-violet-600 rounded cursor-pointer"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-display text-xs font-semibold shadow-md transition-all disabled:opacity-50"
        >
          {submitting ? "CREATING CLAN..." : "CREATE CLAN & GENERATE JOIN CODE"}
        </button>
      </form>
    </div>
  );
}
