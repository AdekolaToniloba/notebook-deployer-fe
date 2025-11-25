"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/store/auth-store";
import { authService } from "@/lib/api/services/auth.service";
import { tokenManager } from "@/lib/auth/token-manager";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  exp: number;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Removed isMounted state to fix the synchronous setState warning.
  // Instead, we rely on initialized state from the store or just render children.

  const fetchUser = useAuthStore((state) => state.fetchUser);
  const setInitialized = useAuthStore((state) => state.setInitialized);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const isLoading = useAuthStore((state) => state.isLoading);
  const logout = useAuthStore((state) => state.logout);

  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper: Calculate time until refresh
  const getRefreshTime = useCallback(() => {
    const accessToken = tokenManager.getAccessToken();
    if (!accessToken) return null;

    try {
      const decoded = jwtDecode<DecodedToken>(accessToken);
      if (!decoded.exp) return null;

      const currentTime = Date.now();
      const expiresInMs = decoded.exp * 1000 - currentTime;

      // Refresh 60 seconds BEFORE expiry (minimum 5s wait)
      return Math.max(expiresInMs - 60000, 5000);
    } catch (error) {
      console.error("Failed to decode token:", error);
      return null;
    }
  }, []);

  // Core Refresh Logic
  const performRefresh = useCallback(async () => {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) return;

    try {
      await authService.refreshToken();
      console.debug("Token refreshed successfully");
      // Dispatch a custom event so the debug timer knows to update
      window.dispatchEvent(new Event("auth-refresh"));
    } catch (err) {
      console.warn("Refresh failed", err);
      tokenManager.clearTokens();
      logout();
    }
  }, [logout]);

  // Ref pattern to avoid circular dependency in scheduler
  const performRefreshRef = useRef(performRefresh);
  useEffect(() => {
    performRefreshRef.current = performRefresh;
  }, [performRefresh]);

  // Scheduler
  const scheduleRefresh = useCallback(() => {
    const runSchedule = () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }

      const refreshInMs = getRefreshTime();
      if (refreshInMs === null) return;

      console.debug(
        `Scheduling refresh in ${(refreshInMs / 1000).toFixed(0)}s`
      );

      refreshTimeoutRef.current = setTimeout(async () => {
        await performRefreshRef.current();
        runSchedule();
      }, refreshInMs);
    };

    runSchedule();
  }, [getRefreshTime]);

  // Focus Handler
  useEffect(() => {
    const handleFocus = () => {
      const accessToken = tokenManager.getAccessToken();
      if (!accessToken) return;

      try {
        const decoded = jwtDecode<DecodedToken>(accessToken);
        const currentTime = Date.now();
        if (decoded.exp * 1000 < currentTime + 60000) {
          console.log("Tab focused and token is stale. Refreshing now...");
          performRefreshRef.current().then(() => scheduleRefresh());
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [scheduleRefresh]);

  // Initialization
  useEffect(() => {
    const initAuth = async () => {
      const hasToken = tokenManager.isAuthenticated();
      if (hasToken) {
        try {
          await fetchUser();
          scheduleRefresh();
        } catch {
          tokenManager.clearTokens();
        }
      }
      setInitialized(true);
    };

    initAuth();

    return () => {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    };
  }, [fetchUser, setInitialized, scheduleRefresh]);

  // Show loading spinner only while initializing auth check
  if (!isInitialized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      {children}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm">
          <LoadingSpinner size="lg" />
        </div>
      )}
    </>
  );
}
