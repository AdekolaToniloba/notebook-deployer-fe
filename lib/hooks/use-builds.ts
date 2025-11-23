/**
 * Build Hooks
 *
 * Provides clean, type-safe interfaces for components to interact with builds.
 * Handles auto-fetching, auto-polling, and cleanup automatically.
 */

import { useEffect, useMemo } from "react";
import { useBuildStore } from "@/store/build.store";
import type { Build, BuildListItem } from "@/types/models/build.types";

/**
 * Hook Options
 */
interface UseBuildsOptions {
  autoFetch?: boolean; // Auto-fetch builds on mount
}

interface UseBuildOptions {
  autoPoll?: boolean; // Auto-poll if build is in progress
  pollInterval?: number; // Poll interval in ms (default: 10000)
}

interface UseNotebookBuildsOptions {
  autoFetch?: boolean; // Auto-fetch builds on mount
}

/**
 * Main builds hook
 *
 * Use this to list all builds or trigger new builds
 *
 * @example
 * ```tsx
 * function BuildsList() {
 *   const { builds, loading, triggerBuild } = useBuilds({ autoFetch: true });
 *
 *   return (
 *     <div>
 *       {builds.map(build => <BuildCard key={build.id} build={build} />)}
 *     </div>
 *   );
 * }
 * ```
 */
export function useBuilds(options: UseBuildsOptions = {}) {
  const { autoFetch = false } = options;

  // Select from store
  const builds = useBuildStore((state) => state.builds);
  const loading = useBuildStore((state) => state.loading);
  const error = useBuildStore((state) => state.error);

  // Actions
  const fetchBuilds = useBuildStore((state) => state.fetchBuilds);
  const triggerBuildAction = useBuildStore((state) => state.triggerBuild);
  const clearError = useBuildStore((state) => state.clearError);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchBuilds();
    }
  }, [autoFetch, fetchBuilds]);

  // Wrapper to make triggerBuild easier to use
  const triggerBuild = async (notebookId: number) => {
    const build = await triggerBuildAction(notebookId);
    return build;
  };

  return {
    builds,
    loading,
    error,
    triggerBuild,
    fetchBuilds,
    clearError,
  };
}

/**
 * Single build hook with auto-polling
 *
 * Use this to track a specific build's progress.
 * Auto-polling will stop when build completes (success/failed).
 *
 * @example
 * ```tsx
 * function BuildStatus({ buildId }: { buildId: number }) {
 *   const { build, loading, isPolling } = useBuild(buildId, { autoPoll: true });
 *
 *   if (!build) return <div>Build not found</div>;
 *
 *   return (
 *     <div>
 *       <p>Status: {build.status}</p>
 *       {isPolling && <Spinner />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useBuild(buildId: number, options: UseBuildOptions = {}) {
  const { autoPoll = false, pollInterval = 10000 } = options;

  // Select from store
  const selectedBuild = useBuildStore((state) => state.selectedBuild);
  const loading = useBuildStore((state) => state.loading);
  const error = useBuildStore((state) => state.error);
  const pollingBuilds = useBuildStore((state) => state.pollingBuilds);

  // Actions
  const fetchBuild = useBuildStore((state) => state.fetchBuild);
  const refreshBuildStatus = useBuildStore((state) => state.refreshBuildStatus);
  const startPolling = useBuildStore((state) => state.startPolling);
  const stopPolling = useBuildStore((state) => state.stopPolling);
  const clearError = useBuildStore((state) => state.clearError);

  // Is this build currently being polled?
  const isPolling = pollingBuilds.has(buildId);

  // Build object (only if it matches the buildId)
  const build = useMemo(() => {
    return selectedBuild?.id === buildId ? selectedBuild : null;
  }, [selectedBuild, buildId]);

  // Fetch build on mount
  useEffect(() => {
    fetchBuild(buildId);
  }, [buildId, fetchBuild]);

  // Auto-polling logic
  useEffect(() => {
    // Only poll if:
    // 1. autoPoll is enabled
    // 2. build exists
    // 3. build is in progress (not success or failed)
    const shouldPoll =
      autoPoll &&
      build &&
      build.status !== "success" &&
      build.status !== "failed";

    if (shouldPoll) {
      // Start polling
      startPolling(buildId);

      // Set up interval to refresh status
      const interval = setInterval(() => {
        refreshBuildStatus(buildId);
      }, pollInterval);

      // Cleanup: stop polling and clear interval
      return () => {
        stopPolling(buildId);
        clearInterval(interval);
      };
    } else {
      // Stop polling if it was running
      stopPolling(buildId);
    }
  }, [
    autoPoll,
    build?.status,
    buildId,
    pollInterval,
    startPolling,
    stopPolling,
    refreshBuildStatus,
  ]);

  // Manual refresh
  const refresh = async () => {
    await refreshBuildStatus(buildId);
  };

  return {
    build,
    loading,
    error,
    isPolling,
    refresh,
    startPolling: () => startPolling(buildId),
    stopPolling: () => stopPolling(buildId),
    clearError,
  };
}

/**
 * Notebook builds hook
 *
 * Use this to get all builds for a specific notebook.
 * Useful in notebook detail pages.
 *
 * @example
 * ```tsx
 * function NotebookBuilds({ notebookId }: { notebookId: number }) {
 *   const { builds, loading, triggerBuild } = useNotebookBuilds(notebookId, {
 *     autoFetch: true,
 *   });
 *
 *   return (
 *     <div>
 *       <button onClick={() => triggerBuild()}>New Build</button>
 *       {builds.map(build => <BuildCard key={build.id} build={build} />)}
 *     </div>
 *   );
 * }
 * ```
 */
export function useNotebookBuilds(
  notebookId: number,
  options: UseNotebookBuildsOptions = {}
) {
  const { autoFetch = false } = options;

  // Select from store
  const builds = useBuildStore((state) => state.builds);
  const loading = useBuildStore((state) => state.loading);
  const error = useBuildStore((state) => state.error);

  // Actions
  const fetchNotebookBuilds = useBuildStore(
    (state) => state.fetchNotebookBuilds
  );
  const triggerBuildAction = useBuildStore((state) => state.triggerBuild);
  const clearError = useBuildStore((state) => state.clearError);

  // Filter builds for this notebook
  const notebookBuilds = useMemo(() => {
    return builds.filter((build) => build.notebookId === notebookId);
  }, [builds, notebookId]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchNotebookBuilds(notebookId);
    }
  }, [autoFetch, notebookId, fetchNotebookBuilds]);

  // Wrapper to make triggerBuild easier (no need to pass notebookId again)
  const triggerBuild = async () => {
    const build = await triggerBuildAction(notebookId);
    return build;
  };

  // Refetch for this notebook
  const refetch = () => fetchNotebookBuilds(notebookId);

  return {
    builds: notebookBuilds,
    loading,
    error,
    triggerBuild,
    refetch,
    clearError,
  };
}

/**
 * Build logs hook
 *
 * Use this to fetch and display build logs.
 *
 * @example
 * ```tsx
 * function BuildLogs({ buildId }: { buildId: number }) {
 *   const { logs, loading, refetch } = useBuildLogs(buildId);
 *
 *   if (loading) return <Spinner />;
 *
 *   return (
 *     <div>
 *       <button onClick={refetch}>Refresh</button>
 *       <pre>{logs}</pre>
 *     </div>
 *   );
 * }
 * ```
 */
export function useBuildLogs(buildId: number) {
  const loading = useBuildStore((state) => state.loading);
  const error = useBuildStore((state) => state.error);
  const getBuildLogs = useBuildStore((state) => state.getBuildLogs);
  const clearError = useBuildStore((state) => state.clearError);

  // Logs are fetched on demand, not stored in state
  // This is because logs can be large and rarely change
  const fetchLogs = async () => {
    return await getBuildLogs(buildId);
  };

  return {
    loading,
    error,
    fetchLogs,
    clearError,
  };
}
