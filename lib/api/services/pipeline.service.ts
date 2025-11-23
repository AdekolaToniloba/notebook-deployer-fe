// lib/api/services/pipeline.service.ts

import {
  pipelineDeployResponseSchema,
  pipelineStatusResponseSchema,
  pipelineHistoryResponseSchema,
} from "@/lib/validations/deployment.schemas";
import type {
  Pipeline,
  PipelineHistoryItem,
  PipelineHistory,
} from "@/types/models/pipeline.types";
import type { DeploymentConfig } from "@/types/models/deployment.types";
import type {
  PipelineDeployResponse,
  PipelineStatusResponse,
  PipelineHistoryResponse,
} from "@/types/api/pipeline.types";

/**
 * Pipeline Service
 *
 * Handles the one-click deploy workflow (Pipeline API).
 *
 * Why separate from build/deployment services?
 * - Pipeline orchestrates multiple services
 * - Different API patterns (file upload, polling)
 * - Workflow-specific logic
 * - Simpler interface for users
 *
 * Pipeline Flow:
 * 1. Upload notebook file + config
 * 2. Backend automatically: parse → dependencies → build → deploy
 * 3. Poll for status updates
 * 4. Get final result (service URL or error)
 *
 * Security considerations:
 * - Manual token management (uses fetch, not axios)
 * - Validates all responses with Zod
 * - Proper FormData handling
 * - No sensitive data in logs
 *
 * API Endpoints:
 * - POST /api/v1/pipeline/deploy - Start one-click deploy
 * - GET /api/v1/pipeline/status/{pipeline_id} - Poll for status
 * - GET /api/v1/pipeline/history - Get deployment history
 */

class PipelineService {
  /**
   * One-click deploy: Upload notebook and automatically build & deploy
   *
   * @param file - The .ipynb file to deploy
   * @param config - Optional deployment configuration
   * @returns Pipeline ID and initial status
   *
   * POST /api/v1/pipeline/deploy
   *
   * Why one-click deploy?
   * - Simplest way to get notebook live
   * - No manual steps required
   * - Backend handles everything
   * - Perfect for most users
   *
   * Flow:
   * 1. Upload .ipynb file with config
   * 2. Get pipeline_id
   * 3. Poll /pipeline/status/{pipeline_id} for updates
   * 4. Complete when status is 'deployed' or 'failed'
   *
   * Important: Use fetch, not axios, for FormData uploads
   */
  async oneClickDeploy(
    file: File,
    config?: Partial<DeploymentConfig>
  ): Promise<{ pipelineId: string; notebookId: number }> {
    // Build FormData
    const formData = new FormData();
    formData.append("file", file);

    // Build query parameters for config
    // API expects these as query params, not in FormData
    const params = new URLSearchParams();
    if (config?.cpu) params.append("cpu", config.cpu);
    if (config?.memory) params.append("memory", config.memory);
    if (config?.minInstances !== undefined) {
      params.append("min_instances", String(config.minInstances));
    }
    if (config?.maxInstances !== undefined) {
      params.append("max_instances", String(config.maxInstances));
    }

    // Get auth token
    const token =
      typeof window !== "undefined"
        ? (
            await import("@/lib/auth/token-manager")
          ).tokenManager.getAccessToken()
        : null;

    const baseURL = process.env.NEXT_PUBLIC_API_URL || "";

    // Use fetch instead of axios for FormData uploads
    // Axios can have issues with Content-Type boundaries
    const url = `${baseURL}/api/v1/pipeline/deploy${
      params.toString() ? `?${params.toString()}` : ""
    }`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        // DO NOT set Content-Type - let browser set it with boundary
      },
      body: formData,
    });

    // Handle non-OK responses
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Deploy failed" }));
      throw new Error(
        errorData.message || `Deploy failed with status ${response.status}`
      );
    }

    const data = await response.json();

    // Validate response with Zod
    const validated = pipelineDeployResponseSchema.parse(data);

    return {
      pipelineId: validated.pipeline_id,
      notebookId: validated.notebook_id,
    };
  }

  /**
   * Get pipeline execution status
   *
   * @param pipelineId - Pipeline execution ID
   * @returns Current pipeline state
   *
   * GET /api/v1/pipeline/status/{pipeline_id}
   *
   * Why poll for status?
   * - Pipeline takes 3-5 minutes to complete
   * - Need to show progress to user
   * - Get final result (URL or error)
   *
   * Polling strategy:
   * - Poll every 5-10 seconds
   * - Stop when status is 'deployed' or 'failed'
   * - Show progress based on steps_completed
   *
   * IMPORTANT: API returns JSON string, not object!
   * Need to parse the string first, then validate.
   */
  async getPipelineStatus(pipelineId: string): Promise<Pipeline> {
    const token =
      typeof window !== "undefined"
        ? (
            await import("@/lib/auth/token-manager")
          ).tokenManager.getAccessToken()
        : null;

    const baseURL = process.env.NEXT_PUBLIC_API_URL || "";

    const response = await fetch(
      `${baseURL}/api/v1/pipeline/status/${pipelineId}`,
      {
        method: "GET",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Failed to get status" }));
      throw new Error(
        errorData.message || `Status check failed with ${response.status}`
      );
    }

    // API returns a JSON string, not a direct object
    const text = await response.text();

    // Parse the JSON string
    const data = JSON.parse(text) as PipelineStatusResponse;

    // Validate with Zod
    const validated = pipelineStatusResponseSchema.parse(data);

    // Transform to domain model
    return this.transformToPipeline(validated);
  }

  /**
   * Get pipeline execution history
   *
   * @param pagination - Skip and limit parameters
   * @returns Pipeline history with pagination
   *
   * GET /api/v1/pipeline/history
   *
   * Why history?
   * - See past deployments
   * - Track success rate
   * - Find previous versions
   * - Debug failed deployments
   *
   * IMPORTANT: API returns JSON string, not object!
   */
  async getPipelineHistory(params?: {
    skip?: number;
    limit?: number;
  }): Promise<PipelineHistory> {
    const { skip = 0, limit = 20 } = params || {};

    const token =
      typeof window !== "undefined"
        ? (
            await import("@/lib/auth/token-manager")
          ).tokenManager.getAccessToken()
        : null;

    const baseURL = process.env.NEXT_PUBLIC_API_URL || "";

    const queryParams = new URLSearchParams({
      skip: String(skip),
      limit: String(limit),
    });

    const response = await fetch(
      `${baseURL}/api/v1/pipeline/history?${queryParams}`,
      {
        method: "GET",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Failed to get history" }));
      throw new Error(
        errorData.message || `History fetch failed with ${response.status}`
      );
    }

    // API returns a JSON string, not a direct object
    const text = await response.text();

    // Parse the JSON string
    const data = JSON.parse(text) as PipelineHistoryResponse;

    // Validate with Zod
    const validated = pipelineHistoryResponseSchema.parse(data);

    // Transform to domain model
    return {
      total: validated.total,
      pipelines: validated.pipelines.map((item) =>
        this.transformToPipelineHistoryItem(item)
      ),
    };
  }

  /**
   * Transform API response to Pipeline domain model
   *
   * Why transform?
   * - API uses snake_case (Python convention)
   * - Domain uses camelCase (JavaScript convention)
   * - Clean separation between API and application
   * - Type safety
   *
   * @param data - Validated API response
   * @returns Pipeline domain model
   */
  private transformToPipeline(data: PipelineStatusResponse): Pipeline {
    return {
      pipelineId: data.pipeline_id,
      notebookId: data.notebook_id,
      buildId: data.build_id,
      deploymentId: data.deployment_id,
      currentStep: data.current_step as Pipeline["currentStep"], // Type assertion
      status: data.status as Pipeline["status"], // Type assertion
      stepsCompleted: data.steps_completed as Pipeline["stepsCompleted"], // Type assertion
      errorMessage: data.error_message,
      notebookStatus: data.notebook_status,
      buildStatus: data.build_status,
      deploymentStatus: data.deployment_status,
      serviceUrl: data.service_url,
      createdAt: new Date(), // API doesn't return created_at in status
    };
  }

  /**
   * Transform API response to PipelineHistoryItem
   *
   * @param data - Validated API response item
   * @returns PipelineHistoryItem domain model
   */
  private transformToPipelineHistoryItem(
    data: PipelineHistoryResponse["pipelines"][0]
  ): PipelineHistoryItem {
    return {
      notebookId: data.notebook_id,
      notebookName: data.notebook_name,
      notebookStatus: data.notebook_status,
      buildId: data.build_id,
      buildStatus: data.build_status,
      deploymentId: data.deployment_id,
      deploymentStatus: data.deployment_status,
      serviceUrl: data.service_url,
      createdAt: new Date(data.created_at),
    };
  }

  /**
   * Get user-friendly error message for pipeline errors
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
        return "You don't have permission to deploy notebooks.";
      }

      // Validation errors
      if (message.includes("422") || message.includes("validation")) {
        return "Invalid notebook or configuration. Please check your file and settings.";
      }

      // File too large
      if (message.includes("413") || message.includes("too large")) {
        return "File is too large. Maximum size is 10MB.";
      }

      // Quota errors
      if (message.includes("quota") || message.includes("limit")) {
        return "Deployment quota exceeded. Please try again later.";
      }

      // Pipeline errors
      if (message.includes("pipeline failed")) {
        return "Deployment pipeline failed. Please check the logs for details.";
      }

      // Server errors
      if (message.includes("500") || message.includes("server")) {
        return "Server error. Please try again later.";
      }
    }

    // Default error messages for different actions
    const actionMessages: Record<string, string> = {
      deploy: "Failed to start deployment. Please try again.",
      status: "Failed to check deployment status. Please refresh.",
      history: "Failed to load deployment history. Please refresh the page.",
    };

    return actionMessages[action] || `Failed to ${action}. Please try again.`;
  }
}

/**
 * Export singleton instance
 *
 * Why singleton?
 * - No state to manage (stateless service)
 * - Consistent usage pattern
 * - Easy to import and use
 */
export const pipelineService = new PipelineService();

/**
 * Usage Examples:
 *
 * // One-click deploy
 * const { pipelineId, notebookId } = await pipelineService.oneClickDeploy(
 *   file,
 *   {
 *     cpu: '2',
 *     memory: '1Gi',
 *     minInstances: 0,
 *     maxInstances: 10,
 *   }
 * );
 * console.log(`Pipeline ${pipelineId} started for notebook ${notebookId}`);
 *
 * // Poll for status
 * const pollStatus = async (pipelineId: string) => {
 *   const pipeline = await pipelineService.getPipelineStatus(pipelineId);
 *
 *   console.log(`Current step: ${pipeline.currentStep}`);
 *   console.log(`Status: ${pipeline.status}`);
 *   console.log(`Steps completed: ${pipeline.stepsCompleted.join(', ')}`);
 *
 *   if (pipeline.status === 'deployed') {
 *     console.log(`Deployed at: ${pipeline.serviceUrl}`);
 *     return pipeline;
 *   } else if (pipeline.status === 'failed') {
 *     console.error(`Failed: ${pipeline.errorMessage}`);
 *     return pipeline;
 *   } else {
 *     // Still processing, poll again
 *     setTimeout(() => pollStatus(pipelineId), 5000);
 *   }
 * };
 *
 * pollStatus(pipelineId);
 *
 * // Get history
 * const history = await pipelineService.getPipelineHistory({
 *   skip: 0,
 *   limit: 20,
 * });
 * console.log(`Total deployments: ${history.total}`);
 * history.pipelines.forEach(p => {
 *   console.log(`${p.notebookName}: ${p.deploymentStatus}`);
 * });
 */
