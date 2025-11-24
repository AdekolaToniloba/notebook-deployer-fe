// lib/validations/deployment.schemas.ts

import { z } from "zod";

/**
 * Deployment Validation Schemas
 *
 * These schemas validate ALL data from the deployment APIs:
 * - Builds
 * - Deployments
 * - Pipeline (one-click deploy)
 *
 * Why Zod?
 * 1. Runtime validation - catches bad data before it breaks things
 * 2. Type inference - get TypeScript types from schemas
 * 3. Error messages - user-friendly validation errors
 * 4. Security - validate all inputs, never trust data
 *
 * Pattern: Define schema → export schema → (optionally) infer type
 *
 * CRITICAL: These schemas MUST match the API responses exactly!
 */

/**
 * =============================================================================
 * BUILD SCHEMAS
 * =============================================================================
 */

/**
 * Build Status Schema
 *
 * Validates the status field from API responses.
 */
export const buildStatusSchema = z.enum([
  "queued",
  "building",
  "success",
  "failed",
]);

/**
 * Build Response Schema
 *
 * Validates GET /api/v1/builds/{build_id}
 * and POST /api/v1/builds/trigger/{notebook_id}
 */
export const buildResponseSchema = z.object({
  id: z.number(),
  notebook_id: z.number(),
  build_id: z.string(),
  status: z.string(), // Validate as string, cast to enum in transform
  image_name: z.string(),
  log_url: z.string().nullable(),
  error_message: z.string().nullable(),
  created_at: z.string().datetime(),
  started_at: z.string().datetime().nullable(),
  finished_at: z.string().datetime().nullable(),
});

/**
 * Build List Item Schema
 *
 * Validates items in build list responses.
 */
export const buildListItemSchema = z.object({
  id: z.number(),
  notebook_id: z.number(),
  build_id: z.string(),
  status: z.string(),
  image_name: z.string(),
  created_at: z.string().datetime(),
});

/**
 * Build List Response Schema
 *
 * Validates GET /api/v1/builds
 * and GET /api/v1/builds/notebook/{notebook_id}
 */
export const buildListResponseSchema = z.array(buildListItemSchema);

/**
 * Build Logs Response Schema
 *
 * Validates GET /api/v1/builds/{build_id}/logs
 *
 * API returns plain text, not JSON.
 */
export const buildLogsResponseSchema = z
  .string()
  .min(1, "Build logs cannot be empty");

/**
 * =============================================================================
 * DEPLOYMENT SCHEMAS
 * =============================================================================
 */

/**
 * Deployment Status Schema
 */
export const deploymentStatusSchema = z.enum([
  "deploying",
  "deployed",
  "failed",
  "updating",
]);

/**
 * Deployment Configuration Schema
 *
 * Validates user input for deployment configuration.
 *
 * Why validate?
 * - Prevent invalid configurations
 * - Catch errors before API call
 * - Better error messages
 */
export const deploymentConfigSchema = z.object({
  cpu: z.enum(["1", "2", "4"]).default("1"),
  memory: z.enum(["512Mi", "1Gi", "2Gi", "4Gi", "8Gi"]).default("512Mi"),
  min_instances: z.number().int().min(0).max(10).default(0),
  max_instances: z.number().int().min(1).max(100).default(10),
});

/**
 * Refine to ensure max >= min
 *
 * Why refine?
 * - Cross-field validation
 * - max_instances must be >= min_instances
 * - Zod's .refine() allows custom validation
 */
export const deploymentConfigSchemaWithValidation =
  deploymentConfigSchema.refine(
    (data) => data.max_instances >= data.min_instances,
    {
      message: "Max instances must be greater than or equal to min instances",
      path: ["max_instances"], // Which field to attach error to
    }
  );

/**
 * Deployment Response Schema
 *
 * Validates GET /api/v1/deployments/{deployment_id}
 * and POST /api/v1/deployments
 */
export const deploymentResponseSchema = z.object({
  id: z.number(),
  notebook_id: z.number(),
  build_id: z.number().nullable(),
  service_name: z.string(),
  service_url: z.string().nullable(),
  revision_name: z.string().nullable(),
  status: z.string(),
  image_uri: z.string(),
  traffic_percent: z.number().min(0).max(100),
  error_message: z.string().nullable(),
  created_at: z.string().datetime(),
  deployed_at: z.string().datetime().nullable(),
});

/**
 * Deployment List Item Schema
 */
export const deploymentListItemSchema = z.object({
  id: z.number(),
  notebook_id: z.number(),
  user_id: z.number(),
  name: z.string(), // FIX: changed from service_name to name
  status: z.string(),
  build_id: z.string().nullable(),
  image_url: z.string().nullable(),
  service_url: z.string().nullable(),
  region: z.string(),
  error_message: z.string().nullable(),
  build_logs_url: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().nullable(),
  deployed_at: z.string().datetime().nullable(),
});

/**
 * Deployment List Response Schema
 */
export const deploymentListResponseSchema = z.array(deploymentListItemSchema);

/**
 * Deployment Create Request Schema
 */
export const deploymentCreateRequestSchema = z.object({
  notebook_id: z.number().int().positive(),
  build_id: z.number().int().positive().nullable().optional(),
  cpu: z.enum(["1", "2", "4"]).optional(),
  memory: z.enum(["512Mi", "1Gi", "2Gi", "4Gi", "8Gi"]).optional(),
  min_instances: z.number().int().min(0).max(10).optional(),
  max_instances: z.number().int().min(1).max(100).optional(),
});

/**
 * Traffic Update Request Schema
 */
export const trafficUpdateRequestSchema = z.object({
  revision_name: z.string().min(1, "Revision name is required"),
  traffic_percent: z.number().int().min(0).max(100),
});

/**
 * =============================================================================
 * PIPELINE SCHEMAS
 * =============================================================================
 */

/**
 * Pipeline Status Schema
 */
export const pipelineStatusSchema = z.enum([
  "processing",
  "deployed",
  "failed",
]);

/**
 * Pipeline Step Schema
 */
export const pipelineStepSchema = z.enum([
  "parse",
  "dependencies",
  "upload",
  "build",
  "deploy",
]);

/**
 * Pipeline Deploy Response Schema
 *
 * Validates POST /api/v1/pipeline/deploy
 */
export const pipelineDeployResponseSchema = z.object({
  pipeline_id: z.string(),
  notebook_id: z.number(),
  status: z.string(),
  message: z.string(),
});

/**
 * Pipeline Status Response Schema
 *
 * Validates GET /api/v1/pipeline/status/{pipeline_id}
 *
 * IMPORTANT: API returns this as a JSON string, not a direct object.
 * We need to parse the string first, then validate.
 */
export const pipelineStatusResponseSchema = z.object({
  pipeline_id: z.string(),
  notebook_id: z.number(),
  build_id: z.number().nullable(),
  deployment_id: z.number().nullable(),
  current_step: z.string(),
  status: z.string(),
  steps_completed: z.array(z.string()),
  error_message: z.string().nullable(),

  // Aggregated status
  notebook_status: z.string(),
  build_status: z.string().nullable(),
  deployment_status: z.string().nullable(),
  service_url: z.string().nullable(),
});

/**
 * Pipeline History Item Schema
 */
export const pipelineHistoryItemSchema = z.object({
  notebook_id: z.number(),
  notebook_name: z.string(),
  notebook_status: z.string(),
  build_id: z.number().nullable(),
  build_status: z.string().nullable(),
  deployment_id: z.number().nullable(),
  deployment_status: z.string().nullable(),
  service_url: z.string().nullable(),
  created_at: z.string().datetime(),
});

/**
 * Pipeline History Response Schema
 *
 * Validates GET /api/v1/pipeline/history
 *
 * IMPORTANT: API returns this as a JSON string, not a direct object.
 */
export const pipelineHistoryResponseSchema = z.object({
  total: z.number().int().nonnegative(),
  pipelines: z.array(pipelineHistoryItemSchema),
});

/**
 * Pipeline Deploy Config Schema
 *
 * Validates configuration for one-click deploy.
 * Same as deployment config but all fields optional.
 */
export const pipelineDeployConfigSchema = z.object({
  cpu: z.enum(["1", "2", "4"]).optional(),
  memory: z.enum(["512Mi", "1Gi", "2Gi", "4Gi", "8Gi"]).optional(),
  min_instances: z.number().int().min(0).max(10).optional(),
  max_instances: z.number().int().min(1).max(100).optional(),
});

/**
 * =============================================================================
 * COMMON/SHARED SCHEMAS
 * =============================================================================
 */

/**
 * Validation Error Schema
 *
 * FastAPI 422 validation error format.
 */
export const validationErrorSchema = z.object({
  loc: z.array(z.union([z.string(), z.number()])),
  msg: z.string(),
  type: z.string(),
});

/**
 * Error Response Schema
 *
 * Generic error response from API.
 * Can be string or array of validation errors.
 */
export const errorResponseSchema = z.object({
  detail: z.union([z.string(), z.array(validationErrorSchema)]),
});

/**
 * =============================================================================
 * FORM VALIDATION SCHEMAS
 * =============================================================================
 */

/**
 * Build Trigger Form Schema
 *
 * For UI forms that trigger builds.
 * Just needs notebook ID.
 */
export const buildTriggerFormSchema = z.object({
  notebookId: z.number().int().positive("Notebook ID must be positive"),
});

/**
 * Deployment Create Form Schema
 *
 * For UI forms that create deployments.
 * Uses camelCase (UI convention).
 */
export const deploymentCreateFormSchema = z.object({
  notebookId: z.number().int().positive("Notebook ID must be positive"),
  buildId: z.number().int().positive().optional(),
  cpu: z.enum(["1", "2", "4"]).default("1"),
  memory: z.enum(["512Mi", "1Gi", "2Gi", "4Gi", "8Gi"]).default("512Mi"),
  minInstances: z
    .number()
    .int()
    .min(0, "Min instances cannot be negative")
    .max(10, "Min instances cannot exceed 10")
    .default(0),
  maxInstances: z
    .number()
    .int()
    .min(1, "Max instances must be at least 1")
    .max(100, "Max instances cannot exceed 100")
    .default(10),
});

/**
 * Refine deployment form to ensure max >= min
 */
export const deploymentCreateFormSchemaWithValidation =
  deploymentCreateFormSchema.refine(
    (data) => data.maxInstances >= data.minInstances,
    {
      message: "Max instances must be greater than or equal to min instances",
      path: ["maxInstances"],
    }
  );

/**
 * One-Click Deploy Form Schema
 *
 * For UI forms that do one-click deploy.
 * File + optional config.
 */
export const oneClickDeployFormSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 10 * 1024 * 1024, // 10MB max
      "File size must be less than 10MB"
    )
    .refine(
      (file) => file.name.endsWith(".ipynb"),
      "File must be a Jupyter notebook (.ipynb)"
    )
    .refine(
      (file) =>
        file.type === "" ||
        file.type === "application/json" ||
        file.type === "application/x-ipynb+json",
      "Invalid file type"
    ),
  cpu: z.enum(["1", "2", "4"]).default("1"),
  memory: z.enum(["512Mi", "1Gi", "2Gi", "4Gi", "8Gi"]).default("512Mi"),
  minInstances: z
    .number()
    .int()
    .min(0, "Min instances cannot be negative")
    .max(10, "Min instances cannot exceed 10")
    .default(0),
  maxInstances: z
    .number()
    .int()
    .min(1, "Max instances must be at least 1")
    .max(100, "Max instances cannot exceed 100")
    .default(10),
});

/**
 * Refine one-click deploy form
 */
export const oneClickDeployFormSchemaWithValidation =
  oneClickDeployFormSchema.refine(
    (data) => data.maxInstances >= data.minInstances,
    {
      message: "Max instances must be greater than or equal to min instances",
      path: ["maxInstances"],
    }
  );

/**
 * Traffic Update Form Schema
 *
 * For UI forms that update traffic.
 */
export const trafficUpdateFormSchema = z.object({
  revisionName: z.string().min(1, "Revision name is required"),
  trafficPercent: z
    .number()
    .int()
    .min(0, "Traffic percent must be at least 0")
    .max(100, "Traffic percent cannot exceed 100"),
});

/**
 * =============================================================================
 * TYPE EXPORTS
 * =============================================================================
 */

/**
 * Export inferred types for use in application.
 * These are automatically generated from schemas.
 */

// Build types
export type BuildResponse = z.infer<typeof buildResponseSchema>;
export type BuildListItem = z.infer<typeof buildListItemSchema>;
export type BuildListResponse = z.infer<typeof buildListResponseSchema>;

// Deployment types
export type DeploymentConfig = z.infer<typeof deploymentConfigSchema>;
export type DeploymentResponse = z.infer<typeof deploymentResponseSchema>;
export type DeploymentListItem = z.infer<typeof deploymentListItemSchema>;
export type DeploymentListResponse = z.infer<
  typeof deploymentListResponseSchema
>;
export type DeploymentCreateRequest = z.infer<
  typeof deploymentCreateRequestSchema
>;
export type TrafficUpdateRequest = z.infer<typeof trafficUpdateRequestSchema>;

// Pipeline types
export type PipelineDeployResponse = z.infer<
  typeof pipelineDeployResponseSchema
>;
export type PipelineStatusResponse = z.infer<
  typeof pipelineStatusResponseSchema
>;
export type PipelineHistoryItem = z.infer<typeof pipelineHistoryItemSchema>;
export type PipelineHistoryResponse = z.infer<
  typeof pipelineHistoryResponseSchema
>;
export type PipelineDeployConfig = z.infer<typeof pipelineDeployConfigSchema>;

// Form types
export type BuildTriggerForm = z.infer<typeof buildTriggerFormSchema>;
export type DeploymentCreateForm = z.infer<
  typeof deploymentCreateFormSchemaWithValidation
>;
export type OneClickDeployForm = z.infer<
  typeof oneClickDeployFormSchemaWithValidation
>;
export type TrafficUpdateForm = z.infer<typeof trafficUpdateFormSchema>;

// Error types
export type ValidationError = z.infer<typeof validationErrorSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
