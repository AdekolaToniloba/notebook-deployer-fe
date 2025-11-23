// store/notebook.store.ts

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { notebookService } from "@/lib/api/services/notebooks.service";
import type {
  NotebookListItem,
  Notebook,
  NotebookUpload,
  NotebookParseResult,
} from "@/types/models/notebook.types";
import type {
  NotebookDetailResponse,
  NotebookListResponse,
} from "@/types/api/notebooks.types";

/**
 * Notebook Store
 *
 * This is the single source of truth for notebook state.
 *
 * Why Zustand?
 * 1. Simple API - less boilerplate than Redux
 * 2. No Context needed - direct imports
 * 3. Good TypeScript support
 * 4. DevTools integration
 * 5. Fast - minimal re-renders
 *
 * State organization:
 * - notebooks: Array of notebooks for lists
 * - selectedNotebook: Currently selected notebook (detail view)
 * - loading: Global loading state
 * - error: Error messages
 *
 * Actions pattern:
 * - Each action is async and handles its own errors
 * - Loading state is managed automatically
 * - Errors are stored for UI to display
 */

/**
 * Transforms API response (snake_case) to domain model (camelCase)
 *
 * Why transform?
 * - Backend uses Python conventions (snake_case)
 * - Frontend uses JavaScript conventions (camelCase)
 * - Domain model has no nulls where we can provide defaults
 * - Dates are parsed from strings
 */
function transformListItem(item: NotebookListResponse[0]): NotebookListItem {
  return {
    id: item.id,
    name: item.name,
    filename: item.filename,
    status: item.status as NotebookListItem["status"], // Type assertion - API returns string, we know it's valid
    codeCellsCount: item.code_cells_count ?? 0,
    dependenciesCount: item.dependencies_count ?? 0,
    createdAt: new Date(item.created_at),
  };
}

function transformDetail(detail: NotebookDetailResponse): Notebook {
  return {
    id: detail.id,
    name: detail.name,
    filename: detail.filename,
    status: detail.status as Notebook["status"], // Type assertion - API returns string, we know it's valid
    codeCellsCount: detail.code_cells_count ?? 0,
    dependenciesCount: detail.dependencies?.length ?? 0, // Compute from array length
    dependencies: detail.dependencies ?? [],
    syntaxValid: detail.syntax_valid ?? false,
    filePath: detail.file_path,
    mainPyPath: detail.main_py_path,
    requirementsTxtPath: detail.requirements_txt_path,
    userId: detail.user_id,
    createdAt: new Date(detail.created_at),
    updatedAt: detail.updated_at ? new Date(detail.updated_at) : null,
    parsedAt: detail.parsed_at ? new Date(detail.parsed_at) : null,
  };
}

/**
 * Transforms API errors into user-friendly messages
 *
 * Why user-friendly errors?
 * - Technical errors confuse users
 * - Clear messages help users understand what went wrong
 * - Actionable messages tell users what to do next
 */
function getUserFriendlyErrorMessage(error: unknown, action: string): string {
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
      return "Notebook not found. It may have been deleted.";
    }

    // Validation errors
    if (message.includes("422") || message.includes("validation")) {
      return "Invalid notebook format. Please check your file and try again.";
    }

    // File too large
    if (message.includes("413") || message.includes("too large")) {
      return "File is too large. Maximum size is 10MB.";
    }

    // Parse errors
    if (message.includes("parse")) {
      return "Unable to parse notebook. Please check for syntax errors.";
    }

    // Server errors
    if (message.includes("500") || message.includes("server")) {
      return "Server error. Please try again later.";
    }
  }

  // Default error messages for different actions
  const actionMessages: Record<string, string> = {
    fetch: "Failed to load notebooks. Please refresh the page.",
    upload: "Failed to upload notebook. Please try again.",
    parse: "Failed to parse notebook. Please check the file format.",
    delete: "Failed to delete notebook. Please try again.",
    download: "Failed to download file. Please try again.",
  };

  return (
    actionMessages[action] || `Failed to ${action} notebook. Please try again.`
  );
}

/**
 * Store state interface
 */
interface NotebookState {
  // State
  notebooks: NotebookListItem[];
  selectedNotebook: Notebook | null;
  loading: boolean;
  error: string | null;

  // Upload state
  uploadProgress: number;
  isUploading: boolean;

  // Actions
  fetchNotebooks: () => Promise<void>;
  fetchNotebook: (id: number) => Promise<void>;
  uploadNotebook: (file: File) => Promise<NotebookUpload | null>;
  parseNotebook: (id: number) => Promise<NotebookParseResult | null>;
  deleteNotebook: (id: number) => Promise<boolean>;
  downloadMainPy: (id: number) => Promise<string | null>;
  downloadRequirementsTxt: (id: number) => Promise<string | null>;

  // Utility actions
  clearError: () => void;
  setSelectedNotebook: (notebook: Notebook | null) => void;
  reset: () => void;
}

/**
 * Initial state
 */
const initialState = {
  notebooks: [],
  selectedNotebook: null,
  loading: false,
  error: null,
  uploadProgress: 0,
  isUploading: false,
};

/**
 * Create the store
 */
export const useNotebookStore = create<NotebookState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      /**
       * Fetch all notebooks
       * Used for list views
       */
      fetchNotebooks: async () => {
        set({ loading: true, error: null });

        try {
          const response = await notebookService.listNotebooks();
          const notebooks = response.map(transformListItem);

          set({
            notebooks,
            loading: false,
          });
        } catch (error) {
          const message = getUserFriendlyErrorMessage(error, "fetch");
          set({
            error: message,
            loading: false,
          });
        }
      },

      /**
       * Fetch single notebook details
       * Used for detail views
       */
      fetchNotebook: async (id: number) => {
        set({ loading: true, error: null });

        try {
          const response = await notebookService.getNotebook(id);
          const notebook = transformDetail(response);

          set({
            selectedNotebook: notebook,
            loading: false,
          });
        } catch (error) {
          const message = getUserFriendlyErrorMessage(error, "fetch");
          set({
            error: message,
            loading: false,
            selectedNotebook: null,
          });
        }
      },

      /**
       * Upload a new notebook
       * Returns the upload result or null on error
       */
      uploadNotebook: async (file: File) => {
        set({ isUploading: true, error: null, uploadProgress: 0 });

        try {
          // Simulate progress (in real app, you'd track actual upload progress)
          set({ uploadProgress: 50 });

          const response = await notebookService.uploadNotebook(file);

          set({ uploadProgress: 100 });

          // Transform to domain model
          const upload: NotebookUpload = {
            id: response.id,
            name: response.name,
            filename: response.filename,
            status: response.status as NotebookUpload["status"], // Type assertion
            createdAt: new Date(response.created_at),
          };

          // Add to notebooks list
          const listItem: NotebookListItem = {
            ...upload,
            codeCellsCount: 0,
            dependenciesCount: 0,
          };

          set({
            notebooks: [listItem, ...get().notebooks],
            isUploading: false,
            uploadProgress: 0,
          });

          return upload;
        } catch (error) {
          const message = getUserFriendlyErrorMessage(error, "upload");
          set({
            error: message,
            isUploading: false,
            uploadProgress: 0,
          });
          return null;
        }
      },

      /**
       * Parse a notebook
       * Triggers backend to extract dependencies and validate syntax
       */
      parseNotebook: async (id: number) => {
        set({ loading: true, error: null });

        try {
          const response = await notebookService.parseNotebook(id);

          const result: NotebookParseResult = {
            id: response.id,
            status: response.status as NotebookParseResult["status"], // Type assertion
            codeCellsCount: response.code_cells_count,
            syntaxValid: response.syntax_valid,
            dependencies: response.dependencies,
            dependenciesCount: response.dependencies_count,
            parsedAt: new Date(response.parsed_at),
          };

          // Update notebook in list
          set((state) => ({
            notebooks: state.notebooks.map((nb) =>
              nb.id === id
                ? {
                    ...nb,
                    status: result.status,
                    codeCellsCount: result.codeCellsCount,
                    dependenciesCount: result.dependenciesCount,
                  }
                : nb
            ),
            loading: false,
          }));

          return result;
        } catch (error) {
          const message = getUserFriendlyErrorMessage(error, "parse");
          set({
            error: message,
            loading: false,
          });
          return null;
        }
      },

      /**
       * Delete a notebook
       * Returns true on success, false on error
       */
      deleteNotebook: async (id: number) => {
        set({ loading: true, error: null });

        try {
          await notebookService.deleteNotebook(id);

          // Remove from list
          set((state) => ({
            notebooks: state.notebooks.filter((nb) => nb.id !== id),
            selectedNotebook:
              state.selectedNotebook?.id === id ? null : state.selectedNotebook,
            loading: false,
          }));

          return true;
        } catch (error) {
          const message = getUserFriendlyErrorMessage(error, "delete");
          set({
            error: message,
            loading: false,
          });
          return false;
        }
      },

      /**
       * Download main.py file content
       */
      downloadMainPy: async (id: number) => {
        set({ loading: true, error: null });

        try {
          const content = await notebookService.downloadMainPy(id);

          set({ loading: false });
          return content;
        } catch (error) {
          const message = getUserFriendlyErrorMessage(error, "download");
          set({
            error: message,
            loading: false,
          });
          return null;
        }
      },

      /**
       * Download requirements.txt file content
       */
      downloadRequirementsTxt: async (id: number) => {
        set({ loading: true, error: null });

        try {
          const content = await notebookService.downloadRequirementsTxt(id);

          set({ loading: false });
          return content;
        } catch (error) {
          const message = getUserFriendlyErrorMessage(error, "download");
          set({
            error: message,
            loading: false,
          });
          return null;
        }
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Set selected notebook manually
       * Useful for navigation
       */
      setSelectedNotebook: (notebook: Notebook | null) => {
        set({ selectedNotebook: notebook });
      },

      /**
       * Reset store to initial state
       * Called on logout
       */
      reset: () => {
        set(initialState);
      },
    }),
    { name: "NotebookStore" }
  )
);
