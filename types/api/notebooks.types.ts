// types/api/notebooks.types.ts

/**
 * API Types for Notebooks
 *
 * These types mirror the API responses exactly.
 * They handle nullable fields from the backend properly.
 *
 * Why separate from domain models?
 * - API types match backend exactly (snake_case, nulls)
 * - Domain models are what our app uses (camelCase, no nulls)
 * - We transform between them in the service layer
 */

/**
 * Response after uploading a notebook
 */
export interface NotebookUploadResponse {
  id: number;
  name: string;
  filename: string;
  status: string;
  created_at: string;
}

/**
 * Response after parsing a notebook
 */
export interface NotebookParseResponse {
  id: number;
  status: string;
  code_cells_count: number;
  syntax_valid: boolean;
  dependencies: string[];
  dependencies_count: number;
  parsed_at: string;
}

/**
 * List item response (simplified notebook info)
 */
export interface NotebookListItem {
  id: number;
  name: string;
  filename: string;
  status: string;
  code_cells_count: number | null;
  dependencies_count: number | null;
  created_at: string;
}

/**
 * Full notebook details response
 * Notice the nullable fields - backend can return null
 */
export interface NotebookDetailResponse {
  id: number;
  name: string;
  filename: string;
  file_path: string;
  user_id: number;
  status: string;
  main_py_path: string | null;
  requirements_txt_path: string | null;
  dependencies: string[] | null;
  code_cells_count: number | null;
  syntax_valid: boolean | null;
  created_at: string;
  updated_at: string | null;
  parsed_at: string | null;
}

/**
 * Type alias for list response
 */
export type NotebookListResponse = NotebookListItem[];

/**
 * Validation error from FastAPI
 * Used in 422 responses
 */
export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface ValidationErrorResponse {
  detail: ValidationError[];
}

/**
 * Notebook status enum
 * These are the possible values from the API
 */
export type NotebookStatus =
  | "uploaded" // Just uploaded, not yet parsed
  | "pending" // Waiting to be parsed (legacy)
  | "parsing" // Being parsed
  | "parsed" // Successfully parsed
  | "parse_failed" // Parse failed
  | "ready" // Parsed and ready to build (legacy)
  | "error"; // Parse error (legacy)

/**
 * File download responses
 * These endpoints return plain text, not JSON
 */
export type FileContentResponse = string;
