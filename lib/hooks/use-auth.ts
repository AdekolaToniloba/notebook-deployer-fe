// lib/hooks/use-auth.ts
"use client";

import { useAuthStore } from "@/store/auth-store";

export function useAuth() {
  // Get all the pieces from the store
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  // ❌ DON'T read isAuthenticated from store
  // const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // ✅ Calculate it directly from user
  const isAuthenticated = !!user;

  // Get the actions
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const logout = useAuthStore((state) => state.logout);
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const setInitialized = useAuthStore((state) => state.setInitialized);
  const setHasHydrated = useAuthStore((state) => state.setHasHydrated);
  const clearError = useAuthStore((state) => state.clearError);

  return {
    // State
    user,
    isLoading,
    error,
    isAuthenticated, // ✅ Calculated, not from store
    isInitialized: useAuthStore((state) => state.isInitialized),
    hasHydrated: useAuthStore((state) => state.hasHydrated),

    // Actions
    login,
    register,
    logout,
    fetchUser,
    setInitialized,
    setHasHydrated,
    clearError,
  };
}
