/**
 * Deployment Hooks
 *
 * Provides clean, type-safe interfaces for components to interact with deployments.
 * Handles auto-fetching, auto-polling, and cleanup automatically.
 */

import { useEffect, useMemo } from "react";
import { useDeploymentStore } from "@/store/deployment.store";
import type {
  Deployment,
  DeploymentListItem,
  DeploymentConfig,
} from "@/types/models/deployment.types";

/**
 * Hook Options
 */
interface UseDeploymentsOptions {
  autoFetch?: boolean; // Auto-fetch deployments on mount
}

interface UseDeploymentOptions {
  autoPoll?: boolean; // Auto-poll if deployment is in progress
  pollInterval?: number; // Poll interval in ms (default: 10000)
}

interface UseNotebookDeploymentsOptions {
  autoFetch?: boolean; // Auto-fetch deployments on mount
}

/**
 * Deployment Create Parameters
 */
export interface DeploymentCreateParams {
  notebookId: number;
  buildId?: number;
  config?: DeploymentConfig;
}

/**
 * Traffic Update Parameters
 */
export interface TrafficUpdateParams {
  revisionName: string;
  trafficPercent: number;
}

/**
 * Main deployments hook
 *
 * Use this to list all deployments or create new deployments
 *
 * @example
 * ```tsx
 * function DeploymentsList() {
 *   const { deployments, loading, createDeployment } = useDeployments({
 *     autoFetch: true,
 *   });
 *
 *   const handleDeploy = async () => {
 *     await createDeployment({
 *       notebookId: 1,
 *       buildId: 5,
 *       config: { cpu: '2', memory: '1Gi' }
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       {deployments.map(d => <DeploymentCard key={d.id} deployment={d} />)}
 *     </div>
 *   );
 * }
 * ```
 */
export function useDeployments(options: UseDeploymentsOptions = {}) {
  const { autoFetch = false } = options;

  // Select from store
  const deployments = useDeploymentStore((state) => state.deployments);
  const loading = useDeploymentStore((state) => state.loading);
  const error = useDeploymentStore((state) => state.error);
  const isDeploying = useDeploymentStore((state) => state.isDeploying);

  // Actions
  const fetchDeployments = useDeploymentStore(
    (state) => state.fetchDeployments
  );
  const createDeploymentAction = useDeploymentStore(
    (state) => state.createDeployment
  );
  const updateTrafficAction = useDeploymentStore(
    (state) => state.updateTraffic
  );
  const rollbackAction = useDeploymentStore((state) => state.rollback);
  const clearError = useDeploymentStore((state) => state.clearError);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchDeployments();
    }
  }, [autoFetch, fetchDeployments]);

  // Wrapper for createDeployment
  const createDeployment = async (params: DeploymentCreateParams) => {
    const deployment = await createDeploymentAction(params);
    return deployment;
  };

  // Wrapper for updateTraffic
  const updateTraffic = async (
    deploymentId: number,
    params: TrafficUpdateParams
  ) => {
    await updateTrafficAction(deploymentId, params);
  };

  // Wrapper for rollback
  const rollback = async (deploymentId: number, revisionName: string) => {
    await rollbackAction(deploymentId, revisionName);
  };

  return {
    deployments,
    loading,
    error,
    isDeploying,
    createDeployment,
    updateTraffic,
    rollback,
    fetchDeployments,
    clearError,
  };
}

/**
 * Single deployment hook with auto-polling
 *
 * Use this to track a specific deployment's progress.
 * Auto-polling will stop when deployment completes (deployed/failed).
 *
 * @example
 * ```tsx
 * function DeploymentStatus({ deploymentId }: { deploymentId: number }) {
 *   const {
 *     deployment,
 *     loading,
 *     isPolling,
 *     updateTraffic,
 *     rollback
 *   } = useDeployment(deploymentId, { autoPoll: true });
 *
 *   if (!deployment) return <div>Deployment not found</div>;
 *
 *   return (
 *     <div>
 *       <p>Status: {deployment.status}</p>
 *       {deployment.serviceUrl && (
 *         <a href={deployment.serviceUrl}>Visit App</a>
 *       )}
 *       {isPolling && <Spinner />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useDeployment(
  deploymentId: number,
  options: UseDeploymentOptions = {}
) {
  const { autoPoll = false, pollInterval = 10000 } = options;

  // Select from store
  const selectedDeployment = useDeploymentStore(
    (state) => state.selectedDeployment
  );
  const loading = useDeploymentStore((state) => state.loading);
  const error = useDeploymentStore((state) => state.error);
  const pollingDeployments = useDeploymentStore(
    (state) => state.pollingDeployments
  );

  // Actions
  const fetchDeployment = useDeploymentStore((state) => state.fetchDeployment);
  const updateTrafficAction = useDeploymentStore(
    (state) => state.updateTraffic
  );
  const rollbackAction = useDeploymentStore((state) => state.rollback);
  const startPolling = useDeploymentStore((state) => state.startPolling);
  const stopPolling = useDeploymentStore((state) => state.stopPolling);
  const clearError = useDeploymentStore((state) => state.clearError);

  // Is this deployment currently being polled?
  const isPolling = pollingDeployments.has(deploymentId);

  // Deployment object (only if it matches the deploymentId)
  const deployment = useMemo(() => {
    return selectedDeployment?.id === deploymentId ? selectedDeployment : null;
  }, [selectedDeployment, deploymentId]);

  // Fetch deployment on mount
  useEffect(() => {
    fetchDeployment(deploymentId);
  }, [deploymentId, fetchDeployment]);

  // Auto-polling logic
  useEffect(() => {
    // Only poll if:
    // 1. autoPoll is enabled
    // 2. deployment exists
    // 3. deployment is in progress (deploying or updating)
    const shouldPoll =
      autoPoll &&
      deployment &&
      (deployment.status === "deploying" || deployment.status === "updating");

    if (shouldPoll) {
      // Start polling
      startPolling(deploymentId);

      // Set up interval to refresh status
      const interval = setInterval(() => {
        fetchDeployment(deploymentId);
      }, pollInterval);

      // Cleanup: stop polling and clear interval
      return () => {
        stopPolling(deploymentId);
        clearInterval(interval);
      };
    } else {
      // Stop polling if it was running
      stopPolling(deploymentId);
    }
  }, [
    autoPoll,
    deployment?.status,
    deploymentId,
    pollInterval,
    startPolling,
    stopPolling,
    fetchDeployment,
  ]);

  // Manual refresh
  const refresh = async () => {
    await fetchDeployment(deploymentId);
  };

  // Wrapper for updateTraffic
  const updateTraffic = async (params: TrafficUpdateParams) => {
    await updateTrafficAction(deploymentId, params);
  };

  // Wrapper for rollback
  const rollback = async (revisionName: string) => {
    await rollbackAction(deploymentId, revisionName);
  };

  return {
    deployment,
    loading,
    error,
    isPolling,
    refresh,
    updateTraffic,
    rollback,
    startPolling: () => startPolling(deploymentId),
    stopPolling: () => stopPolling(deploymentId),
    clearError,
  };
}

/**
 * Notebook deployments hook
 *
 * Use this to get all deployments for a specific notebook.
 * Useful in notebook detail pages.
 *
 * @example
 * ```tsx
 * function NotebookDeployments({ notebookId }: { notebookId: number }) {
 *   const {
 *     deployments,
 *     loading,
 *     createDeployment
 *   } = useNotebookDeployments(notebookId, { autoFetch: true });
 *
 *   const handleDeploy = async () => {
 *     await createDeployment({
 *       buildId: 5,
 *       config: { cpu: '1', memory: '512Mi' }
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleDeploy}>Deploy</button>
 *       {deployments.map(d => <DeploymentCard key={d.id} deployment={d} />)}
 *     </div>
 *   );
 * }
 * ```
 */
export function useNotebookDeployments(
  notebookId: number,
  options: UseNotebookDeploymentsOptions = {}
) {
  const { autoFetch = false } = options;

  // Select from store
  const deployments = useDeploymentStore((state) => state.deployments);
  const loading = useDeploymentStore((state) => state.loading);
  const error = useDeploymentStore((state) => state.error);
  const isDeploying = useDeploymentStore((state) => state.isDeploying);

  // Actions
  const fetchNotebookDeployments = useDeploymentStore(
    (state) => state.fetchNotebookDeployments
  );
  const createDeploymentAction = useDeploymentStore(
    (state) => state.createDeployment
  );
  const clearError = useDeploymentStore((state) => state.clearError);

  // Filter deployments for this notebook
  const notebookDeployments = useMemo(() => {
    return deployments.filter(
      (deployment) => deployment.notebookId === notebookId
    );
  }, [deployments, notebookId]);

  // Get latest deployment for this notebook
  const latestDeployment = useMemo(() => {
    if (notebookDeployments.length === 0) return null;

    // Sort by createdAt descending and return first
    return [...notebookDeployments].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    )[0];
  }, [notebookDeployments]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchNotebookDeployments(notebookId);
    }
  }, [autoFetch, notebookId, fetchNotebookDeployments]);

  // Wrapper to make createDeployment easier (notebookId is already known)
  const createDeployment = async (params: {
    buildId?: number;
    config?: DeploymentConfig;
  }) => {
    const deployment = await createDeploymentAction({
      notebookId,
      ...params,
    });
    return deployment;
  };

  // Refetch for this notebook
  const refetch = () => fetchNotebookDeployments(notebookId);

  return {
    deployments: notebookDeployments,
    latestDeployment,
    loading,
    error,
    isDeploying,
    createDeployment,
    refetch,
    clearError,
  };
}
