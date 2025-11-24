// lib/api/services/deployments.service.ts

import getApiClient from "@/lib/api/client";
import {
  deploymentResponseSchema,
  deploymentListResponseSchema,
  trafficUpdateRequestSchema,
} from "@/lib/validations/deployment.schemas";
import type {
  Deployment,
  DeploymentListItem,
  DeploymentConfig,
  TrafficConfig,
  DeploymentStatus,
} from "@/types/models/deployment.types";
import type {
  DeploymentResponse,
  DeploymentListItemResponse,
  TrafficUpdateRequest,
} from "@/types/api/deployments.types";

export interface DeploymentDetailResponse {
  id: number;
  notebook_id: number;
  user_id: number;
  name: string;
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

class DeploymentService {
  async createDeployment(params: {
    notebookId: number;
    config: Partial<DeploymentConfig>; // This now includes name/region
  }): Promise<Deployment> {
    const api = getApiClient();

    // The One-Click endpoint expects a specific body structure based on Swagger
    // Body: { notebook_id: 0, name: "string", region: "string" }
    const payload = {
      notebook_id: params.notebookId,
      name: params.config.name,
      region: params.config.region || "us-central1",
    };

    // FIX: Use specific one-click endpoint, NO trailing slash
    const response = await api.post<DeploymentResponse>(
      "/api/v1/deployments/one-click",
      payload
    );

    return this.transformToDeployment(response.data);
  }

  /**
   * Get deployment details
   */
  async getDeployment(deploymentId: number): Promise<DeploymentDetailResponse> {
    const api = getApiClient();
    const response = await api.get<DeploymentDetailResponse>(
      `/api/v1/deployments/${deploymentId}`
    );
    return response.data;
  }

  /**
   * Delete deployment
   */
  async deleteDeployment(deploymentId: number): Promise<void> {
    const api = getApiClient();
    await api.delete(`/api/v1/deployments/${deploymentId}`);
  }

  /**
   * Download deployment artifacts
   */
  async downloadDeployment(deploymentId: number): Promise<string> {
    const api = getApiClient();
    const response = await api.get<string>(
      `/api/v1/deployments/${deploymentId}/download`
    );
    return response.data;
  }

  /**
   * Reload model for deployment
   */
  async reloadModel(deploymentId: number): Promise<string> {
    const api = getApiClient();
    const response = await api.post<string>(
      `/api/v1/deployments/${deploymentId}/reload-model`
    );
    return response.data;
  }

  // List Deployments
  async listDeployments(): Promise<DeploymentListItem[]> {
    const api = getApiClient();

    const response = await api.get<DeploymentListItemResponse[]>(
      "/api/v1/deployments/"
    );

    // Validate response
    const validated = deploymentListResponseSchema.parse(response.data);

    // Transform each item
    return validated.map((item) => this.transformToDeploymentListItem(item));
  }

  async listNotebookDeployments(
    notebookId: number
  ): Promise<DeploymentListItem[]> {
    const api = getApiClient();

    const response = await api.get<DeploymentListItemResponse[]>(
      `/api/v1/deployments/notebook/${notebookId}`
    );

    // Validate response
    const validated = deploymentListResponseSchema.parse(response.data);

    // Transform each item
    return validated.map((item) => this.transformToDeploymentListItem(item));
  }

  async updateTraffic(
    deploymentId: number,
    config: TrafficConfig
  ): Promise<Deployment> {
    const api = getApiClient();

    // Build request body (API expects snake_case)
    const requestBody: TrafficUpdateRequest = {
      revision_name: config.revisionName,
      traffic_percent: config.trafficPercent,
    };

    // Validate request body
    const validatedRequest = trafficUpdateRequestSchema.parse(requestBody);

    const response = await api.post<DeploymentResponse>(
      `/api/v1/deployments/${deploymentId}/traffic`,
      validatedRequest
    );

    // Validate response
    const validated = deploymentResponseSchema.parse(response.data);

    // Transform to domain model
    return this.transformToDeployment(validated);
  }

  /**
   * Rollback deployment to a previous revision
   *
   * @param deploymentId - ID of the deployment
   * @param revisionName - Revision to rollback to
   * @returns Updated deployment
   *
   * POST /api/v1/deployments/{deployment_id}/rollback
   *
   * Why rollback?
   * - New version has bugs
   * - Performance issues
   * - Quick recovery from issues
   * - Zero-downtime rollback
   *
   * How it works:
   * - Routes 100% traffic to specified revision
   * - No need to redeploy
   * - Instant rollback
   */
  async rollback(
    deploymentId: number,
    revisionName: string
  ): Promise<Deployment> {
    const api = getApiClient();

    // Build URL with query parameter
    const url = `/api/v1/deployments/${deploymentId}/rollback?revision_name=${encodeURIComponent(
      revisionName
    )}`;

    const response = await api.post<DeploymentResponse>(url);

    // Validate response
    const validated = deploymentResponseSchema.parse(response.data);

    // Transform to domain model
    return this.transformToDeployment(validated);
  }

  /**
   * Transform API response to Deployment domain model
   *
   * Why transform?
   * - API uses snake_case (Python convention)
   * - Domain uses camelCase (JavaScript convention)
   * - API has string dates, domain has Date objects
   * - Clean separation between API and application
   *
   * @param data - Validated API response
   * @returns Deployment domain model
   */
  private transformToDeployment(data: DeploymentResponse): Deployment {
    return {
      id: data.id,
      notebookId: data.notebook_id,
      buildId: data.build_id,
      serviceName: data.service_name,
      serviceUrl: data.service_url,
      revisionName: data.revision_name,
      status: data.status as Deployment["status"], // Type assertion - validated by schema
      imageUri: data.image_uri,
      trafficPercent: data.traffic_percent,
      errorMessage: data.error_message,
      createdAt: new Date(data.created_at),
      deployedAt: data.deployed_at ? new Date(data.deployed_at) : null,
    };
  }

  /**
   * Transform API response to DeploymentListItem
   *
   * Why separate type?
   * - List items have fewer fields (performance)
   * - Only essential info for display
   * - Full details loaded on demand
   *
   * @param data - Validated API response
   * @returns DeploymentListItem domain model
   */
  private transformToDeploymentListItem(
    data: DeploymentListItemResponse // Ensure this type matches the schema above
  ): DeploymentListItem {
    return {
      id: data.id,
      notebookId: data.notebook_id,

      serviceName: data.name,
      serviceUrl: data.service_url,
      status: data.status as DeploymentStatus,
      errorMessage: data.error_message,
      createdAt: new Date(data.created_at),
    };
  }

  /**
   * Get user-friendly error message for deployment errors
   *
   * Why custom errors?
   * - API errors are technical
   * - Users need actionable messages
   * - Better UX
   *
   * @param error - Error from API call
   * @param action - What action was being performed
   * @returns User-friendly error message
   */
  getUserFriendlyError(error: unknown, action: string): string {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      // Network errors
      if (message.includes("network") || message.includes("fetch")) {
        return "Network error. Please check your connection and try again.";
      }

      // Authentication errors
      if (message.includes("401") || message.includes("unauthorized")) {
        return "Your session has expired. Please log in again.";
      }

      // Permission errors
      if (message.includes("403") || message.includes("forbidden")) {
        return "You don't have permission to perform this action.";
      }

      // Not found errors
      if (message.includes("404") || message.includes("not found")) {
        return "Deployment not found. It may have been deleted.";
      }

      // Validation errors
      if (message.includes("422") || message.includes("validation")) {
        return "Invalid deployment configuration. Please check your settings.";
      }

      // Quota errors
      if (message.includes("quota") || message.includes("limit")) {
        return "Deployment quota exceeded. Please try again later or contact support.";
      }

      // Resource errors
      if (message.includes("resource") || message.includes("capacity")) {
        return "Insufficient resources. Try reducing CPU/memory requirements.";
      }

      // Image errors
      if (message.includes("image")) {
        return "Docker image not found. Please build the notebook first.";
      }

      // Deployment errors
      if (message.includes("deployment failed")) {
        return "Deployment failed. Please check your configuration and try again.";
      }

      // Server errors
      if (message.includes("500") || message.includes("server")) {
        return "Server error. Please try again later.";
      }
    }

    // Default error messages for different actions
    const actionMessages: Record<string, string> = {
      create: "Failed to create deployment. Please try again.",
      fetch: "Failed to load deployment details. Please refresh the page.",
      list: "Failed to load deployments. Please refresh the page.",
      traffic: "Failed to update traffic. Please try again.",
      rollback: "Failed to rollback deployment. Please try again.",
    };

    return (
      actionMessages[action] ||
      `Failed to ${action} deployment. Please try again.`
    );
  }
}

/**
 * Export singleton instance
 *
 * Why singleton?
 * - No state to manage (stateless service)
 * - Consistent API client usage
 * - Easy to import and use
 */
export const deploymentService = new DeploymentService();

/**
 * Usage Examples:
 *
 * // Create a deployment
 * const deployment = await deploymentService.createDeployment({
 *   notebookId: 1,
 *   buildId: 5,
 *   config: {
 *     cpu: '2',
 *     memory: '1Gi',
 *     minInstances: 0,
 *     maxInstances: 10,
 *   }
 * });
 * console.log(`Deployed at: ${deployment.serviceUrl}`);
 *
 * // Get deployment status
 * const deployment = await deploymentService.getDeployment(deploymentId);
 * if (deployment.status === 'deployed') {
 *   console.log('Service is live!');
 * }
 *
 * // List all deployments
 * const deployments = await deploymentService.listDeployments();
 * console.log(`You have ${deployments.length} active deployments`);
 *
 * // Update traffic (gradual rollout)
 * const updated = await deploymentService.updateTraffic(deploymentId, {
 *   revisionName: 'notebook-1-1-00002-abc',
 *   trafficPercent: 10, // Route 10% traffic to new version
 * });
 *
 * // Rollback to previous version
 * const rolledBack = await deploymentService.rollback(
 *   deploymentId,
 *   'notebook-1-1-00001-xyz' // Previous revision
 * );
 * console.log('Rolled back successfully');
 */
