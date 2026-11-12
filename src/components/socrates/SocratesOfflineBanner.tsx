"use client";

import React from "react";
import { AlertTriangle, RefreshCw, Terminal } from "lucide-react";
import { socratesTheme } from "./socratesTheme";

export interface SocratesOfflineBannerProps {
  endpoint?: string;
  onRetry: () => void | Promise<void>;
  retrying?: boolean;
}

export const SocratesOfflineBanner: React.FC<SocratesOfflineBannerProps> = ({
  endpoint = "http://127.0.0.1:8080/v1",
  onRetry,
  retrying = false,
}) => {
  return (
    <div
      role="alert"
      className={`relative z-20 w-full flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0 ${socratesTheme.offlineBanner}`}
    >
      <div className="flex items-center gap-2.5">
        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
        <div>
          <span className="font-semibold text-rose-200">
            Colibri Inference Engine Offline
          </span>
          <span className="text-rose-300/80 ml-2 hidden sm:inline">
            Cannot reach local Qwen service at <code className="font-mono text-rose-200">{endpoint}</code>.
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/40 border border-white/10 font-mono text-[11px] text-zinc-400">
          <Terminal className="w-3 h-3 text-zinc-500" />
          <span>colibri run qwen3-coder-30b-a3b-colibri</span>
        </span>

        <button
          onClick={onRetry}
          disabled={retrying}
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-xs font-mono text-rose-200 transition-colors disabled:opacity-50 cursor-pointer active:scale-95"
        >
          <RefreshCw className={`w-3 h-3 ${retrying ? "animate-spin" : ""}`} />
          <span>{retrying ? "Reconnecting..." : "Retry Connection"}</span>
        </button>
      </div>
    </div>
  );
};
