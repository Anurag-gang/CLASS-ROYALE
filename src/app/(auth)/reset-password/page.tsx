"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { RetroButton } from "@/components/retro/RetroButton";
import { ShieldAlert, CheckCircle2, AlertCircle } from "lucide-react";
import { retroSound } from "@/lib/sound";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [token, setToken] = useState("RETRO-RESET-8BIT-TOKEN-KEY");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const qEmail = searchParams?.get("email");
    if (qEmail) setEmail(qEmail);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        retroSound.playWrong();
        setError(data.error || "Reset failed");
        setLoading(false);
        return;
      }

      retroSound.playLevelUp();
      setStatus(data.message || "Password changed!");
      setLoading(false);
      setTimeout(() => router.push("/login"), 1500);
    } catch {
      setError("Network error. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md pixel-box-pink p-6 sm:p-8 bg-[#0c0217] space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-[#1f0b35] border-2 border-[#f755bc] mx-auto flex items-center justify-center shadow-[3px_3px_0px_0px_#000000]">
          <ShieldAlert className="w-6 h-6 text-[#f755bc]" />
        </div>
        <h1 className="font-pixel text-xl text-white tracking-wider">RESET PASSWORD</h1>
        <p className="font-retro text-lg text-[#a79bb7]">RE-KEY SECURITY PROTOCOL</p>
      </div>

      {error && (
        <div className="p-3 bg-red-950/80 border-2 border-red-500 text-red-200 font-pixel text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {status && (
        <div className="p-3 bg-emerald-950/80 border-2 border-emerald-500 text-emerald-200 font-pixel text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{status} (REDIRECTING...)</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div className="space-y-1.5">
          <label className="font-pixel text-xs text-[#a79bb7] block">EMAIL</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="player@arcade.io"
            className="w-full p-3 bg-[#05010a] border-2 border-[#3b1c5a] text-white font-mono text-sm focus:border-[#f755bc] focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="font-pixel text-xs text-[#a79bb7] block">CIPHER KEY</label>
          <input
            type="text"
            required
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full p-3 bg-[#05010a] border-2 border-[#3b1c5a] text-amber-300 font-mono text-sm focus:border-[#f755bc] focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="font-pixel text-xs text-[#a79bb7] block">NEW PASSWORD</label>
          <input
            type="password"
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full p-3 bg-[#05010a] border-2 border-[#3b1c5a] text-white font-mono text-sm focus:border-[#f755bc] focus:outline-none"
          />
        </div>

        <RetroButton type="submit" variant="pink" size="md" disabled={loading} className="w-full">
          {loading ? "AUTHENTICATING..." : "COMMIT NEW CIPHER"}
        </RetroButton>
      </form>

      <div className="text-center font-pixel text-[10px] text-[#a79bb7]">
        <Link href="/login" className="text-[#f755bc] underline hover:text-white">
          RETURN TO LOGIN
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="font-pixel text-xs text-[#f755bc]">LOADING CIPHER VERIFIER...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}