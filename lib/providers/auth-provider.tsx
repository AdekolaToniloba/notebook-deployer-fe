"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuthStore } from "@/store/auth-store";
import { authService } from "@/lib/api/services/auth.service";
import { tokenManager } from "@/lib/auth/token-manager";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Refresh interval: 28 minutes (in milliseconds)
const REFRESH_INTERVAL = 28 * 60 * 1000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const setInitialized = useAuthStore((state) => state.setInitialized);
  const isLoading = useAuthStore((state) => state.isLoading);

  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const stopProactiveRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const startProactiveRefresh = useCallback(() => {
    stopProactiveRefresh();

    refreshTimerRef.current = setInterval(async () => {
      if (tokenManager.isAuthenticated()) {
        try {
          await authService.refreshToken();
          console.debug("Proactive token refresh successful");
        } catch (err) {
          console.warn("Proactive token refresh failed", err);
        }
      }
    }, REFRESH_INTERVAL);
  }, [stopProactiveRefresh]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);

    const initAuth = async () => {
      const hasToken = tokenManager.isAuthenticated();
      if (hasToken) {
        try {
          await fetchUser();
          startProactiveRefresh();
        } catch {
          tokenManager.clearTokens();
        }
      }
      setInitialized(true);
    };

    initAuth();

    return () => {
      stopProactiveRefresh();
    };
  }, [fetchUser, setInitialized, startProactiveRefresh, stopProactiveRefresh]);

  if (!isMounted) {
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
