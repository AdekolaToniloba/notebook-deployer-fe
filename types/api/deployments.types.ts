// types/api/deployments.types.ts

/**
 * Deployment API Types
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
 * Deployment Response
 *
 * Full deployment details from GET /api/v1/deployments/{deployment_id}
 *
 * Corresponds to DeploymentResponse schema from API docs.
 */
export interface DeploymentResponse {
  id: number;
  notebook_id: number;
  build_id: number | null; // Can be null
  service_name: string; // Cloud Run service name
  service_url: string | null; // Public URL (null until deployed)
  revision_name: string | null; // Cloud Run revision
  status: string; // "deploying" | "deployed" | "failed" | "updating"
  image_uri: string; // Docker image being deployed
  traffic_percent: number; // 0-100
  error_message: string | null; // Error if failed
  created_at: string; // ISO datetime string
  deployed_at: string | null; // ISO datetime string
}

/**
 * Deployment List Item Response
 *
 * Simplified deployment info from GET /api/v1/deployments
 * and GET /api/v1/deployments/notebook/{notebook_id}
 *
 * Corresponds to DeploymentListResponse schema from API docs.
 */
export interface DeploymentListItemResponse {
  id: number;
  notebook_id: number;
  user_id: number;
  name: string; // FIX: changed from service_name
  status: string;
  build_id: string | null;
  image_url: string | null;
  service_url: string | null;
  region: string;
  error_message: string | null;
  build_logs_url: string | null;
  created_at: string;
  updated_at: string | null;
  deployed_at: string | null;
}

/**
 * Deployment List Response
 *
 * Array of deployment list items.
 */
export type DeploymentListResponse = DeploymentListItemResponse[];

/**
 * Deployment Create Request
 *
 * Request body for POST /api/v1/deployments
 *
 * Corresponds to DeploymentCreate schema from API docs.
 */
export interface DeploymentCreateRequest {
  notebook_id: number;
  build_id: number | null; // Optional
  cpu?: string; // Default: "1"
  memory?: string; // Default: "512Mi"
  min_instances?: number; // Default: 0
  max_instances?: number; // Default: 10
}

/**
 * Deployment Create Response
 *
 * Response from POST /api/v1/deployments
 *
 * Same structure as DeploymentResponse.
 */
export type DeploymentCreateResponse = DeploymentResponse;

/**
 * Traffic Update Request
 *
 * Request body for POST /api/v1/deployments/{deployment_id}/traffic
 */
export interface TrafficUpdateRequest {
  revision_name: string; // Which revision to route to
  traffic_percent: number; // 0-100
}

/**
 * Traffic Update Response
 *
 * Response from POST /api/v1/deployments/{deployment_id}/traffic
 *
 * Same structure as DeploymentResponse with updated traffic.
 */
export type TrafficUpdateResponse = DeploymentResponse;

/**
 * Rollback Response
 *
 * Response from POST /api/v1/deployments/{deployment_id}/rollback
 *
 * Same structure as DeploymentResponse.
 */
export type RollbackResponse = DeploymentResponse;

/**
 * Deployment Error Response
 *
 * Error response from deployment endpoints.
 */
export interface DeploymentErrorResponse {
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
 * Deployment Status Values
 *
 * Valid status values from the API.
 */
export const DEPLOYMENT_STATUS_VALUES = [
  "deploying",
  "deployed",
  "failed",
  "updating",
] as const;

export type DeploymentStatusValue = (typeof DEPLOYMENT_STATUS_VALUES)[number];

/**
 * Type guard to check if status is valid
 */
export function isValidDeploymentStatus(
  status: string
): status is DeploymentStatusValue {
  return DEPLOYMENT_STATUS_VALUES.includes(status as DeploymentStatusValue);
}

/**
 * CPU Options
 *
 * Valid CPU values for API requests.
 */
export const API_CPU_VALUES = ["1", "2", "4"] as const;
export type ApiCpuValue = (typeof API_CPU_VALUES)[number];

/**
 * Memory Options
 *
 * Valid memory values for API requests.
 */
export const API_MEMORY_VALUES = ["512Mi", "1Gi", "2Gi", "4Gi", "8Gi"] as const;
export type ApiMemoryValue = (typeof API_MEMORY_VALUES)[number];

/**
 * Deployment Configuration for API
 *
 * Configuration object for creating deployments.
 * Uses API field names (snake_case).
 */
export interface DeploymentConfigApi {
  cpu: ApiCpuValue;
  memory: ApiMemoryValue;
  min_instances: number;
  max_instances: number;
}

/**
 * Default configuration values
 *
 * Used when user doesn't specify configuration.
 */
export const DEFAULT_DEPLOYMENT_CONFIG_API: DeploymentConfigApi = {
  cpu: "1",
  memory: "512Mi",
  min_instances: 0,
  max_instances: 10,
};
