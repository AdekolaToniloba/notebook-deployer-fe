/**
 * Pipeline Hooks
 *
 * Provides clean, type-safe interfaces for the one-click deploy flow.
 * Handles progress tracking, auto-polling, and pipeline history.
 */

import { useEffect, useMemo } from "react";
import { usePipelineStore } from "@/store/pipeline.store";
import type {
  Pipeline,
  PipelineHistoryItem,
  PipelineStep,
} from "@/types/models/pipeline.types";
import type { DeploymentConfig } from "@/types/models/deployment.types";

/**
 * Hook Options
 */
interface UsePipelineStatusOptions {
  autoPoll?: boolean; // Auto-poll if pipeline is processing
  pollInterval?: number; // Poll interval in ms (default: 5000)
}

interface UsePipelineHistoryOptions {
  autoFetch?: boolean; // Auto-fetch history on mount
  limit?: number; // Number of items to fetch (default: 20)
}

/**
 * Main pipeline hook
 *
 * Use this to start a one-click deploy and track current pipeline.
 *
 * @example
 * ```tsx
 * function OneClickDeploy() {
 *   const { startPipeline, currentPipeline, isDeploying, error } = usePipeline();
 *
 *   const handleDeploy = async (file: File) => {
 *     const pipelineId = await startPipeline(file, {
 *       cpu: '2',
 *       memory: '1Gi',
 *     });
 *
 *     if (pipelineId) {
 *       // Success - pipeline started
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       {currentPipeline && (
 *         <PipelineProgress pipeline={currentPipeline} />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePipeline() {
  // Select from store
  const currentPipeline = usePipelineStore((state) => state.currentPipeline);
  const loading = usePipelineStore((state) => state.loading);
  const error = usePipelineStore((state) => state.error);
  const isDeploying = usePipelineStore((state) => state.isDeploying);

  // Actions
  const startPipelineAction = usePipelineStore((state) => state.startPipeline);
  const stopPollingAction = usePipelineStore((state) => state.stopPolling);
  const clearError = usePipelineStore((state) => state.clearError);
  const reset = usePipelineStore((state) => state.reset);

  // Wrapper for startPipeline
  const startPipeline = async (file: File, config?: DeploymentConfig) => {
    const pipelineId = await startPipelineAction(file, config);
    return pipelineId;
  };

  // Wrapper for stopPolling
  const stopPolling = () => {
    stopPollingAction();
  };

  return {
    currentPipeline,
    loading,
    error,
    isDeploying,
    startPipeline,
    stopPolling,
    clearError,
    reset,
  };
}

/**
 * Pipeline status hook with auto-polling and progress tracking
 *
 * Use this to track a specific pipeline's progress.
 * Auto-polling will stop when pipeline completes (deployed/failed).
 *
 * Note: The store manages polling internally with an interval.
 * We just tell it to start/stop, and it handles the actual polling.
 *
 * @example
 * ```tsx
 * function PipelineProgress({ pipelineId }: { pipelineId: string }) {
 *   const {
 *     pipeline,
 *     progress,
 *     isComplete,
 *     currentStep
 *   } = usePipelineStatus(pipelineId, { autoPoll: true });
 *
 *   if (!pipeline) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       <ProgressBar value={progress} />
 *       <p>Current Step: {currentStep}</p>
 *       {isComplete && (
 *         <p>Service URL: {pipeline.serviceUrl}</p>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePipelineStatus(
  pipelineId: string | null,
  options: UsePipelineStatusOptions = {}
) {
  const { autoPoll = false, pollInterval = 5000 } = options;

  // Select from store
  const currentPipeline = usePipelineStore((state) => state.currentPipeline);
  const loading = usePipelineStore((state) => state.loading);
  const error = usePipelineStore((state) => state.error);
  const isPolling = usePipelineStore((state) => state.isPolling);

  // Actions
  const fetchPipelineStatus = usePipelineStore(
    (state) => state.fetchPipelineStatus
  );
  const startPolling = usePipelineStore((state) => state.startPolling);
  const stopPolling = usePipelineStore((state) => state.stopPolling);
  const clearError = usePipelineStore((state) => state.clearError);

  // Pipeline object (only if it matches the pipelineId)
  const pipeline = useMemo(() => {
    return currentPipeline?.pipelineId === pipelineId ? currentPipeline : null;
  }, [currentPipeline, pipelineId]);

  // Calculate progress percentage
  const progress = useMemo(() => {
    if (!pipeline) return 0;

    // Total steps in pipeline
    const totalSteps = 5; // parse, dependencies, upload, build, deploy

    // Completed steps
    const completed = pipeline.stepsCompleted.length;

    // Calculate percentage
    return (completed / totalSteps) * 100;
  }, [pipeline]);

  // Is pipeline complete?
  const isComplete = useMemo(() => {
    if (!pipeline) return false;
    return pipeline.status === "deployed" || pipeline.status === "failed";
  }, [pipeline]);

  // Get current step with friendly name
  const currentStep = useMemo(() => {
    if (!pipeline) return null;

    const stepNames: Record<PipelineStep, string> = {
      parse: "Parsing Notebook",
      dependencies: "Analyzing Dependencies",
      upload: "Uploading to Cloud",
      build: "Building Container",
      deploy: "Deploying to Cloud Run",
    };

    return stepNames[pipeline.currentStep] || pipeline.currentStep;
  }, [pipeline]);

  // Fetch pipeline status on mount or when pipelineId changes
  useEffect(() => {
    if (pipelineId) {
      fetchPipelineStatus(pipelineId);
    }
  }, [pipelineId, fetchPipelineStatus]);

  // Auto-polling logic
  useEffect(() => {
    // Only poll if:
    // 1. autoPoll is enabled
    // 2. pipelineId exists
    // 3. pipeline exists and is processing
    const shouldPoll =
      autoPoll && pipelineId && pipeline && pipeline.status === "processing";

    if (shouldPoll && !isPolling) {
      // Start polling
      startPolling(pipelineId, pollInterval);
    } else if (!shouldPoll && isPolling) {
      // Stop polling if conditions no longer met
      stopPolling();
    }

    // Cleanup on unmount
    return () => {
      if (isPolling) {
        stopPolling();
      }
    };
  }, [
    autoPoll,
    pipelineId,
    pipeline?.status,
    pollInterval,
    isPolling,
    startPolling,
    stopPolling,
  ]);

  // Manual refresh
  const refresh = async () => {
    if (pipelineId) {
      await fetchPipelineStatus(pipelineId);
    }
  };

  return {
    pipeline,
    loading,
    error,
    isPolling,
    progress,
    isComplete,
    currentStep,
    refresh,
    clearError,
  };
}

/**
 * Pipeline history hook
 *
 * Use this to display pipeline execution history.
 *
 * @example
 * ```tsx
 * function PipelineHistory() {
 *   const {
 *     history,
 *     total,
 *     loading,
 *     hasMore,
 *     loadMore
 *   } = usePipelineHistory({ autoFetch: true, limit: 20 });
 *
 *   return (
 *     <div>
 *       {history.map(item => (
 *         <PipelineHistoryCard key={item.notebookId} item={item} />
 *       ))}
 *       {hasMore && (
 *         <button onClick={loadMore}>Load More</button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePipelineHistory(options: UsePipelineHistoryOptions = {}) {
  const { autoFetch = false, limit = 20 } = options;

  // Select from store
  const history = usePipelineStore((state) => state.history);
  const historyTotal = usePipelineStore((state) => state.historyTotal);
  const loading = usePipelineStore((state) => state.loading);
  const error = usePipelineStore((state) => state.error);

  // Actions
  const fetchHistory = usePipelineStore((state) => state.fetchHistory);
  const clearError = usePipelineStore((state) => state.clearError);

  // Has more items to load?
  const hasMore = useMemo(() => {
    return history.length < historyTotal;
  }, [history.length, historyTotal]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchHistory({ skip: 0, limit });
    }
  }, [autoFetch, limit, fetchHistory]);

  // Load more items (pagination)
  const loadMore = async () => {
    if (hasMore && !loading) {
      await fetchHistory({ skip: history.length, limit });
    }
  };

  // Refetch from beginning
  const refetch = () => {
    fetchHistory({ skip: 0, limit });
  };

  // Get pipelines by status
  const successfulPipelines = useMemo(() => {
    return history.filter((item) => item.deploymentStatus === "deployed");
  }, [history]);

  const failedPipelines = useMemo(() => {
    return history.filter(
      (item) =>
        item.notebookStatus === "failed" ||
        item.buildStatus === "failed" ||
        item.deploymentStatus === "failed"
    );
  }, [history]);

  const inProgressPipelines = useMemo(() => {
    return history.filter(
      (item) =>
        item.buildStatus === "building" || item.deploymentStatus === "deploying"
    );
  }, [history]);

  return {
    history,
    total: historyTotal,
    loading,
    error,
    hasMore,
    loadMore,
    refetch,
    clearError,
    // Convenience filters
    successfulPipelines,
    failedPipelines,
    inProgressPipelines,
  };
}

/**
 * Get pipeline step index
 *
 * Helper to get numeric index of a pipeline step.
 * Useful for progress visualization.
 *
 * @example
 * ```tsx
 * const stepIndex = getPipelineStepIndex('build'); // returns 3
 * ```
 */
export function getPipelineStepIndex(step: PipelineStep): number {
  const steps: PipelineStep[] = [
    "parse",
    "dependencies",
    "upload",
    "build",
    "deploy",
  ];

  return steps.indexOf(step);
}

/**
 * Get pipeline steps array
 *
 * Helper to get all pipeline steps in order.
 * Useful for rendering step indicators.
 *
 * @example
 * ```tsx
 * const steps = getPipelineSteps();
 * // ['parse', 'dependencies', 'upload', 'build', 'deploy']
 * ```
 */
export function getPipelineSteps(): PipelineStep[] {
  return ["parse", "dependencies", "upload", "build", "deploy"];
}
