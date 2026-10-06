"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Monitor } from "lucide-react";

export const CRTOverlay: React.FC = () => {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(true);

  if (pathname === "/") {
    return null;
  }

  useEffect(() => {
    const saved = localStorage.getItem("class_royale_crt");
    if (saved !== null) {
      setEnabled(saved === "true");
    }
  }, []);

  const toggleCrt = () => {
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem("class_royale_crt", next ? "true" : "false");
  };

  return (
    <>
      {enabled && (
        <>
          <div className="crt-scanlines" aria-hidden="true" />
          <div className="crt-vignette" aria-hidden="true" />
        </>
      )}
      <button
        onClick={toggleCrt}
        title={enabled ? "Disable CRT Scanlines" : "Enable CRT Scanlines"}
        aria-label="Toggle CRT Scanline Effect"
        className="fixed bottom-4 left-4 z-50 p-2 bg-[#0d0617]/90 border-2 border-[#3b1c5a] text-[#a79bb7] hover:text-[#f755bc] hover:border-[#f755bc] transition-colors shadow-[2px_2px_0px_0px_#000000]"
      >
        <Monitor className="w-4 h-4" />
      </button>
    </>
  );
};