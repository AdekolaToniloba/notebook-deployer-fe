// lib/api/services/builds.service.ts

import getApiClient from "@/lib/api/client";
import {
  buildResponseSchema,
  buildListResponseSchema,
  buildLogsResponseSchema,
} from "@/lib/validations/deployment.schemas";
import type {
  Build,
  BuildListItem,
  BuildTriggerResult,
} from "@/types/models/build.types";
import type {
  BuildResponse,
  BuildListItemResponse,
  BuildLogsResponse,
} from "@/types/api/builds.types";

/**
 * Build Service
 *
 * Handles all HTTP communication with the Build API.
 *
 * Why a separate service?
 * 1. Isolation: All build API logic in one place
 * 2. Reusability: Multiple components can use the same service
 * 3. Testing: Easy to mock for unit tests
 * 4. Type Safety: Strongly typed requests and responses
 * 5. Validation: Validates all responses with Zod
 *
 * Security considerations:
 * - Uses getApiClient() which handles auth tokens automatically
 * - Validates all responses with Zod to prevent XSS
 * - Proper error handling and transformation
 * - No sensitive data in error messages
 *
 * API Endpoints:
 * - POST /api/v1/builds/trigger/{notebook_id} - Trigger new build
 * - GET /api/v1/builds/{build_id} - Get build details
 * - GET /api/v1/builds - List all builds for user
 * - GET /api/v1/builds/notebook/{notebook_id} - List builds for notebook
 * - POST /api/v1/builds/{build_id}/refresh - Refresh build status
 * - GET /api/v1/builds/{build_id}/logs - Get build logs
 */

class BuildService {
  /**
   * Trigger a new build for a notebook
   *
   * @param notebookId - ID of the notebook to build
   * @returns Build information
   *
   * POST /api/v1/builds/trigger/{notebook_id}
   *
   * Why trigger a build?
   * - Creates Docker image from parsed notebook
   * - Required before deployment
   * - Can take 2-5 minutes to complete
   *
   * Flow:
   * 1. Make API request
   * 2. Validate response with Zod
   * 3. Transform to domain model
   * 4. Return typed result
   */
  async triggerBuild(notebookId: number): Promise<BuildTriggerResult> {
    const api = getApiClient();

    const response = await api.post<BuildResponse>(
      `/api/v1/builds/trigger/${notebookId}`
    );

    // Validate response structure
    const validated = buildResponseSchema.parse(response.data);

    // Transform to domain model
    return this.transformToTriggerResult(validated);
  }

  /**
   * Get detailed build information
   *
   * @param buildId - ID of the build
   * @returns Full build details
   *
   * GET /api/v1/builds/{build_id}
   *
   * Why get build details?
   * - Check build status
   * - Get error messages if failed
   * - Get log URLs for debugging
   * - Get image name for deployment
   */
  async getBuild(buildId: number): Promise<Build> {
    const api = getApiClient();

    const response = await api.get<BuildResponse>(`/api/v1/builds/${buildId}`);

    // Validate response
    const validated = buildResponseSchema.parse(response.data);

    // Transform to domain model
    return this.transformToBuild(validated);
  }

  /**
   * List all builds for current user
   *
   * @returns Array of build list items
   *
   * GET /api/v1/builds
   *
   * Why list all builds?
   * - See build history
   * - Monitor ongoing builds
   * - Track success rate
   * - Find builds for deployment
   */
  async listBuilds(): Promise<BuildListItem[]> {
    const api = getApiClient();

    const response = await api.get<BuildListItemResponse[]>("/api/v1/builds");

    // Validate response
    const validated = buildListResponseSchema.parse(response.data);

    // Transform each item
    return validated.map((item) => this.transformToBuildListItem(item));
  }

  /**
   * List builds for a specific notebook
   *
   * @param notebookId - ID of the notebook
   * @returns Array of build list items
   *
   * GET /api/v1/builds/notebook/{notebook_id}
   *
   * Why list notebook builds?
   * - See all builds for one notebook
   * - Find latest successful build
   * - Track build history for notebook
   * - Choose build for deployment
   */
  async listNotebookBuilds(notebookId: number): Promise<BuildListItem[]> {
    const api = getApiClient();

    const response = await api.get<BuildListItemResponse[]>(
      `/api/v1/builds/notebook/${notebookId}`
    );

    // Validate response
    const validated = buildListResponseSchema.parse(response.data);

    // Transform each item
    return validated.map((item) => this.transformToBuildListItem(item));
  }

  /**
   * Refresh build status from Cloud Build
   *
   * @param buildId - ID of the build
   * @returns Updated build details
   *
   * POST /api/v1/builds/{build_id}/refresh
   *
   * Why refresh?
   * - Get latest status from Cloud Build
   * - Update if stuck in "building" state
   * - Manual sync with Cloud Build
   *
   * When to use?
   * - Build seems stuck
   * - Status hasn't updated in a while
   * - User clicks "refresh" button
   */
  async refreshBuildStatus(buildId: number): Promise<Build> {
    const api = getApiClient();

    const response = await api.post<BuildResponse>(
      `/api/v1/builds/${buildId}/refresh`
    );

    // Validate response
    const validated = buildResponseSchema.parse(response.data);

    // Transform to domain model
    return this.transformToBuild(validated);
  }

  /**
   * Get build logs from Cloud Build
   *
   * @param buildId - ID of the build
   * @returns Build logs as plain text
   *
   * GET /api/v1/builds/{build_id}/logs
   *
   * Why get logs?
   * - Debug failed builds
   * - See what went wrong
   * - Identify syntax errors
   * - Track build progress
   *
   * Note: Logs can be large (MB of text)
   */
  async getBuildLogs(buildId: number): Promise<BuildLogsResponse> {
    const api = getApiClient();

    // Logs are returned as plain text, not JSON
    const response = await api.get<string>(`/api/v1/builds/${buildId}/logs`);

    // Validate it's a non-empty string
    return buildLogsResponseSchema.parse(response.data);
  }

  /**
   * Transform API response to Build domain model
   *
   * Why transform?
   * - API uses snake_case (Python convention)
   * - Domain uses camelCase (JavaScript convention)
   * - API has string dates, domain has Date objects
   * - Clean separation between API and application
   *
   * @param data - Validated API response
   * @returns Build domain model
   */
  private transformToBuild(data: BuildResponse): Build {
    return {
      id: data.id,
      notebookId: data.notebook_id,
      buildId: data.build_id,
      status: data.status as Build["status"], // Type assertion - validated by schema
      imageName: data.image_name,
      logUrl: data.log_url,
      errorMessage: data.error_message,
      createdAt: new Date(data.created_at),
      startedAt: data.started_at ? new Date(data.started_at) : null,
      finishedAt: data.finished_at ? new Date(data.finished_at) : null,
    };
  }

  /**
   * Transform API response to BuildTriggerResult
   *
   * Why separate from transformToBuild?
   * - Trigger response has different semantics
   * - Status is always "queued"
   * - Some fields not yet available
   *
   * @param data - Validated API response
   * @returns BuildTriggerResult domain model
   */
  private transformToTriggerResult(data: BuildResponse): BuildTriggerResult {
    return {
      id: data.id,
      notebookId: data.notebook_id,
      buildId: data.build_id,
      status: "queued", // Always queued when first triggered
      imageName: data.image_name,
      createdAt: new Date(data.created_at),
    };
  }

  /**
   * Transform API response to BuildListItem
   *
   * Why separate type?
   * - List items have fewer fields (performance)
   * - Only essential info for display
   * - Full details loaded on demand
   *
   * @param data - Validated API response
   * @returns BuildListItem domain model
   */
  private transformToBuildListItem(data: BuildListItemResponse): BuildListItem {
    return {
      id: data.id,
      notebookId: data.notebook_id,
      buildId: data.build_id,
      status: data.status as BuildListItem["status"],
      imageName: data.image_name,
      createdAt: new Date(data.created_at),
    };
  }

  /**
   * Get user-friendly error message for build errors
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
        return "Build not found. It may have been deleted.";
      }

      // Validation errors
      if (message.includes("422") || message.includes("validation")) {
        return "Invalid build request. Please check your input.";
      }

      // Quota errors
      if (message.includes("quota") || message.includes("limit")) {
        return "Build quota exceeded. Please try again later.";
      }

      // Build errors
      if (message.includes("build failed")) {
        return "Build failed. Check the logs for details.";
      }

      // Server errors
      if (message.includes("500") || message.includes("server")) {
        return "Server error. Please try again later.";
      }
    }

    // Default error messages for different actions
    const actionMessages: Record<string, string> = {
      trigger: "Failed to start build. Please try again.",
      fetch: "Failed to load build details. Please refresh the page.",
      list: "Failed to load builds. Please refresh the page.",
      refresh: "Failed to refresh build status. Please try again.",
      logs: "Failed to load build logs. Please try again.",
    };

    return (
      actionMessages[action] || `Failed to ${action} build. Please try again.`
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
export const buildService = new BuildService();

/**
 * Usage Examples:
 *
 * // Trigger a build
 * const build = await buildService.triggerBuild(notebookId);
 * console.log(`Build ${build.buildId} started`);
 *
 * // Get build status
 * const build = await buildService.getBuild(buildId);
 * if (build.status === 'success') {
 *   console.log('Build complete!');
 * }
 *
 * // List all builds
 * const builds = await buildService.listBuilds();
 * console.log(`You have ${builds.length} builds`);
 *
 * // Get logs for failed build
 * if (build.status === 'failed') {
 *   const logs = await buildService.getBuildLogs(build.id);
 *   console.log('Build logs:', logs);
 * }
 *
 * // Refresh status
 * const updated = await buildService.refreshBuildStatus(buildId);
 * console.log('Updated status:', updated.status);
 */
