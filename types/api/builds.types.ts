// types/api/builds.types.ts

/**
 * Build API Types
 *
 * These types mirror the API responses EXACTLY.
 * They use snake_case and nullable fields as returned by the backend.
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
 * Build Response
 *
 * Full build details from GET /api/v1/builds/{build_id}
 *
 * Corresponds to BuildResponse schema from API docs.
 */
export interface BuildResponse {
  id: number;
  notebook_id: number;
  build_id: string; // Cloud Build ID
  status: string; // "queued" | "building" | "success" | "failed"
  image_name: string; // Docker image URI
  log_url: string | null; // Link to Cloud Build console logs
  error_message: string | null; // Error if failed
  created_at: string; // ISO datetime string
  started_at: string | null; // ISO datetime string
  finished_at: string | null; // ISO datetime string
}

/**
 * Build List Item Response
 *
 * Simplified build info from GET /api/v1/builds
 * and GET /api/v1/builds/notebook/{notebook_id}
 *
 * Corresponds to BuildListResponse schema from API docs.
 */
export interface BuildListItemResponse {
  id: number;
  notebook_id: number;
  build_id: string;
  status: string;
  image_name: string;
  created_at: string; // ISO datetime string
}

/**
 * Build List Response
 *
 * Array of build list items.
 */
export type BuildListResponse = BuildListItemResponse[];

/**
 * Build Trigger Response
 *
 * Response from POST /api/v1/builds/trigger/{notebook_id}
 *
 * Same structure as BuildResponse but build just started.
 */
export type BuildTriggerResponse = BuildResponse;

/**
 * Build Logs Response
 *
 * Response from GET /api/v1/builds/{build_id}/logs
 *
 * Returns plain text, not JSON.
 */
export type BuildLogsResponse = string;

/**
 * Build Refresh Response
 *
 * Response from POST /api/v1/builds/{build_id}/refresh
 *
 * Same structure as BuildResponse with updated status.
 */
export type BuildRefreshResponse = BuildResponse;

/**
 * Build Error Response
 *
 * Error response from build endpoints.
 * Follows FastAPI validation error format.
 */
export interface BuildErrorResponse {
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
 * Build Status Values
 *
 * Valid status values from the API.
 * Used for type narrowing and validation.
 */
export const BUILD_STATUS_VALUES = [
  "queued",
  "building",
  "success",
  "failed",
] as const;

export type BuildStatusValue = (typeof BUILD_STATUS_VALUES)[number];

/**
 * Type guard to check if status is valid
 */
export function isValidBuildStatus(status: string): status is BuildStatusValue {
  return BUILD_STATUS_VALUES.includes(status as BuildStatusValue);
}
