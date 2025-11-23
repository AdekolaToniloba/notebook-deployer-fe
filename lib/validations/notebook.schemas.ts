// lib/validations/notebook.schemas.ts

import { z } from "zod";

export const modelVersionSchema = z.object({
  id: z.number(),
  notebook_id: z.number(),
  version: z.number(),
  gcs_path: z.string(),
  size_bytes: z.number().nullable(),
  accuracy: z.string().nullable(), // The API returns a string
  is_active: z.boolean(),
  uploaded_at: z.string().datetime(),
});

export const modelVersionListSchema = z.object({
  versions: z.array(modelVersionSchema),
  total: z.number(),
});

/**
 * File upload validation
 * Validates the file before upload
 */
export const notebookFileSchema = z.object({
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
});

/**
 * Notebook status enum schema
 */
export const notebookStatusSchema = z
  .enum([
    "uploaded", // Just uploaded
    "pending", // Waiting to parse
    "parsing", // Currently parsing
    "parsed", // Successfully parsed
    "parse_failed", // Parse failed - user needs to fix notebook
    "ready", // Ready to build (legacy)
    "error", // Generic error (legacy)
    "analyzing", // Potential new status
    "building", // Potential new status
    "deploying", // Potential new status
    "deployed",
  ])
  .or(z.string());

/**
 * Upload response validation
 * Validates what the API sends back after upload
 */
export const notebookUploadResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  filename: z.string(),
  status: notebookStatusSchema,
  created_at: z.string().datetime(),
});

/**
 * Parse response validation
 */
export const notebookParseResponseSchema = z.object({
  id: z.number(),
  status: notebookStatusSchema,
  code_cells_count: z.number().int().nonnegative(),
  syntax_valid: z.boolean(),
  dependencies: z.array(z.string()),
  dependencies_count: z.number().int().nonnegative(),
  parsed_at: z.string().datetime(),
});

/**
 * List item validation
 * Nullable fields get .nullable() - backend can return null
 */
export const notebookListItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  filename: z.string(),
  status: notebookStatusSchema,
  code_cells_count: z.number().int().nonnegative().nullable(),
  dependencies_count: z.number().int().nonnegative().nullable(),
  created_at: z.string().datetime(),
});

/**
 * Detail response validation
 * Full notebook with all fields
 */
export const notebookDetailResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  filename: z.string(),
  file_path: z.string(),
  user_id: z.number(),
  status: notebookStatusSchema,
  main_py_path: z.string().nullable(),
  requirements_txt_path: z.string().nullable(),
  dependencies: z.array(z.string()).nullable(),
  code_cells_count: z.number().int().nonnegative().nullable(),
  syntax_valid: z.boolean().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().nullable(),
  parsed_at: z.string().datetime().nullable(),
});

/**
 * List response validation
 * Array of list items
 */
export const notebookListResponseSchema = z.array(notebookListItemSchema);

/**
 * File content validation
 * Just a string, but we validate it's not empty
 */
export const fileContentResponseSchema = z
  .string()
  .min(1, "File content is empty");

/**
 * Validation error schema (from FastAPI 422 responses)
 */
export const validationErrorSchema = z.object({
  loc: z.array(z.union([z.string(), z.number()])),
  msg: z.string(),
  type: z.string(),
});

export const validationErrorResponseSchema = z.object({
  detail: z.array(validationErrorSchema),
});

/**
 * Type exports
 * These are inferred from the schemas above
 */
export type NotebookFileInput = z.infer<typeof notebookFileSchema>;
export type NotebookStatus = z.infer<typeof notebookStatusSchema>;
export type NotebookUploadResponse = z.infer<
  typeof notebookUploadResponseSchema
>;
export type NotebookParseResponse = z.infer<typeof notebookParseResponseSchema>;
export type NotebookListItem = z.infer<typeof notebookListItemSchema>;
export type NotebookDetailResponse = z.infer<
  typeof notebookDetailResponseSchema
>;
export type NotebookListResponse = z.infer<typeof notebookListResponseSchema>;
export type FileContentResponse = z.infer<typeof fileContentResponseSchema>;
export type ValidationError = z.infer<typeof validationErrorSchema>;
export type ValidationErrorResponse = z.infer<
  typeof validationErrorResponseSchema
>;
export type ModelVersion = z.infer<typeof modelVersionSchema>;
export type ModelVersionList = z.infer<typeof modelVersionListSchema>;
