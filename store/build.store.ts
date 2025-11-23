// store/build.store.ts

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { buildService } from "@/lib/api/services/builds.service";
import type {
  Build,
  BuildListItem,
  BuildTriggerResult,
} from "@/types/models/build.types";

/**
 * Build Store
 *
 * Manages state for Cloud Build operations.
 *
 * Why Zustand?
 * 1. Simple API - less boilerplate than Redux
 * 2. No Context needed - direct imports
 * 3. Good TypeScript support
 * 4. DevTools integration
 * 5. Fast - minimal re-renders
 *
 * State organization:
 * - builds: Array of builds for lists
 * - selectedBuild: Currently selected build (detail view)
 * - loading: Global loading state
 * - error: Error messages
 * - Polling: Track which builds are being polled
 *
 * Actions pattern:
 * - Each action is async and handles its own errors
 * - Loading state is managed automatically
 * - Errors are stored for UI to display
 * - Polling runs in background
 */

interface BuildState {
  // Data
  builds: BuildListItem[];
  selectedBuild: Build | null;

  // UI State
  loading: boolean;
  error: string | null;

  // Polling State
  pollingIntervals: Map<number, NodeJS.Timeout>; // buildId -> interval
  pollingBuilds: Set<number>; // Set of build IDs being polled

  // Actions - Build Operations
  triggerBuild: (notebookId: number) => Promise<BuildTriggerResult | null>;
  fetchBuild: (buildId: number) => Promise<void>;
  fetchBuilds: () => Promise<void>;
  fetchNotebookBuilds: (notebookId: number) => Promise<void>;
  refreshBuildStatus: (buildId: number) => Promise<void>;
  getBuildLogs: (buildId: number) => Promise<string | null>;

  // Actions - Polling
  startPolling: (buildId: number, interval?: number) => void;
  stopPolling: (buildId: number) => void;
  stopAllPolling: () => void;

  // Utility Actions
  clearError: () => void;
  setSelectedBuild: (build: Build | null) => void;
  reset: () => void;
}

/**
 * Initial state
 */
const initialState = {
  builds: [],
  selectedBuild: null,
  loading: false,
  error: null,
  pollingIntervals: new Map<number, NodeJS.Timeout>(),
  pollingBuilds: new Set<number>(),
};

/**
 * Create the store
 */
export const useBuildStore = create<BuildState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      /**
       * Trigger a new build for a notebook
       *
       * Flow:
       * 1. Set loading state
       * 2. Call service to trigger build
       * 3. Add to builds list
       * 4. Optionally start polling
       * 5. Return build info
       *
       * @param notebookId - ID of notebook to build
       * @returns Build info or null on error
       */
      triggerBuild: async (notebookId: number) => {
        set({ loading: true, error: null });

        try {
          const build = await buildService.triggerBuild(notebookId);

          // Add to builds list (transform to list item)
          const listItem: BuildListItem = {
            id: build.id,
            notebookId: build.notebookId,
            buildId: build.buildId,
            status: build.status,
            imageName: build.imageName,
            createdAt: build.createdAt,
          };

          set((state) => ({
            builds: [listItem, ...state.builds],
            loading: false,
          }));

          // Auto-start polling for this build
          get().startPolling(build.id);

          return build;
        } catch (error) {
          const message = buildService.getUserFriendlyError(error, "trigger");
          set({
            error: message,
            loading: false,
          });
          return null;
        }
      },

      /**
       * Fetch single build details
       *
       * Used for:
       * - Detail view
       * - Refreshing specific build
       * - Polling updates
       *
       * @param buildId - ID of build to fetch
       */
      fetchBuild: async (buildId: number) => {
        set({ loading: true, error: null });

        try {
          const build = await buildService.getBuild(buildId);

          // Update selected build
          set({
            selectedBuild: build,
            loading: false,
          });

          // Also update in builds list if present
          set((state) => ({
            builds: state.builds.map((b) =>
              b.id === buildId
                ? {
                    id: build.id,
                    notebookId: build.notebookId,
                    buildId: build.buildId,
                    status: build.status,
                    imageName: build.imageName,
                    createdAt: build.createdAt,
                  }
                : b
            ),
          }));

          // Stop polling if build is complete
          if (build.status === "success" || build.status === "failed") {
            get().stopPolling(buildId);
          }
        } catch (error) {
          const message = buildService.getUserFriendlyError(error, "fetch");
          set({
            error: message,
            loading: false,
          });
        }
      },

      /**
       * Fetch all builds for current user
       *
       * Used for:
       * - Build list view
       * - Dashboard overview
       */
      fetchBuilds: async () => {
        set({ loading: true, error: null });

        try {
          const builds = await buildService.listBuilds();

          set({
            builds,
            loading: false,
          });
        } catch (error) {
          const message = buildService.getUserFriendlyError(error, "list");
          set({
            error: message,
            loading: false,
          });
        }
      },

      /**
       * Fetch builds for specific notebook
       *
       * Used for:
       * - Notebook detail view
       * - Finding builds to deploy
       *
       * @param notebookId - ID of notebook
       */
      fetchNotebookBuilds: async (notebookId: number) => {
        set({ loading: true, error: null });

        try {
          const builds = await buildService.listNotebookBuilds(notebookId);

          set({
            builds,
            loading: false,
          });
        } catch (error) {
          const message = buildService.getUserFriendlyError(error, "list");
          set({
            error: message,
            loading: false,
          });
        }
      },

      /**
       * Manually refresh build status from Cloud Build
       *
       * Used for:
       * - User clicks "refresh" button
       * - Build seems stuck
       *
       * @param buildId - ID of build to refresh
       */
      refreshBuildStatus: async (buildId: number) => {
        set({ loading: true, error: null });

        try {
          const build = await buildService.refreshBuildStatus(buildId);

          // Update selected build if it matches
          if (get().selectedBuild?.id === buildId) {
            set({ selectedBuild: build });
          }

          // Update in builds list
          set((state) => ({
            builds: state.builds.map((b) =>
              b.id === buildId
                ? {
                    id: build.id,
                    notebookId: build.notebookId,
                    buildId: build.buildId,
                    status: build.status,
                    imageName: build.imageName,
                    createdAt: build.createdAt,
                  }
                : b
            ),
            loading: false,
          }));

          // Stop polling if complete
          if (build.status === "success" || build.status === "failed") {
            get().stopPolling(buildId);
          }
        } catch (error) {
          const message = buildService.getUserFriendlyError(error, "refresh");
          set({
            error: message,
            loading: false,
          });
        }
      },

      /**
       * Get build logs
       *
       * Used for:
       * - Debugging failed builds
       * - Viewing build progress
       *
       * @param buildId - ID of build
       * @returns Log text or null on error
       */
      getBuildLogs: async (buildId: number) => {
        set({ loading: true, error: null });

        try {
          const logs = await buildService.getBuildLogs(buildId);

          set({ loading: false });
          return logs;
        } catch (error) {
          const message = buildService.getUserFriendlyError(error, "logs");
          set({
            error: message,
            loading: false,
          });
          return null;
        }
      },

      /**
       * Start polling for build status updates
       *
       * Why polling?
       * - Builds take 2-5 minutes
       * - Need real-time updates
       * - Simpler than websockets
       *
       * Pattern:
       * - Poll every 10 seconds (default)
       * - Stop when build completes (success/failed)
       * - Prevent duplicate polling for same build
       *
       * @param buildId - ID of build to poll
       * @param interval - Polling interval in ms (default: 10000)
       */
      startPolling: (buildId: number, interval = 10000) => {
        const { pollingIntervals, pollingBuilds } = get();

        // Don't start if already polling
        if (pollingBuilds.has(buildId)) {
          return;
        }

        // Add to polling set
        set((state) => ({
          pollingBuilds: new Set([...state.pollingBuilds, buildId]),
        }));

        // Create polling interval
        const intervalId = setInterval(async () => {
          try {
            const build = await buildService.getBuild(buildId);

            // Update in store
            set((state) => ({
              builds: state.builds.map((b) =>
                b.id === buildId
                  ? {
                      id: build.id,
                      notebookId: build.notebookId,
                      buildId: build.buildId,
                      status: build.status,
                      imageName: build.imageName,
                      createdAt: build.createdAt,
                    }
                  : b
              ),
            }));

            // Update selected build if it matches
            if (get().selectedBuild?.id === buildId) {
              set({ selectedBuild: build });
            }

            // Stop polling if build is complete
            if (build.status === "success" || build.status === "failed") {
              get().stopPolling(buildId);
            }
          } catch (error) {
            // Log error but don't stop polling
            // User might have network issues that resolve
            console.error("Polling error:", error);
          }
        }, interval);

        // Store interval ID
        set((state) => {
          const newIntervals = new Map(state.pollingIntervals);
          newIntervals.set(buildId, intervalId);
          return { pollingIntervals: newIntervals };
        });
      },

      /**
       * Stop polling for a specific build
       *
       * @param buildId - ID of build to stop polling
       */
      stopPolling: (buildId: number) => {
        const { pollingIntervals, pollingBuilds } = get();

        // Clear interval if exists
        const intervalId = pollingIntervals.get(buildId);
        if (intervalId) {
          clearInterval(intervalId);
        }

        // Remove from maps/sets
        set((state) => {
          const newIntervals = new Map(state.pollingIntervals);
          newIntervals.delete(buildId);

          const newPollingBuilds = new Set(state.pollingBuilds);
          newPollingBuilds.delete(buildId);

          return {
            pollingIntervals: newIntervals,
            pollingBuilds: newPollingBuilds,
          };
        });
      },

      /**
       * Stop all polling
       *
       * Used when:
       * - User logs out
       * - Component unmounts
       * - Navigating away from builds
       */
      stopAllPolling: () => {
        const { pollingIntervals } = get();

        // Clear all intervals
        pollingIntervals.forEach((intervalId) => {
          clearInterval(intervalId);
        });

        // Reset polling state
        set({
          pollingIntervals: new Map(),
          pollingBuilds: new Set(),
        });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Set selected build manually
       *
       * Useful for:
       * - Navigation
       * - Selecting from list
       *
       * @param build - Build to select or null
       */
      setSelectedBuild: (build: Build | null) => {
        set({ selectedBuild: build });
      },

      /**
       * Reset store to initial state
       *
       * Called on:
       * - Logout
       * - Store cleanup
       */
      reset: () => {
        // Stop all polling first
        get().stopAllPolling();

        // Reset to initial state
        set(initialState);
      },
    }),
    { name: "BuildStore" }
  )
);

/**
 * Selectors
 *
 * Why selectors?
 * - Prevent unnecessary re-renders
 * - Compute derived state
 * - Reusable logic
 *
 * Usage:
 * const builds = useBuildStore(selectBuilds);
 */

export const selectBuilds = (state: BuildState) => state.builds;
export const selectSelectedBuild = (state: BuildState) => state.selectedBuild;
export const selectLoading = (state: BuildState) => state.loading;
export const selectError = (state: BuildState) => state.error;
export const selectIsPolling = (state: BuildState, buildId: number) =>
  state.pollingBuilds.has(buildId);

/**
 * Usage Examples:
 *
 * // Trigger a build and start polling
 * const { triggerBuild } = useBuildStore();
 * const build = await triggerBuild(notebookId);
 * // Polling starts automatically
 *
 * // Fetch builds
 * const { fetchBuilds, builds } = useBuildStore();
 * await fetchBuilds();
 *
 * // Manual polling control
 * const { startPolling, stopPolling } = useBuildStore();
 * startPolling(buildId);
 * // ... later
 * stopPolling(buildId);
 *
 * // Get logs
 * const { getBuildLogs } = useBuildStore();
 * const logs = await getBuildLogs(buildId);
 *
 * // Use selectors to prevent re-renders
 * const builds = useBuildStore(selectBuilds);
 * const loading = useBuildStore(selectLoading);
 */
