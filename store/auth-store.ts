// store/auth-store.ts

import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";
import { authService } from "@/lib/api/services/auth.service";
import { githubService } from "@/lib/api/services/github.service";
import type {
  UserResponse,
  LoginInput,
  RegisterInput,
} from "@/lib/validations/auth.schemas";

interface AuthState {
  // State
  user: UserResponse | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  hasHydrated: boolean;
  isGithubConnected: boolean;

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
  checkGithubConnection: () => Promise<void>;
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
        isGithubConnected: false,

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

            // After login, check GitHub connection status
            await get().checkGithubConnection();
          } catch (error: unknown) {
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

            // After registration+login, check GitHub status
            await get().checkGithubConnection();
          } catch (error: unknown) {
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
            console.error("Logout error:", error);
          } finally {
            set({ user: null, error: null, isGithubConnected: false });
          }
        },

        fetchUser: async () => {
          try {
            const user = await authService.getCurrentUser();
            set({ user });

            // Keep GitHub status in sync when we refresh user
            await get().checkGithubConnection();
          } catch (error: unknown) {
            console.error("Fetch user error:", error);
            set({ user: null, isGithubConnected: false });
          }
        },

        setInitialized: (value: boolean) => set({ isInitialized: value }),

        setHasHydrated: (value: boolean) => set({ hasHydrated: value }),

        clearError: () => set({ error: null }),

        checkGithubConnection: async () => {
          try {
            const status = await githubService.getStatus();
            // assuming getStatus() returns { github_username: string | null; connected: boolean; }
            set({ isGithubConnected: status.connected });
          } catch (error: unknown) {
            console.error("GitHub status check failed:", error);
            set({ isGithubConnected: false });
          }
        },
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
          state?.setHasHydrated(true);
        },
      }
    )
  )
);
