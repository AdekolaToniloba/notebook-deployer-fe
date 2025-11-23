// types/models/pipeline.types.ts

/**
 * Pipeline Domain Models
 *
 * Pipelines represent the one-click deploy workflow.
 * A pipeline orchestrates: parse → dependencies → upload → build → deploy
 *
 * Why separate from builds/deployments?
 * - Pipeline is a workflow, not a single operation
 * - Combines state from notebook, build, and deployment
 * - Tracks progress through multiple steps
 * - Different lifecycle than individual resources
 */

/**
 * Pipeline Status
 *
 * Overall status of the pipeline execution.
 *
 * State transitions:
 * processing → deployed OR failed
 *
 * Why these states?
 * - processing: Pipeline is running (any step in progress)
 * - deployed: All steps complete, service is live
 * - failed: Any step failed, pipeline stopped
 */
export type PipelineStatus = "processing" | "deployed" | "failed";

/**
 * Pipeline Step
 *
 * Individual steps in the deployment pipeline.
 *
 * Execution order:
 * 1. parse - Extract code from .ipynb file
 * 2. dependencies - Analyze and extract dependencies
 * 3. upload - Upload source code to Cloud Storage
 * 4. build - Build Docker image with Cloud Build
 * 5. deploy - Deploy image to Cloud Run
 *
 * Why these steps?
 * - parse: Convert notebook to Python
 * - dependencies: Create requirements.txt
 * - upload: Store source in cloud
 * - build: Create deployable image
 * - deploy: Make it live
 */
export type PipelineStep =
  | "parse"
  | "dependencies"
  | "upload"
  | "build"
  | "deploy";

/**
 * All pipeline steps in order
 *
 * Why array?
 * - Easy to calculate progress
 * - Map over for UI display
 * - Check if step is complete
 */
export const PIPELINE_STEPS: PipelineStep[] = [
  "parse",
  "dependencies",
  "upload",
  "build",
  "deploy",
];

/**
 * Step Display Names
 *
 * User-friendly names for UI.
 */
export const PIPELINE_STEP_LABELS: Record<PipelineStep, string> = {
  parse: "Parsing Notebook",
  dependencies: "Analyzing Dependencies",
  upload: "Uploading Source",
  build: "Building Image",
  deploy: "Deploying Service",
};

/**
 * Step Descriptions
 *
 * What each step does (for UI tooltips).
 */
export const PIPELINE_STEP_DESCRIPTIONS: Record<PipelineStep, string> = {
  parse: "Extracting Python code from Jupyter notebook",
  dependencies: "Identifying required packages and versions",
  upload: "Uploading source code to cloud storage",
  build: "Creating Docker container image",
  deploy: "Deploying container to Cloud Run",
};

/**
 * Main Pipeline Model
 *
 * Represents a single pipeline execution.
 *
 * Why these fields?
 * - pipelineId: Unique identifier for this execution
 * - notebookId: Which notebook is being deployed
 * - buildId/deploymentId: Created resources
 * - currentStep: Where we are now
 * - status: Overall status
 * - stepsCompleted: What's done
 * - errorMessage: What went wrong
 * - Aggregated status: Status from sub-resources
 */
export interface Pipeline {
  pipelineId: string; // e.g., "pipeline-3-1763155678"
  notebookId: number;
  buildId: number | null; // Created during 'build' step
  deploymentId: number | null; // Created during 'deploy' step
  currentStep: PipelineStep;
  status: PipelineStatus;
  stepsCompleted: PipelineStep[];
  errorMessage: string | null;

  // Aggregated status from sub-resources
  notebookStatus: string; // e.g., "parsed", "ready"
  buildStatus: string | null; // e.g., "success", "building"
  deploymentStatus: string | null; // e.g., "deployed", "deploying"
  serviceUrl: string | null; // Final URL if deployed

  createdAt: Date;
}

/**
 * Pipeline Start Request
 *
 * What we send to start a pipeline.
 *
 * Why?
 * - File: The notebook to deploy
 * - Config: Optional deployment configuration
 */
export interface PipelineStartRequest {
  file: File;
  config?: {
    cpu?: string;
    memory?: string;
    minInstances?: number;
    maxInstances?: number;
  };
}

/**
 * Pipeline History Item
 *
 * Simplified view for history list.
 *
 * Why simplified?
 * - Only show essential info in list
 * - Aggregates data from all resources
 * - Easy to scan and find deployments
 */
export interface PipelineHistoryItem {
  notebookId: number;
  notebookName: string;
  notebookStatus: string;
  buildId: number | null;
  buildStatus: string | null;
  deploymentId: number | null;
  deploymentStatus: string | null;
  serviceUrl: string | null;
  createdAt: Date;
}

/**
 * Pipeline History Response
 *
 * Paginated history list.
 */
export interface PipelineHistory {
  total: number;
  pipelines: PipelineHistoryItem[];
}

/**
 * Pipeline Progress
 *
 * Calculated progress information.
 *
 * Why separate type?
 * - Derived from pipeline state
 * - Used by progress bars
 * - Useful for UI components
 */
export interface PipelineProgress {
  percentage: number; // 0-100
  currentStep: PipelineStep;
  currentStepIndex: number; // 0-4
  totalSteps: number; // Always 5
  stepsCompleted: number;
  stepsRemaining: number;
  isComplete: boolean;
  isFailed: boolean;
}

/**
 * Calculate pipeline progress
 *
 * Why function?
 * - Reusable calculation logic
 * - Used in hooks and components
 * - Consistent progress calculation
 */
export function calculatePipelineProgress(
  pipeline: Pipeline
): PipelineProgress {
  const totalSteps = PIPELINE_STEPS.length;
  const stepsCompleted = pipeline.stepsCompleted.length;
  const currentStepIndex = PIPELINE_STEPS.indexOf(pipeline.currentStep);

  // Calculate percentage (completed steps + 50% for current step if processing)
  let percentage = (stepsCompleted / totalSteps) * 100;
  if (pipeline.status === "processing" && currentStepIndex >= 0) {
    percentage = ((stepsCompleted + 0.5) / totalSteps) * 100;
  }

  return {
    percentage: Math.min(Math.round(percentage), 100),
    currentStep: pipeline.currentStep,
    currentStepIndex,
    totalSteps,
    stepsCompleted,
    stepsRemaining: totalSteps - stepsCompleted,
    isComplete: pipeline.status === "deployed",
    isFailed: pipeline.status === "failed",
  };
}

/**
 * Pipeline Error
 *
 * Detailed error information.
 *
 * Why?
 * - Need to know which step failed
 * - Show user-friendly message
 * - Provide recovery suggestions
 */
export interface PipelineError {
  pipelineId: string;
  failedStep: PipelineStep;
  errorMessage: string;
  technicalDetails?: string;
  suggestedAction: string;
  canRetry: boolean;
}

/**
 * Get error suggestions based on failed step
 *
 * Why function?
 * - Provides helpful error messages
 * - Guides user to fix issues
 * - Better UX than generic errors
 */
export function getPipelineErrorSuggestion(
  step: PipelineStep,
  error: string
): string {
  const suggestions: Record<PipelineStep, string> = {
    parse:
      "Check that your notebook file is valid. Make sure all cells can run without errors.",
    dependencies:
      "Verify all imports in your notebook are correct. Some packages might not be available.",
    upload:
      "This is usually a temporary issue. Try deploying again in a moment.",
    build:
      "Your notebook code has errors. Check the build logs for details about what went wrong.",
    deploy:
      "Deployment configuration might be invalid. Try reducing resource requirements (CPU/memory).",
  };

  return suggestions[step];
}

/**
 * Pipeline Filter Options
 */
export interface PipelineFilters {
  status?: PipelineStatus[];
  notebookId?: number;
  searchQuery?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: "created" | "notebook" | "status";
  sortOrder?: "asc" | "desc";
}

/**
 * Pipeline Pagination
 */
export interface PipelinePagination {
  skip: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

/**
 * UI-Specific Types
 */

/**
 * Pipeline with UI State
 */
export interface PipelineWithUIState extends Pipeline {
  isPolling?: boolean; // Currently polling for status
  isCanceling?: boolean; // Attempting to cancel
}

/**
 * Pipeline Action Types
 */
export type PipelineAction =
  | "viewNotebook" // Go to notebook detail
  | "viewBuild" // Go to build detail (if buildId exists)
  | "viewDeployment" // Go to deployment detail (if deploymentId exists)
  | "viewLogs" // View logs for failed step
  | "retry" // Retry failed pipeline
  | "cancel"; // Cancel running pipeline (if supported)

/**
 * Pipeline Step Status
 *
 * Status of an individual step (for detailed progress view).
 *
 * Why?
 * - Show status for each step
 * - Pending → Running → Complete OR Failed
 * - Visual feedback in stepper component
 */
export type PipelineStepStatus = "pending" | "running" | "complete" | "failed";

/**
 * Pipeline Step Detail
 *
 * Detailed information about a step's execution.
 *
 * Why?
 * - Show in detailed progress view
 * - Track timing per step
 * - Help with debugging
 */
export interface PipelineStepDetail {
  step: PipelineStep;
  status: PipelineStepStatus;
  startedAt: Date | null;
  completedAt: Date | null;
  duration: number | null; // seconds
  errorMessage: string | null;
}

/**
 * Get step status from pipeline
 *
 * Determines the status of each step based on pipeline state.
 *
 * Why function?
 * - Reusable logic
 * - Consistent status determination
 * - Used by progress components
 */
export function getPipelineStepStatus(
  step: PipelineStep,
  pipeline: Pipeline
): PipelineStepStatus {
  // If step is completed
  if (pipeline.stepsCompleted.includes(step)) {
    return "complete";
  }

  // If this is the current step
  if (pipeline.currentStep === step) {
    // Check if pipeline failed on this step
    if (pipeline.status === "failed") {
      return "failed";
    }
    return "running";
  }

  // Check if step comes after current step (pending)
  const currentIndex = PIPELINE_STEPS.indexOf(pipeline.currentStep);
  const stepIndex = PIPELINE_STEPS.indexOf(step);

  if (stepIndex > currentIndex) {
    return "pending";
  }

  // Shouldn't reach here, but default to pending
  return "pending";
}

/**
 * Pipeline Statistics
 *
 * Aggregated statistics for dashboard.
 */
export interface PipelineStatistics {
  totalPipelines: number;
  successfulPipelines: number;
  failedPipelines: number;
  averageDuration: number; // seconds
  successRate: number; // percentage (0-100)
  mostCommonFailureStep: PipelineStep | null;
}

/**
 * Estimated time remaining
 *
 * Based on average step times.
 *
 * Why?
 * - Set user expectations
 * - "About 3 minutes remaining"
 * - Better UX than indefinite wait
 */
export interface PipelineEstimate {
  remainingSteps: PipelineStep[];
  estimatedSeconds: number;
  estimatedMinutes: number;
}

/**
 * Average step durations
 *
 * Rough estimates for progress indication.
 * Actual times vary by notebook size and complexity.
 */
export const AVERAGE_STEP_DURATIONS: Record<PipelineStep, number> = {
  parse: 10, // 10 seconds
  dependencies: 5, // 5 seconds
  upload: 15, // 15 seconds
  build: 120, // 2 minutes (can be much longer)
  deploy: 60, // 1 minute
};

/**
 * Calculate estimated time remaining
 */
export function estimatePipelineTimeRemaining(
  pipeline: Pipeline
): PipelineEstimate {
  const currentIndex = PIPELINE_STEPS.indexOf(pipeline.currentStep);
  const remainingSteps = PIPELINE_STEPS.slice(currentIndex + 1);

  const estimatedSeconds = remainingSteps.reduce(
    (total, step) => total + AVERAGE_STEP_DURATIONS[step],
    0
  );

  return {
    remainingSteps,
    estimatedSeconds,
    estimatedMinutes: Math.ceil(estimatedSeconds / 60),
  };
}
