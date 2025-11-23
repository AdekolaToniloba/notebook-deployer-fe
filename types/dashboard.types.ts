// types/dashboard.types.ts

/**
 * Dashboard Page Types
 *
 * Type definitions for notebooks, deployments, and builds
 */

// ============================================================================
// Notebook Types
// ============================================================================

export type NotebookStatus = "ready" | "processing" | "draft" | "error";

export interface Notebook {
  id: string;
  name: string;
  description: string;
  status: NotebookStatus;
  created_at: string;
  updated_at?: string;
  deployments: number;
}

export interface NotebookListResponse {
  notebooks: Notebook[];
  total: number;
  page: number;
  page_size: number;
}

export interface CreateNotebookRequest {
  name: string;
  description?: string;
  file?: File;
}

// ============================================================================
// Deployment Types
// ============================================================================

export type DeploymentStatus = "active" | "inactive" | "error";

export interface Deployment {
  id: string;
  name: string;
  notebook_id: string;
  notebook: string; // notebook name
  status: DeploymentStatus;
  url: string;
  deployed_at: string;
  traffic: number; // percentage (0-100)
  region?: string;
}

export interface DeploymentListResponse {
  deployments: Deployment[];
  total: number;
}

export interface CreateDeploymentRequest {
  notebook_id: string;
  name: string;
  environment?: Record<string, string>;
}

// ============================================================================
// Build Types
// ============================================================================

export type BuildStatus = "success" | "failed" | "building" | "pending";

export interface Build {
  id: string;
  notebook_id: string;
  notebook: string; // notebook name
  status: BuildStatus;
  duration: string; // e.g., "2m 34s"
  timestamp: string;
  logs?: string;
  error_message?: string;
}

export interface BuildListResponse {
  builds: Build[];
  total: number;
  page: number;
  page_size: number;
}

export interface TriggerBuildRequest {
  notebook_id: string;
}

// ============================================================================
// Status Config Types
// ============================================================================

export interface StatusConfig<T extends string> {
  [key: string]: {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    label: string;
    animate?: boolean;
  };
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
}

export interface FilterParams {
  status?: string;
  search?: string;
}
