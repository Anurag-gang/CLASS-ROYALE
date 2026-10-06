"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Sparkles, ArrowRight, UserPlus } from "lucide-react";
import { retroSound } from "@/lib/sound";

export default function SignupPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      retroSound.playWrong();
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      retroSound.playWrong();
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        retroSound.playWrong();
        setError(data.error || "Failed to register account");
        setLoading(false);
        return;
      }

      retroSound.playLevelUp();
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network connection failed. Please retry.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8 bg-[#050505]">
      <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-[#080a12]/90 border border-white/[0.08] backdrop-blur-2xl shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-condensed font-black text-2xl tracking-wider text-white uppercase"
          >
            <span>CLASS ROYALE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          </Link>
          <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold">
            Create Engineering Scholar Account
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-zinc-400 block uppercase tracking-wider">
              Scholar Username
            </label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={20}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. alex_chen"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:border-cyan-400/50 focus:outline-none placeholder:text-zinc-600 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-zinc-400 block uppercase tracking-wider">
              University Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="scholar@university.edu"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:border-cyan-400/50 focus:outline-none placeholder:text-zinc-600 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-zinc-400 block uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:border-cyan-400/50 focus:outline-none placeholder:text-zinc-600 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-zinc-400 block uppercase tracking-wider">
              Confirm Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:border-cyan-400/50 focus:outline-none placeholder:text-zinc-600 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-slate-950 font-bold font-mono text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] mt-2"
          >
            {loading ? "Creating Scholar Account..." : "Create Account & Start Learning"}
          </button>
        </form>

        <div className="pt-3 border-t border-white/[0.06] text-center text-xs font-mono text-zinc-500">
          <span>Already registered? </span>
          <Link href="/login" className="text-cyan-400 hover:underline font-semibold">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}