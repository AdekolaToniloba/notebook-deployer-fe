// store/deployment.store.ts

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { deploymentService } from "@/lib/api/services/deployments.service";
import type {
  Deployment,
  DeploymentListItem,
  DeploymentConfig,
  TrafficConfig,
} from "@/types/models/deployment.types";

/**
 * Deployment Store
 *
 * Manages state for Cloud Run deployments.
 *
 * Why Zustand?
 * 1. Simple API - less boilerplate than Redux
 * 2. No Context needed - direct imports
 * 3. Good TypeScript support
 * 4. DevTools integration
 * 5. Fast - minimal re-renders
 *
 * State organization:
 * - deployments: Array of deployments for lists
 * - selectedDeployment: Currently selected deployment (detail view)
 * - loading: Global loading state
 * - error: Error messages
 * - isDeploying: Specific state for creating deployments
 * - Polling: Track which deployments are being polled
 *
 * Actions pattern:
 * - Each action is async and handles its own errors
 * - Loading state is managed automatically
 * - Errors are stored for UI to display
 * - Polling runs in background
 */

interface DeploymentState {
  // Data
  deployments: DeploymentListItem[];
  selectedDeployment: Deployment | null;

  // UI State
  loading: boolean;
  error: string | null;
  isDeploying: boolean; // Specific state for deploy action

  // Polling State
  pollingIntervals: Map<number, NodeJS.Timeout>; // deploymentId -> interval
  pollingDeployments: Set<number>; // Set of deployment IDs being polled

  // Actions - Deployment Operations
  createDeployment: (params: {
    notebookId: number;
    buildId?: number;
    config?: Partial<DeploymentConfig>;
  }) => Promise<Deployment | null>;
  fetchDeployment: (deploymentId: number) => Promise<void>;
  fetchDeployments: () => Promise<void>;
  fetchNotebookDeployments: (notebookId: number) => Promise<void>;

  // Actions - Traffic & Rollback
  updateTraffic: (
    deploymentId: number,
    config: TrafficConfig
  ) => Promise<Deployment | null>;
  rollback: (
    deploymentId: number,
    revisionName: string
  ) => Promise<Deployment | null>;

  // Actions - Polling
  startPolling: (deploymentId: number, interval?: number) => void;
  stopPolling: (deploymentId: number) => void;
  stopAllPolling: () => void;

  // Utility Actions
  clearError: () => void;
  setSelectedDeployment: (deployment: Deployment | null) => void;
  reset: () => void;
}

/**
 * Initial state
 */
const initialState = {
  deployments: [],
  selectedDeployment: null,
  loading: false,
  error: null,
  isDeploying: false,
  pollingIntervals: new Map<number, NodeJS.Timeout>(),
  pollingDeployments: new Set<number>(),
};

/**
 * Create the store
 */
export const useDeploymentStore = create<DeploymentState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      /**
       * Create a new deployment
       *
       * Flow:
       * 1. Set deploying state
       * 2. Call service to create deployment
       * 3. Add to deployments list
       * 4. Start polling for status
       * 5. Return deployment info
       *
       * @param params - Deployment configuration
       * @returns Deployment info or null on error
       */
      createDeployment: async (params) => {
        set({ isDeploying: true, loading: true, error: null });

        try {
          const deployment = await deploymentService.createDeployment(params);

          // Add to deployments list (transform to list item)
          const listItem: DeploymentListItem = {
            id: deployment.id,
            notebookId: deployment.notebookId,
            serviceName: deployment.serviceName,
            serviceUrl: deployment.serviceUrl,
            status: deployment.status,
            errorMessage: deployment.errorMessage,
            createdAt: deployment.createdAt,
          };

          set((state) => ({
            deployments: [listItem, ...state.deployments],
            isDeploying: false,
            loading: false,
          }));

          // Auto-start polling for this deployment
          get().startPolling(deployment.id);

          return deployment;
        } catch (error) {
          const message = deploymentService.getUserFriendlyError(
            error,
            "create"
          );
          set({
            error: message,
            isDeploying: false,
            loading: false,
          });
          return null;
        }
      },

      /**
       * Fetch single deployment details
       *
       * Used for:
       * - Detail view
       * - Refreshing specific deployment
       * - Polling updates
       *
       * @param deploymentId - ID of deployment to fetch
       */
      fetchDeployment: async (deploymentId: number) => {
        set({ loading: true, error: null });

        try {
          const deployment = await deploymentService.getDeployment(
            deploymentId
          );

          // Update selected deployment
          set({
            selectedDeployment: deployment,
            loading: false,
          });

          // Also update in deployments list if present
          set((state) => ({
            deployments: state.deployments.map((d) =>
              d.id === deploymentId
                ? {
                    id: deployment.id,
                    notebookId: deployment.notebookId,
                    serviceName: deployment.serviceName,
                    serviceUrl: deployment.serviceUrl,
                    status: deployment.status,
                    errorMessage: deployment.errorMessage,
                    createdAt: deployment.createdAt,
                  }
                : d
            ),
          }));

          // Stop polling if deployment is complete
          if (
            deployment.status === "deployed" ||
            deployment.status === "failed"
          ) {
            get().stopPolling(deploymentId);
          }
        } catch (error) {
          const message = deploymentService.getUserFriendlyError(
            error,
            "fetch"
          );
          set({
            error: message,
            loading: false,
          });
        }
      },

      /**
       * Fetch all deployments for current user
       *
       * Used for:
       * - Deployment list view
       * - Dashboard overview
       */
      fetchDeployments: async () => {
        set({ loading: true, error: null });

        try {
          const deployments = await deploymentService.listDeployments();

          set({
            deployments,
            loading: false,
          });
        } catch (error) {
          const message = deploymentService.getUserFriendlyError(error, "list");
          set({
            error: message,
            loading: false,
          });
        }
      },

      /**
       * Fetch deployments for specific notebook
       *
       * Used for:
       * - Notebook detail view
       * - Finding active deployment
       *
       * @param notebookId - ID of notebook
       */
      fetchNotebookDeployments: async (notebookId: number) => {
        set({ loading: true, error: null });

        try {
          const deployments = await deploymentService.listNotebookDeployments(
            notebookId
          );

          set({
            deployments,
            loading: false,
          });
        } catch (error) {
          const message = deploymentService.getUserFriendlyError(error, "list");
          set({
            error: message,
            loading: false,
          });
        }
      },

      /**
       * Update traffic distribution
       *
       * Used for:
       * - A/B testing
       * - Gradual rollout (canary deployment)
       * - Blue-green deployment
       *
       * @param deploymentId - ID of deployment
       * @param config - Traffic configuration
       * @returns Updated deployment or null on error
       */
      updateTraffic: async (deploymentId: number, config: TrafficConfig) => {
        set({ loading: true, error: null });

        try {
          const deployment = await deploymentService.updateTraffic(
            deploymentId,
            config
          );

          // Update selected deployment if it matches
          if (get().selectedDeployment?.id === deploymentId) {
            set({ selectedDeployment: deployment });
          }

          // Update in deployments list
          set((state) => ({
            deployments: state.deployments.map((d) =>
              d.id === deploymentId
                ? {
                    id: deployment.id,
                    notebookId: deployment.notebookId,
                    serviceName: deployment.serviceName,
                    serviceUrl: deployment.serviceUrl,
                    status: deployment.status,
                    errorMessage: deployment.errorMessage,
                    createdAt: deployment.createdAt,
                  }
                : d
            ),
            loading: false,
          }));

          return deployment;
        } catch (error) {
          const message = deploymentService.getUserFriendlyError(
            error,
            "traffic"
          );
          set({
            error: message,
            loading: false,
          });
          return null;
        }
      },

      /**
       * Rollback deployment to previous revision
       *
       * Used for:
       * - Quick recovery from issues
       * - Reverting bad deployments
       * - Zero-downtime rollback
       *
       * @param deploymentId - ID of deployment
       * @param revisionName - Revision to rollback to
       * @returns Updated deployment or null on error
       */
      rollback: async (deploymentId: number, revisionName: string) => {
        set({ loading: true, error: null });

        try {
          const deployment = await deploymentService.rollback(
            deploymentId,
            revisionName
          );

          // Update selected deployment if it matches
          if (get().selectedDeployment?.id === deploymentId) {
            set({ selectedDeployment: deployment });
          }

          // Update in deployments list
          set((state) => ({
            deployments: state.deployments.map((d) =>
              d.id === deploymentId
                ? {
                    id: deployment.id,
                    notebookId: deployment.notebookId,
                    serviceName: deployment.serviceName,
                    serviceUrl: deployment.serviceUrl,
                    status: deployment.status,
                    errorMessage: deployment.errorMessage,
                    createdAt: deployment.createdAt,
                  }
                : d
            ),
            loading: false,
          }));

          return deployment;
        } catch (error) {
          const message = deploymentService.getUserFriendlyError(
            error,
            "rollback"
          );
          set({
            error: message,
            loading: false,
          });
          return null;
        }
      },

      /**
       * Start polling for deployment status updates
       *
       * Why polling?
       * - Deployments take 1-3 minutes
       * - Need real-time updates
       * - Simpler than websockets
       *
       * Pattern:
       * - Poll every 10 seconds (default)
       * - Stop when deployment completes (deployed/failed)
       * - Prevent duplicate polling for same deployment
       *
       * @param deploymentId - ID of deployment to poll
       * @param interval - Polling interval in ms (default: 10000)
       */
      startPolling: (deploymentId: number, interval = 10000) => {
        const { pollingIntervals, pollingDeployments } = get();

        // Don't start if already polling
        if (pollingDeployments.has(deploymentId)) {
          return;
        }

        // Add to polling set
        set((state) => ({
          pollingDeployments: new Set([
            ...state.pollingDeployments,
            deploymentId,
          ]),
        }));

        // Create polling interval
        const intervalId = setInterval(async () => {
          try {
            const deployment = await deploymentService.getDeployment(
              deploymentId
            );

            // Update in store
            set((state) => ({
              deployments: state.deployments.map((d) =>
                d.id === deploymentId
                  ? {
                      id: deployment.id,
                      notebookId: deployment.notebookId,
                      serviceName: deployment.serviceName,
                      serviceUrl: deployment.serviceUrl,
                      status: deployment.status,
                      errorMessage: deployment.errorMessage,
                      createdAt: deployment.createdAt,
                    }
                  : d
              ),
            }));

            // Update selected deployment if it matches
            if (get().selectedDeployment?.id === deploymentId) {
              set({ selectedDeployment: deployment });
            }

            // Stop polling if deployment is complete
            if (
              deployment.status === "deployed" ||
              deployment.status === "failed"
            ) {
              get().stopPolling(deploymentId);
            }
          } catch (error) {
            // Log error but don't stop polling
            console.error("Polling error:", error);
          }
        }, interval);

        // Store interval ID
        set((state) => {
          const newIntervals = new Map(state.pollingIntervals);
          newIntervals.set(deploymentId, intervalId);
          return { pollingIntervals: newIntervals };
        });
      },

      /**
       * Stop polling for a specific deployment
       *
       * @param deploymentId - ID of deployment to stop polling
       */
      stopPolling: (deploymentId: number) => {
        const { pollingIntervals, pollingDeployments } = get();

        // Clear interval if exists
        const intervalId = pollingIntervals.get(deploymentId);
        if (intervalId) {
          clearInterval(intervalId);
        }

        // Remove from maps/sets
        set((state) => {
          const newIntervals = new Map(state.pollingIntervals);
          newIntervals.delete(deploymentId);

          const newPollingDeployments = new Set(state.pollingDeployments);
          newPollingDeployments.delete(deploymentId);

          return {
            pollingIntervals: newIntervals,
            pollingDeployments: newPollingDeployments,
          };
        });
      },

      /**
       * Stop all polling
       *
       * Used when:
       * - User logs out
       * - Component unmounts
       * - Navigating away from deployments
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
          pollingDeployments: new Set(),
        });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Set selected deployment manually
       *
       * Useful for:
       * - Navigation
       * - Selecting from list
       *
       * @param deployment - Deployment to select or null
       */
      setSelectedDeployment: (deployment: Deployment | null) => {
        set({ selectedDeployment: deployment });
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
    { name: "DeploymentStore" }
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
 * const deployments = useDeploymentStore(selectDeployments);
 */

export const selectDeployments = (state: DeploymentState) => state.deployments;
export const selectSelectedDeployment = (state: DeploymentState) =>
  state.selectedDeployment;
export const selectLoading = (state: DeploymentState) => state.loading;
export const selectError = (state: DeploymentState) => state.error;
export const selectIsDeploying = (state: DeploymentState) => state.isDeploying;
export const selectIsPolling = (state: DeploymentState, deploymentId: number) =>
  state.pollingDeployments.has(deploymentId);

/**
 * Usage Examples:
 *
 * // Create deployment and start polling
 * const { createDeployment } = useDeploymentStore();
 * const deployment = await createDeployment({
 *   notebookId: 1,
 *   buildId: 5,
 *   config: { cpu: '2', memory: '1Gi' }
 * });
 * // Polling starts automatically
 *
 * // Fetch deployments
 * const { fetchDeployments, deployments } = useDeploymentStore();
 * await fetchDeployments();
 *
 * // Update traffic (gradual rollout)
 * const { updateTraffic } = useDeploymentStore();
 * await updateTraffic(deploymentId, {
 *   revisionName: 'notebook-1-1-00002-abc',
 *   trafficPercent: 10, // 10% to new version
 * });
 *
 * // Rollback
 * const { rollback } = useDeploymentStore();
 * await rollback(deploymentId, 'notebook-1-1-00001-xyz');
 *
 * // Use selectors to prevent re-renders
 * const deployments = useDeploymentStore(selectDeployments);
 * const loading = useDeploymentStore(selectLoading);
 */
