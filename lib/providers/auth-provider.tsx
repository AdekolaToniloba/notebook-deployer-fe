"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { tokenManager } from "@/lib/auth/token-manager";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const setInitialized = useAuthStore((state) => state.setInitialized);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setIsMounted(true);

    const initAuth = async () => {
      const hasToken = tokenManager.isAuthenticated();
      if (hasToken) {
        try {
          await fetchUser();
        } catch (error) {
          tokenManager.clearTokens();
        }
      }
      setInitialized(true);
    };

    initAuth();
  }, [fetchUser, setInitialized]);

  // FIX: Do not return null. Return children immediately if we are on server
  // or if we are just waiting for mount.
  // The hydration warning is suppressed in layout.tsx anyway.
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
      {/* Global Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm">
          <LoadingSpinner size="lg" />
        </div>
      )}
    </>
  );
}
