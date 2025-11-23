// types/models/build.types.ts

/**
 * Build Domain Models
 *
 * These represent Cloud Build operations in our application.
 * Builds create Docker images from parsed notebooks.
 *
 * Why separate from API types?
 * - Domain models use camelCase (JavaScript convention)
 * - API types use snake_case (Python convention)
 * - We transform between them in the service layer
 * - Domain models have no nulls where we can provide defaults
 */

/**
 * Build Status
 *
 * Represents the current state of a Cloud Build operation.
 *
 * State transitions:
 * queued → building → success OR failed
 *
 * Why these states?
 * - queued: Waiting for Cloud Build resources
 * - building: Actively building Docker image
 * - success: Image built and pushed to registry
 * - failed: Build failed (syntax errors, dependency issues, etc.)
 */
export type BuildStatus = "queued" | "building" | "success" | "failed";

/**
 * Main Build Model
 *
 * Complete build information for detail views and operations.
 *
 * Why these fields?
 * - id: Database primary key
 * - notebookId: Links build to source notebook
 * - buildId: Cloud Build identifier (for API calls)
 * - status: Current build state
 * - imageName: Docker image name (needed for deployment)
 * - logUrl: Direct link to Cloud Build console logs
 * - errorMessage: User-friendly error if failed
 * - Timestamps: Track build duration and history
 */
export interface Build {
  id: number;
  notebookId: number;
  buildId: string; // Cloud Build ID (e.g., "build-1-1763149623")
  status: BuildStatus;
  imageName: string; // Docker image URI
  logUrl: string | null; // Link to Cloud Build console
  errorMessage: string | null;
  createdAt: Date;
  startedAt: Date | null; // When build actually started
  finishedAt: Date | null; // When build completed/failed
}

/**
 * Build List Item
 *
 * Simplified build information for list views.
 * Only includes fields needed for display in tables/cards.
 *
 * Why simplified?
 * - Faster to render (less data)
 * - Only shows essential info
 * - Detail view loads full data on demand
 */
export interface BuildListItem {
  id: number;
  notebookId: number;
  buildId: string;
  status: BuildStatus;
  imageName: string;
  createdAt: Date;
}

/**
 * Build Trigger Result
 *
 * What we get immediately after triggering a build.
 * Build hasn't started yet, so most fields are pending.
 *
 * Why separate type?
 * - Represents the initial state after triggering
 * - Used in UI to show "build queued" state
 * - Different from full Build (no logs, times, etc.)
 */
export interface BuildTriggerResult {
  id: number;
  notebookId: number;
  buildId: string;
  status: "queued";
  imageName: string;
  createdAt: Date;
}

/**
 * Build Logs
 *
 * Raw logs from Cloud Build.
 *
 * Why separate type?
 * - Logs can be very large (MB of text)
 * - Not always needed (only on detail view)
 * - Fetched separately from build metadata
 */
export interface BuildLogs {
  buildId: string;
  logs: string; // Raw log text
  fetchedAt: Date;
}

/**
 * Build Statistics
 *
 * Aggregated stats for dashboard/overview.
 *
 * Why?
 * - Users want to see success rate
 * - Track average build times
 * - Identify failing notebooks
 */
export interface BuildStatistics {
  totalBuilds: number;
  successfulBuilds: number;
  failedBuilds: number;
  averageDuration: number; // Seconds
  successRate: number; // Percentage (0-100)
}

/**
 * Build Filter Options
 *
 * For filtering build lists.
 *
 * Why?
 * - Users need to find specific builds
 * - Filter by status (show only failed)
 * - Filter by notebook
 * - Sort by date
 */
export interface BuildFilters {
  status?: BuildStatus[];
  notebookId?: number;
  searchQuery?: string; // Search by build ID or image name
  sortBy?: "created" | "started" | "finished";
  sortOrder?: "asc" | "desc";
}

/**
 * Build Pagination
 *
 * For when we have many builds.
 *
 * Why paginate?
 * - Builds accumulate over time
 * - Don't load all at once
 * - Better performance
 */
export interface BuildPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * UI-Specific Types
 */

/**
 * Build with UI State
 *
 * Adds UI-specific state to build data.
 *
 * Why?
 * - Track loading state per build
 * - Show spinners for specific actions
 * - Prevent double-clicks
 */
export interface BuildWithUIState extends BuildListItem {
  isRefreshing?: boolean; // Refreshing status from Cloud Build
  isFetchingLogs?: boolean; // Loading logs
  isDeploying?: boolean; // Creating deployment from this build
}

/**
 * Build Action Types
 *
 * For action menus and buttons.
 *
 * Why?
 * - Type-safe action handlers
 * - Clear what actions are available
 * - Easy to disable based on status
 */
export type BuildAction =
  | "refresh" // Refresh status from Cloud Build
  | "viewLogs" // Open logs viewer
  | "viewInConsole" // Open Cloud Build console
  | "deploy" // Create deployment from this build
  | "rebuild"; // Trigger new build for same notebook

/**
 * Build Error Types
 *
 * Categorized errors for better UX.
 *
 * Why categorize?
 * - Different errors need different help text
 * - Some are user-fixable, some aren't
 * - Better error messages
 */
export type BuildErrorType =
  | "syntax" // Notebook has syntax errors
  | "dependencies" // Dependency resolution failed
  | "timeout" // Build took too long
  | "resources" // Out of resources (rare)
  | "network" // Network issues
  | "unknown"; // Unexpected error

export interface BuildError {
  type: BuildErrorType;
  message: string; // User-friendly message
  technicalDetails?: string; // For debugging
  suggestedAction?: string; // What user should do
}
