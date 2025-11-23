// types/models/notebook.types.ts

/**
 * Domain Models for Notebooks
 *
 * These are what our application uses internally.
 * Differences from API types:
 * - camelCase instead of snake_case (React/TS convention)
 * - No nullable fields where we provide defaults
 * - Additional computed properties
 * - Better organized for UI needs
 */

/**
 * Notebook status - same as API but typed nicely
 */
export type NotebookStatus =
  | "uploaded" // Just uploaded, not yet parsed
  | "pending" // Waiting to parse (legacy)
  | "parsing" // Currently being parsed
  | "parsed" // Successfully parsed, dependencies extracted
  | "parse_failed" // Parse failed - notebook has syntax errors or invalid format
  | "ready" // Parsed successfully, ready for build (legacy - same as parsed)
  | "error"; // Generic error (legacy)

/**
 * Main Notebook model
 * This is what components use
 */
export interface Notebook {
  id: number;
  name: string;
  filename: string;
  status: NotebookStatus;

  // Parsed data (only available after parsing)
  codeCellsCount: number;
  dependenciesCount: number;
  dependencies: string[];
  syntaxValid: boolean;

  // File paths (only available after parsing)
  filePath: string;
  mainPyPath: string | null;
  requirementsTxtPath: string | null;

  // Metadata
  userId: number;
  createdAt: Date;
  updatedAt: Date | null;
  parsedAt: Date | null;
}

/**
 * Simplified notebook for list views
 * Only the essential info needed in lists
 */
export interface NotebookListItem {
  id: number;
  name: string;
  filename: string;
  status: NotebookStatus;
  codeCellsCount: number;
  dependenciesCount: number;
  createdAt: Date;
}

/**
 * Upload result
 * What we get immediately after upload
 */
export interface NotebookUpload {
  id: number;
  name: string;
  filename: string;
  status: NotebookStatus;
  createdAt: Date;
}

/**
 * Parse result
 * What we get after parsing completes
 */
export interface NotebookParseResult {
  id: number;
  status: NotebookStatus;
  codeCellsCount: number;
  syntaxValid: boolean;
  dependencies: string[];
  dependenciesCount: number;
  parsedAt: Date;
}

/**
 * File content
 * For downloaded main.py and requirements.txt
 */
export interface NotebookFile {
  notebookId: number;
  filename: string;
  content: string;
  downloadedAt: Date;
}

/**
 * UI-specific types
 */

/**
 * Notebook with UI state
 * Used in components to track loading states per notebook
 */
export interface NotebookWithUIState extends NotebookListItem {
  isDeleting?: boolean;
  isDownloading?: boolean;
}

/**
 * Filter options for notebook list
 */
export interface NotebookFilters {
  status?: NotebookStatus[];
  searchQuery?: string;
  sortBy?: "name" | "created" | "updated";
  sortOrder?: "asc" | "desc";
}

/**
 * Pagination info
 * For when we add pagination later
 */
export interface NotebookPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
