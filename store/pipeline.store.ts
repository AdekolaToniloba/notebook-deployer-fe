// store/pipeline.store.ts

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { pipelineService } from "@/lib/api/services/pipeline.service";
import type {
  Pipeline,
  PipelineHistoryItem,
  PipelineProgress,
} from "@/types/models/pipeline.types";
import { calculatePipelineProgress } from "@/types/models/pipeline.types";
import type { DeploymentConfig } from "@/types/models/deployment.types";

/**
 * Pipeline Store
 *
 * Manages state for one-click deploy workflow.
 *
 * Why Zustand?
 * 1. Simple API - less boilerplate than Redux
 * 2. No Context needed - direct imports
 * 3. Good TypeScript support
 * 4. DevTools integration
 * 5. Fast - minimal re-renders
 *
 * State organization:
 * - currentPipeline: Active pipeline execution (if any)
 * - history: Past pipeline executions
 * - loading: Global loading state
 * - error: Error messages
 * - isDeploying: Specific state for starting pipeline
 * - Polling: Track active pipeline polling
 *
 * Pipeline Flow:
 * 1. User uploads file + config
 * 2. Backend: parse → dependencies → upload → build → deploy
 * 3. Poll for status updates
 * 4. Complete when status is 'deployed' or 'failed'
 */

interface PipelineState {
  // Data
  currentPipeline: Pipeline | null; // Active pipeline
  history: PipelineHistoryItem[]; // Past pipelines
  historyTotal: number; // Total count for pagination

  // UI State
  loading: boolean;
  error: string | null;
  isDeploying: boolean; // Starting pipeline

  // Polling State
  pollingIntervalId: NodeJS.Timeout | null;
  isPolling: boolean;

  // Actions - Pipeline Operations
  startPipeline: (
    file: File,
    config?: Partial<DeploymentConfig>
  ) => Promise<{ pipelineId: string; notebookId: number } | null>;
  fetchPipelineStatus: (pipelineId: string) => Promise<void>;
  fetchHistory: (params?: { skip?: number; limit?: number }) => Promise<void>;

  // Actions - Polling
  startPolling: (pipelineId: string, interval?: number) => void;
  stopPolling: () => void;

  // Utility Actions
  clearError: () => void;
  clearCurrentPipeline: () => void;
  reset: () => void;
}

/**
 * Initial state
 */
const initialState = {
  currentPipeline: null,
  history: [],
  historyTotal: 0,
  loading: false,
  error: null,
  isDeploying: false,
  pollingIntervalId: null,
  isPolling: false,
};

/**
 * Create the store
 */
export const usePipelineStore = create<PipelineState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      /**
       * Start one-click deploy pipeline
       *
       * Flow:
       * 1. Set deploying state
       * 2. Upload file and start pipeline
       * 3. Get pipeline ID
       * 4. Start polling for status
       * 5. Return pipeline info
       *
       * @param file - Jupyter notebook file
       * @param config - Optional deployment configuration
       * @returns Pipeline ID and notebook ID, or null on error
       */
      startPipeline: async (file, config) => {
        set({ isDeploying: true, loading: true, error: null });

        try {
          const result = await pipelineService.oneClickDeploy(file, config);

          set({
            isDeploying: false,
            loading: false,
          });

          // Auto-start polling for this pipeline
          get().startPolling(result.pipelineId);

          return result;
        } catch (error) {
          const message = pipelineService.getUserFriendlyError(error, "deploy");
          set({
            error: message,
            isDeploying: false,
            loading: false,
          });
          return null;
        }
      },

      /**
       * Fetch pipeline status
       *
       * Used for:
       * - Polling updates
       * - Manual refresh
       * - Checking progress
       *
       * @param pipelineId - Pipeline execution ID
       */
      fetchPipelineStatus: async (pipelineId: string) => {
        set({ loading: true, error: null });

        try {
          const pipeline = await pipelineService.getPipelineStatus(pipelineId);

          set({
            currentPipeline: pipeline,
            loading: false,
          });

          // Stop polling if pipeline is complete
          if (pipeline.status === "deployed" || pipeline.status === "failed") {
            get().stopPolling();
          }
        } catch (error) {
          const message = pipelineService.getUserFriendlyError(error, "status");
          set({
            error: message,
            loading: false,
          });
        }
      },

      /**
       * Fetch pipeline history
       *
       * Used for:
       * - Viewing past deployments
       * - Finding previous versions
       * - Tracking deployment history
       *
       * @param params - Pagination parameters
       */
      fetchHistory: async (params) => {
        set({ loading: true, error: null });

        try {
          const result = await pipelineService.getPipelineHistory(params);

          set({
            history: result.pipelines,
            historyTotal: result.total,
            loading: false,
          });
        } catch (error) {
          const message = pipelineService.getUserFriendlyError(
            error,
            "history"
          );
          set({
            error: message,
            loading: false,
          });
        }
      },

      /**
       * Start polling for pipeline status updates
       *
       * Why polling?
       * - Pipeline takes 3-5 minutes total
       * - Multiple steps to track
       * - Need real-time progress updates
       * - Simpler than websockets
       *
       * Pattern:
       * - Poll every 5 seconds (faster than builds/deployments)
       * - Stop when status is 'deployed' or 'failed'
       * - Show progress through steps_completed
       *
       * @param pipelineId - Pipeline execution ID
       * @param interval - Polling interval in ms (default: 5000)
       */
      startPolling: (pipelineId: string, interval = 5000) => {
        const { isPolling } = get();

        // Don't start if already polling
        if (isPolling) {
          return;
        }

        // Mark as polling
        set({ isPolling: true });

        // Create polling interval
        const intervalId = setInterval(async () => {
          try {
            const pipeline = await pipelineService.getPipelineStatus(
              pipelineId
            );

            // Update current pipeline
            set({ currentPipeline: pipeline });

            // Stop polling if pipeline is complete
            if (
              pipeline.status === "deployed" ||
              pipeline.status === "failed"
            ) {
              get().stopPolling();
            }
          } catch (error) {
            // Log error but don't stop polling immediately
            // Network blip shouldn't stop status updates
            console.error("Pipeline polling error:", error);

            // However, if we get multiple errors in a row,
            // the user can manually stop or we'll stop when pipeline completes
          }
        }, interval);

        // Store interval ID
        set({ pollingIntervalId: intervalId });
      },

      /**
       * Stop polling for pipeline status
       *
       * Called when:
       * - Pipeline completes (deployed/failed)
       * - User navigates away
       * - User cancels
       */
      stopPolling: () => {
        const { pollingIntervalId } = get();

        // Clear interval if exists
        if (pollingIntervalId) {
          clearInterval(pollingIntervalId);
        }

        // Reset polling state
        set({
          pollingIntervalId: null,
          isPolling: false,
        });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Clear current pipeline
       *
       * Used when:
       * - User starts new pipeline
       * - User navigates away
       * - Want to clear UI
       */
      clearCurrentPipeline: () => {
        // Stop polling if active
        get().stopPolling();

        // Clear current pipeline
        set({ currentPipeline: null });
      },

      /**
       * Reset store to initial state
       *
       * Called on:
       * - Logout
       * - Store cleanup
       */
      reset: () => {
        // Stop polling first
        get().stopPolling();

        // Reset to initial state
        set(initialState);
      },
    }),
    { name: "PipelineStore" }
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
 * const pipeline = usePipelineStore(selectCurrentPipeline);
 */

export const selectCurrentPipeline = (state: PipelineState) =>
  state.currentPipeline;
export const selectHistory = (state: PipelineState) => state.history;
export const selectHistoryTotal = (state: PipelineState) => state.historyTotal;
export const selectLoading = (state: PipelineState) => state.loading;
export const selectError = (state: PipelineState) => state.error;
export const selectIsDeploying = (state: PipelineState) => state.isDeploying;
export const selectIsPolling = (state: PipelineState) => state.isPolling;

/**
 * Derived Selectors
 *
 * Compute derived state from pipeline data.
 * Memoized automatically by Zustand.
 */

/**
 * Get pipeline progress
 *
 * Returns progress percentage and step info.
 * Returns null if no active pipeline.
 */
export const selectPipelineProgress = (
  state: PipelineState
): PipelineProgress | null => {
  if (!state.currentPipeline) return null;
  return calculatePipelineProgress(state.currentPipeline);
};

/**
 * Check if pipeline is complete
 *
 * Returns true if deployed or failed.
 */
export const selectIsPipelineComplete = (state: PipelineState): boolean => {
  if (!state.currentPipeline) return false;
  return (
    state.currentPipeline.status === "deployed" ||
    state.currentPipeline.status === "failed"
  );
};

/**
 * Check if pipeline succeeded
 */
export const selectIsPipelineSuccess = (state: PipelineState): boolean => {
  return state.currentPipeline?.status === "deployed";
};

/**
 * Check if pipeline failed
 */
export const selectIsPipelineFailed = (state: PipelineState): boolean => {
  return state.currentPipeline?.status === "failed";
};

/**
 * Get current step name
 */
export const selectCurrentStepName = (state: PipelineState): string | null => {
  return state.currentPipeline?.currentStep || null;
};

/**
 * Get service URL if deployed
 */
export const selectServiceUrl = (state: PipelineState): string | null => {
  return state.currentPipeline?.serviceUrl || null;
};

/**
 * Usage Examples:
 *
 * // Start one-click deploy
 * const { startPipeline } = usePipelineStore();
 * const result = await startPipeline(file, {
 *   cpu: '1',
 *   memory: '512Mi',
 *   minInstances: 0,
 *   maxInstances: 10,
 * });
 * // Polling starts automatically
 *
 * // Monitor progress
 * const progress = usePipelineStore(selectPipelineProgress);
 * if (progress) {
 *   console.log(`${progress.percentage}% complete`);
 *   console.log(`Current step: ${progress.currentStep}`);
 * }
 *
 * // Check if complete
 * const isComplete = usePipelineStore(selectIsPipelineComplete);
 * const isSuccess = usePipelineStore(selectIsPipelineSuccess);
 * const serviceUrl = usePipelineStore(selectServiceUrl);
 *
 * if (isComplete && isSuccess) {
 *   console.log(`Deployed at: ${serviceUrl}`);
 * }
 *
 * // Fetch history
 * const { fetchHistory, history } = usePipelineStore();
 * await fetchHistory({ skip: 0, limit: 20 });
 *
 * // Manual polling control
 * const { stopPolling } = usePipelineStore();
 * stopPolling(); // Stop if user navigates away
 *
 * // Clear pipeline
 * const { clearCurrentPipeline } = usePipelineStore();
 * clearCurrentPipeline(); // Start fresh
 */
