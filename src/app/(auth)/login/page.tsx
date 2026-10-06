"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { School, Lock, User, AlertCircle, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { retroSound } from "@/lib/sound";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams?.get("redirect");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [unprovisioned, setUnprovisioned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setUnprovisioned(false);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        retroSound.playWrong();
        if (data.error === "ACCOUNT_NOT_PROVISIONED") {
          setUnprovisioned(true);
        } else {
          setError(data.error || "Login failed");
        }
        setLoading(false);
        return;
      }

      retroSound.playLevelUp();
      const destination = redirectParam || data.redirectUrl || "/dashboard";
      router.push(destination);
      router.refresh();
    } catch {
      setError("Network connection failed. Please retry.");
      setLoading(false);
    }
  };

  const handleSSOLogin = async (persona: "faculty" | "student" | "admin") => {
    setSsoLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/sso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona, redirectUrl: redirectParam }),
      });
      const data = await res.json();
      if (res.ok) {
        retroSound.playLevelUp();
        router.push(data.redirectUrl || "/dashboard");
        router.refresh();
      } else {
        setError(data.error || "SSO identity exchange failed");
      }
    } catch {
      setError("SSO gateway unreachable");
    } finally {
      setSsoLoading(false);
    }
  };

  const handleQuickDemo = (user: string, pass: string) => {
    retroSound.playClick();
    setIdentifier(user);
    setPassword(pass);
  };

  return (
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
          University Authentication Gateway
        </p>
      </div>

      {unprovisioned && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-amber-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>ACCOUNT NOT YET PROVISIONED</span>
          </div>
          <p className="leading-relaxed">
            Your university credentials are valid, but no student/faculty record was linked. Please contact your academic administrator.
          </p>
        </div>
      )}

      {error && !unprovisioned && (
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex items-center gap-2 font-mono">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* University SSO 1-Click Fast Gateway */}
      <div className="space-y-2.5">
        <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block font-semibold">
          1-Click University SSO Identity:
        </span>
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <button
            type="button"
            disabled={ssoLoading}
            onClick={() => handleSSOLogin("student")}
            className="p-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-400 text-left transition-all group"
          >
            <div className="font-bold text-cyan-300 group-hover:text-cyan-200">
              Scholar Persona
            </div>
            <div className="text-[10px] text-zinc-400">Anurag (CS 5A)</div>
          </button>

          <button
            type="button"
            disabled={ssoLoading}
            onClick={() => handleSSOLogin("faculty")}
            className="p-3 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 hover:border-violet-400 text-left transition-all group"
          >
            <div className="font-bold text-violet-300 group-hover:text-violet-200">
              Faculty Persona
            </div>
            <div className="text-[10px] text-zinc-400">Dr. R. Sharma</div>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 py-1">
        <div className="flex-1 h-px bg-white/[0.08]" />
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
          Or Enter Credentials
        </span>
        <div className="flex-1 h-px bg-white/[0.08]" />
      </div>

      {/* Manual Academic Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-mono text-zinc-400 block uppercase tracking-wider">
            University ID, Username or Email
          </label>
          <input
            type="text"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="500120101 or dr.sharma"
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:border-cyan-400/50 focus:outline-none placeholder:text-zinc-600 transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              Password
            </label>
            <Link
              href="/reset-password"
              className="text-[10px] font-mono text-cyan-400 hover:underline"
            >
              Forgot?
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:border-cyan-400/50 focus:outline-none placeholder:text-zinc-600 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-slate-950 font-bold font-mono text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] mt-2"
        >
          {loading ? "Verifying Credentials..." : "Authenticate & Sign In"}
        </button>
      </form>

      {/* Demo helper */}
      <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-zinc-500">
        <span>No credentials? Use 1-Click SSO above</span>
        <Link href="/signup" className="text-cyan-400 hover:underline font-semibold">
          Register
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8 bg-[#050505]">
      <Suspense
        fallback={
          <div className="font-mono text-xs text-cyan-400 animate-pulse">
            Connecting to University Gateway...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}