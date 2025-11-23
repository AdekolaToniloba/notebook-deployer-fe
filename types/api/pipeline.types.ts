// types/api/pipeline.types.ts

/**
 * Pipeline API Types
 *
 * These types mirror the API responses EXACTLY.
 * They use snake_case and nullable fields as returned by the backend.
 *
 * Pipeline = One-Click Deploy workflow
 * Orchestrates: upload → parse → build → deploy
 *
 * Why separate from domain models?
 * - API uses Python conventions (snake_case)
 * - API has nullable fields
 * - Domain models use JavaScript conventions (camelCase)
 * - We transform API types → domain models in service layer
 *
 * Important: These must match the backend schema exactly!
 */

/**
 * Pipeline Deploy Response
 *
 * Initial response from POST /api/v1/pipeline/deploy
 *
 * This is what we get immediately after starting a pipeline.
 * Use pipeline_id to poll for status.
 *
 * Corresponds to PipelineResponse schema from API docs.
 */
export interface PipelineDeployResponse {
  pipeline_id: string; // Unique pipeline execution ID
  notebook_id: number; // Created notebook ID
  status: string; // "processing" initially
  message: string; // "Pipeline started. Use /pipeline/status/{pipeline_id} to track progress."
}

/**
 * Pipeline Status Response
 *
 * Detailed status from GET /api/v1/pipeline/status/{pipeline_id}
 *
 * This gives us complete state of the pipeline execution.
 * Poll this endpoint until status is "deployed" or "failed".
 *
 * The response is returned as a string (JSON stringified),
 * so we need to parse it.
 */
export interface PipelineStatusResponse {
  pipeline_id: string;
  notebook_id: number;
  build_id: number | null; // Created during build step
  deployment_id: number | null; // Created during deploy step
  current_step: string; // "parse" | "dependencies" | "upload" | "build" | "deploy"
  status: string; // "processing" | "deployed" | "failed"
  steps_completed: string[]; // Array of completed step names
  error_message: string | null; // Error if failed

  // Aggregated status from sub-resources
  notebook_status: string; // e.g., "parsed", "ready"
  build_status: string | null; // e.g., "success", "building", null if not started
  deployment_status: string | null; // e.g., "deployed", "deploying", null if not started
  service_url: string | null; // Final URL if deployed
}

/**
 * Pipeline History Item Response
 *
 * Single item from pipeline history.
 * Part of PipelineHistoryResponse.
 */
export interface PipelineHistoryItemResponse {
  notebook_id: number;
  notebook_name: string;
  notebook_status: string;
  build_id: number | null;
  build_status: string | null;
  deployment_id: number | null;
  deployment_status: string | null;
  service_url: string | null;
  created_at: string; // ISO datetime string
}

/**
 * Pipeline History Response
 *
 * Response from GET /api/v1/pipeline/history
 *
 * The response is returned as a string (JSON stringified),
 * so we need to parse it.
 */
export interface PipelineHistoryResponse {
  total: number; // Total number of pipeline executions
  pipelines: PipelineHistoryItemResponse[];
}

/**
 * Pipeline Deploy Query Parameters
 *
 * Query parameters for POST /api/v1/pipeline/deploy
 *
 * These are sent as URL query params, not in body.
 * Body only contains the file (multipart/form-data).
 */
export interface PipelineDeployParams {
  cpu?: string; // Default: "1"
  memory?: string; // Default: "512Mi"
  min_instances?: number; // Default: 0
  max_instances?: number; // Default: 10
}

/**
 * Pipeline History Query Parameters
 *
 * Query parameters for GET /api/v1/pipeline/history
 */
export interface PipelineHistoryParams {
  skip?: number; // Default: 0
  limit?: number; // Default: 20
}

/**
 * Pipeline Error Response
 *
 * Error response from pipeline endpoints.
 */
export interface PipelineErrorResponse {
  detail: string | ValidationError[];
}

/**
 * Validation Error
 *
 * FastAPI validation error structure.
 */
export interface ValidationError {
  loc: (string | number)[]; // Location of error
  msg: string; // Error message
  type: string; // Error type
}

/**
 * Pipeline Status Values
 *
 * Valid status values from the API.
 */
export const PIPELINE_STATUS_VALUES = [
  "processing",
  "deployed",
  "failed",
] as const;

export type PipelineStatusValue = (typeof PIPELINE_STATUS_VALUES)[number];

/**
 * Pipeline Step Values
 *
 * Valid step values from the API.
 */
export const PIPELINE_STEP_VALUES = [
  "parse",
  "dependencies",
  "upload",
  "build",
  "deploy",
] as const;

export type PipelineStepValue = (typeof PIPELINE_STEP_VALUES)[number];

/**
 * Type guards
 */
export function isValidPipelineStatus(
  status: string
): status is PipelineStatusValue {
  return PIPELINE_STATUS_VALUES.includes(status as PipelineStatusValue);
}

export function isValidPipelineStep(step: string): step is PipelineStepValue {
  return PIPELINE_STEP_VALUES.includes(step as PipelineStepValue);
}

/**
 * Form Data for Pipeline Deploy
 *
 * Helper type for building FormData.
 * Not sent directly, but used to construct the request.
 */
export interface PipelineDeployFormData {
  file: File; // The .ipynb file
  // Query params (appended to URL)
  cpu?: string;
  memory?: string;
  min_instances?: number;
  max_instances?: number;
}
