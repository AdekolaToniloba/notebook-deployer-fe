// types/models/deployment.types.ts

/**
 * Deployment Domain Models
 *
 * These represent Cloud Run deployments in our application.
 * Deployments are live, running instances of notebooks.
 *
 * Why separate from API types?
 * - Domain models use camelCase (JavaScript convention)
 * - API types use snake_case (Python convention)
 * - We transform between them in the service layer
 * - Domain models have sensible defaults
 */

/**
 * Deployment Status
 *
 * Represents the current state of a Cloud Run deployment.
 *
 * State transitions:
 * deploying → deployed OR failed
 * deployed → updating → deployed OR failed
 *
 * Why these states?
 * - deploying: Creating Cloud Run service
 * - deployed: Service is live and accessible
 * - failed: Deployment failed (config issues, quota, etc.)
 * - updating: Updating existing deployment (traffic, config)
 */
export type DeploymentStatus = "deploying" | "deployed" | "failed" | "updating";

/**
 * Deployment Configuration
 *
 * Resource allocation and scaling settings.
 *
 * Why these fields?
 * - cpu: Computing power ("1", "2", "4")
 * - memory: RAM allocation ("512Mi", "1Gi", "2Gi", "4Gi")
 * - minInstances: Always-on instances (0 = scale to zero)
 * - maxInstances: Maximum concurrent instances
 *
 * Why important?
 * - Affects cost (more resources = higher cost)
 * - Affects performance (more resources = faster)
 * - Scale-to-zero saves money but adds cold start latency
 */
export interface DeploymentConfig {
  cpu: string; // "1", "2", "4"
  memory: string; // "512Mi", "1Gi", "2Gi", "4Gi"
  minInstances: number; // 0-10 (0 = scale to zero)
  maxInstances: number; // 1-100
  name?: string; // FIX: Added name property
  region?: string;
}

/**
 * Default deployment configuration
 *
 * Sensible defaults for most use cases.
 *
 * Why these defaults?
 * - 1 CPU, 512Mi: Good for simple notebooks
 * - Min 0: Save money when not in use
 * - Max 10: Prevent runaway costs
 */
export const DEFAULT_DEPLOYMENT_CONFIG: DeploymentConfig = {
  cpu: "1",
  memory: "512Mi",
  minInstances: 0,
  maxInstances: 10,
};

/**
 * Main Deployment Model
 *
 * Complete deployment information for detail views.
 *
 * Why these fields?
 * - id: Database primary key
 * - notebookId: Links to source notebook
 * - buildId: Links to build (Docker image)
 * - serviceName: Cloud Run service identifier
 * - serviceUrl: Public URL to access the app
 * - revisionName: Specific deployment version
 * - status: Current deployment state
 * - imageUri: Docker image being deployed
 * - trafficPercent: Traffic routing (0-100)
 * - errorMessage: User-friendly error if failed
 */
export interface Deployment {
  id: number;
  notebookId: number;
  buildId: number | null; // Can be null for manual deployments
  serviceName: string; // e.g., "notebook-1-1"
  serviceUrl: string | null; // e.g., "https://notebook-1-1-xxx.run.app"
  revisionName: string | null; // e.g., "notebook-1-1-00001-abc"
  status: DeploymentStatus;
  imageUri: string; // Docker image URI
  trafficPercent: number; // 0-100
  errorMessage: string | null;
  createdAt: Date;
  deployedAt: Date | null; // When service became accessible
}

/**
 * Deployment List Item
 *
 * Simplified deployment info for list views.
 *
 * Why simplified?
 * - Only essential fields for lists
 * - Faster to render
 * - Detail view loads full data
 */
export interface DeploymentListItem {
  id: number;
  notebookId: number;
  serviceName: string;
  serviceUrl: string | null;
  status: DeploymentStatus;
  errorMessage: string | null;
  createdAt: Date;
}

/**
 * Deployment Create Parameters
 *
 * What we need to create a deployment.
 *
 * Why?
 * - Type-safe deployment creation
 * - Optional config (uses defaults)
 * - buildId optional (can deploy existing image)
 */
export interface DeploymentCreateParams {
  notebookId: number;
  buildId?: number; // Optional if deploying existing image
  config?: Partial<DeploymentConfig>; // Optional, uses defaults
}

/**
 * Traffic Configuration
 *
 * For A/B testing and gradual rollouts.
 *
 * Why traffic management?
 * - Test new versions with small percentage
 * - Gradual rollout reduces risk
 * - Instant rollback if issues
 *
 * Example:
 * - Revision A: 90% traffic
 * - Revision B: 10% traffic (new version)
 */
export interface TrafficConfig {
  revisionName: string; // Which revision to route to
  trafficPercent: number; // 0-100
}

/**
 * Deployment Revision
 *
 * A specific version of a deployment.
 *
 * Why revisions?
 * - Each deploy creates new revision
 * - Can route traffic between revisions
 * - Can rollback to previous revision
 *
 * Example flow:
 * 1. Deploy v1 (revision-001) → 100% traffic
 * 2. Deploy v2 (revision-002) → 10% traffic
 * 3. Increase to 100% if good, or rollback
 */
export interface DeploymentRevision {
  revisionName: string;
  imageUri: string;
  trafficPercent: number;
  createdAt: Date;
  isLatest: boolean;
}

/**
 * Deployment with Config
 *
 * Deployment + its configuration.
 *
 * Why combined?
 * - Detail view needs both
 * - Edit form needs current config
 * - Complete picture of deployment
 */
export interface DeploymentWithConfig extends Deployment {
  config: DeploymentConfig;
}

/**
 * Deployment Statistics
 *
 * Aggregated stats for dashboard.
 *
 * Why?
 * - Track deployment success rate
 * - Monitor active deployments
 * - Identify problem notebooks
 */
export interface DeploymentStatistics {
  totalDeployments: number;
  activeDeployments: number; // Currently deployed
  failedDeployments: number;
  averageDeployTime: number; // Seconds
  successRate: number; // Percentage (0-100)
}

/**
 * Deployment Filter Options
 *
 * For filtering deployment lists.
 */
export interface DeploymentFilters {
  status?: DeploymentStatus[];
  notebookId?: number;
  searchQuery?: string; // Search by service name or URL
  sortBy?: "created" | "deployed" | "name";
  sortOrder?: "asc" | "desc";
}

/**
 * Deployment Pagination
 */
export interface DeploymentPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * UI-Specific Types
 */

/**
 * Deployment with UI State
 *
 * Adds UI-specific state to deployment data.
 */
export interface DeploymentWithUIState extends DeploymentListItem {
  isUpdatingTraffic?: boolean;
  isRollingBack?: boolean;
  isDeleting?: boolean;
  isRefreshing?: boolean;
}

/**
 * Deployment Action Types
 *
 * Available actions for deployments.
 */
export type DeploymentAction =
  | "viewUrl" // Open service URL in new tab
  | "updateTraffic" // Update traffic distribution
  | "rollback" // Rollback to previous revision
  | "viewLogs" // View Cloud Run logs
  | "viewMetrics" // View Cloud Run metrics
  | "delete"; // Delete deployment

/**
 * Deployment Error Types
 *
 * Categorized errors for better UX.
 */
export type DeploymentErrorType =
  | "quota" // Quota exceeded
  | "permissions" // Permission denied
  | "config" // Invalid configuration
  | "image" // Image not found or invalid
  | "timeout" // Deployment timeout
  | "network" // Network issues
  | "unknown"; // Unexpected error

export interface DeploymentError {
  type: DeploymentErrorType;
  message: string;
  technicalDetails?: string;
  suggestedAction?: string;
}

/**
 * Deployment Health
 *
 * Health status of a deployment.
 *
 * Why?
 * - Monitor if service is responding
 * - Alert if unhealthy
 * - Show health in UI
 */
export interface DeploymentHealth {
  deploymentId: number;
  isHealthy: boolean;
  lastChecked: Date;
  responseTime: number | null; // milliseconds
  errorRate: number; // Percentage (0-100)
  uptime: number; // Percentage (0-100)
}

/**
 * Deployment Metrics
 *
 * Performance metrics for a deployment.
 *
 * Why?
 * - Track request volume
 * - Monitor performance
 * - Identify bottlenecks
 */
export interface DeploymentMetrics {
  deploymentId: number;
  requestCount: number;
  averageLatency: number; // milliseconds
  errorCount: number;
  activeInstances: number;
  periodStart: Date;
  periodEnd: Date;
}

/**
 * CPU and Memory Presets
 *
 * Common configurations users can choose from.
 *
 * Why presets?
 * - Simplifies configuration
 * - Proven combinations
 * - Easy to understand (small, medium, large)
 */
export const DEPLOYMENT_PRESETS: Record<
  string,
  { label: string; config: DeploymentConfig }
> = {
  small: {
    label: "Small (Good for demos)",
    config: {
      cpu: "1",
      memory: "512Mi",
      minInstances: 0,
      maxInstances: 5,
    },
  },
  medium: {
    label: "Medium (Most apps)",
    config: {
      cpu: "2",
      memory: "1Gi",
      minInstances: 0,
      maxInstances: 10,
    },
  },
  large: {
    label: "Large (High traffic)",
    config: {
      cpu: "4",
      memory: "2Gi",
      minInstances: 1,
      maxInstances: 20,
    },
  },
  alwaysOn: {
    label: "Always On (No cold starts)",
    config: {
      cpu: "1",
      memory: "512Mi",
      minInstances: 1,
      maxInstances: 10,
    },
  },
};

/**
 * CPU Options
 *
 * Valid CPU values for Cloud Run.
 */
export const CPU_OPTIONS = ["1", "2", "4"] as const;
export type CpuOption = (typeof CPU_OPTIONS)[number];

/**
 * Memory Options
 *
 * Valid memory values for Cloud Run.
 * Must be compatible with CPU choice.
 */
export const MEMORY_OPTIONS = ["512Mi", "1Gi", "2Gi", "4Gi", "8Gi"] as const;
export type MemoryOption = (typeof MEMORY_OPTIONS)[number];

/**
 * CPU/Memory Compatibility
 *
 * Not all combinations are valid.
 * Cloud Run has rules about CPU/memory ratios.
 *
 * Why enforce?
 * - Prevent invalid configurations
 * - Better UX (only show valid options)
 * - Avoid deployment errors
 */
export const VALID_CPU_MEMORY_COMBINATIONS: Record<CpuOption, MemoryOption[]> =
  {
    "1": ["512Mi", "1Gi", "2Gi"],
    "2": ["1Gi", "2Gi", "4Gi"],
    "4": ["2Gi", "4Gi", "8Gi"],
  };
