"use client";

import { useState, useEffect } from "react";
import { tokenManager } from "@/lib/auth/token-manager";
import { jwtDecode } from "jwt-decode";

export function AuthDebugTimer() {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [tokenExp, setTokenExp] = useState<number | null>(null);

  const calculateTime = () => {
    const token = tokenManager.getAccessToken();
    if (!token) {
      setTimeLeft(null);
      setTokenExp(null);
      return;
    }
    try {
      const decoded = jwtDecode<{ exp: number }>(token);
      const now = Date.now() / 1000;
      setTimeLeft(decoded.exp - now);
      setTokenExp(decoded.exp);
    } catch {
      setTimeLeft(null);
      setTokenExp(null);
    }
  };

  useEffect(() => {
    // FIX: Defer initial calculation to avoid synchronous setState in effect
    const initialTimeout = setTimeout(calculateTime, 0);

    // Update every second
    const interval = setInterval(calculateTime, 1000);

    // Listen for refresh events from AuthProvider
    const onRefresh = () => calculateTime();
    window.addEventListener("auth-refresh", onRefresh);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
      window.removeEventListener("auth-refresh", onRefresh);
    };
  }, []);

  if (timeLeft === null) return null;

  const isCritical = timeLeft < 60; // Less than 1 minute
  const expiryDate = tokenExp
    ? new Date(tokenExp * 1000).toLocaleTimeString()
    : "N/A";

  return (
    <div
      className={`fixed bottom-4 left-4 z-[9999] font-mono text-xs font-bold px-3 py-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
        isCritical
          ? "bg-red-500 text-white animate-pulse"
          : "bg-[#B6DFFF] text-black"
      }`}
    >
      <div className="flex items-center gap-2">
        <div
          className={`h-2 w-2 rounded-full ${
            isCritical ? "bg-white" : "bg-green-500"
          } animate-pulse`}
        />
        <span>TOKEN EXPIRY: {timeLeft.toFixed(0)}s</span>
      </div>
      <div className="text-[10px] opacity-70 mt-1">
        Expires at: {expiryDate}
      </div>
      <div className="text-[10px] opacity-70">Refresh @ T-60s</div>
    </div>
  );
}
