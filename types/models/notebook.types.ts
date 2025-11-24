// types/models/notebook.types.ts

/**
 * Domain Models for Notebooks
 */

/**
 * Notebook status
 */
export type NotebookStatus =
  | "uploaded"
  | "pending"
  | "parsing"
  | "parsed"
  | "parse_failed"
  | "ready"
  | "error";

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
 */
export interface NotebookPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
