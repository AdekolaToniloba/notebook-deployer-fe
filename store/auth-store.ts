// store/auth-store.ts

import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";
import { authService } from "@/lib/api/services/auth.service";
import type {
  UserResponse,
  LoginInput,
  RegisterInput,
} from "@/lib/validations/auth.schemas";

/**
 * Auth Store
 * Why Zustand: Simple, performant, TypeScript-friendly
 * Security: Only non-sensitive data is persisted
 *
 * IMPORTANT: This store uses persist middleware.
 * The hydration happens asynchronously, so components need to wait
 * for `hasHydrated` to be true before trusting the auth state.
 */

interface AuthState {
  // State
  user: UserResponse | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  hasHydrated: boolean;

  // Computed
  isAuthenticated: boolean;

  // Actions
  login: (credentials: LoginInput) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  setInitialized: (value: boolean) => void;
  setHasHydrated: (value: boolean) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        isLoading: false,
        error: null,
        isInitialized: false,
        hasHydrated: false,

        // Computed
        get isAuthenticated() {
          return !!get().user;
        },

        // Actions
        login: async (credentials) => {
          try {
            set({ isLoading: true, error: null });

            // Login and get tokens
            await authService.login(credentials);

            // Fetch user data
            const user = await authService.getCurrentUser();
            set({ user, isLoading: false });
          } catch (error: unknown) {
            // Type-safe error handling
            const errorMessage =
              error instanceof Error ? error.message : "Login failed";
            set({
              error: errorMessage,
              isLoading: false,
            });
            throw error;
          }
        },

        register: async (data) => {
          try {
            set({ isLoading: true, error: null });

            // Register user
            const user = await authService.register(data);

            // Auto-login after registration
            await authService.login({
              username: data.username,
              password: data.password,
            });

            set({ user, isLoading: false });
          } catch (error: unknown) {
            // Type-safe error handling
            const errorMessage =
              error instanceof Error ? error.message : "Registration failed";
            set({
              error: errorMessage,
              isLoading: false,
            });
            throw error;
          }
        },

        logout: async () => {
          try {
            await authService.logout();
          } catch (error: unknown) {
            // Log error but don't throw - we want to logout anyway
            console.error("Logout error:", error);
          } finally {
            set({ user: null, error: null });
          }
        },

        fetchUser: async () => {
          try {
            const user = await authService.getCurrentUser();
            set({ user });
          } catch (error: unknown) {
            // If fetch fails, user is not authenticated
            // Log for debugging but don't set error state
            console.error("Fetch user error:", error);
            set({ user: null });
          }
        },

        setInitialized: (value: boolean) => set({ isInitialized: value }),

        setHasHydrated: (value: boolean) => set({ hasHydrated: value }),

        clearError: () => set({ error: null }),
      }),
      {
        name: "auth-storage",
        storage: createJSONStorage(() => localStorage),
        // Only persist non-sensitive data
        partialize: (state) => ({
          user: state.user,
        }),
        // Handle hydration
        onRehydrateStorage: () => (state) => {
          // Mark as hydrated after rehydration completes
          state?.setHasHydrated(true);
        },
      }
    )
  )
);
