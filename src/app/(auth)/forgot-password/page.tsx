"use client";

import React, { useState } from "react";
import Link from "next/link";
import { RetroButton } from "@/components/retro/RetroButton";
import { KeyRound, CheckCircle2, AlertCircle } from "lucide-react";
import { retroSound } from "@/lib/sound";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        retroSound.playCoin();
        setSubmitted(true);
      } else {
        retroSound.playWrong();
        setError("Transmission failed. Please verify email.");
      }
    } catch {
      setError("Network error. Try again.");
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md pixel-box-pink p-6 sm:p-8 bg-[#0c0217] space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-[#1f0b35] border-2 border-[#f755bc] mx-auto flex items-center justify-center shadow-[3px_3px_0px_0px_#000000]">
            <KeyRound className="w-6 h-6 text-[#f755bc]" />
          </div>
          <h1 className="font-pixel text-xl text-white tracking-wider">
            RECOVER ACCESS
          </h1>
          <p className="font-retro text-lg text-[#a79bb7]">
            DISPATCH CIPHER CODE TO REESTABLISH PLAYER ACCOUNT
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/80 border-2 border-red-500 text-red-200 font-pixel text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          <div className="p-4 bg-[#032412] border-2 border-[#10b981] text-left space-y-3">
            <div className="flex items-center gap-2 text-[#4ade80] font-pixel text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>TRANSMISSION DISPATCHED</span>
            </div>
            <p className="font-retro text-base text-emerald-200">
              If a player character exists for {email}, a recovery cipher has been transmitted.
            </p>
            <div className="pt-2">
              <Link href={`/reset-password?email=${encodeURIComponent(email)}`}>
                <RetroButton variant="pink" size="sm" className="w-full">
                  ENTER RECOVERY CIPHER
                </RetroButton>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="font-pixel text-xs text-[#a79bb7] block">REGISTERED EMAIL</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="player@arcade.io"
                className="w-full p-3 bg-[#05010a] border-2 border-[#3b1c5a] text-white font-mono text-sm focus:border-[#f755bc] focus:outline-none"
              />
            </div>

            <RetroButton type="submit" variant="pink" size="md" className="w-full">
              SEND RECOVERY CIPHER
            </RetroButton>
          </form>
        )}

        <div className="text-center font-pixel text-[10px] text-[#a79bb7]">
          <Link href="/login" className="text-[#f755bc] underline hover:text-white">
            RETURN TO LOGIN
          </Link>
        </div>
      </div>
    </div>
  );
}