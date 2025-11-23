// lib/hooks/useNotebooks.ts

import { useCallback, useEffect } from "react";
import { useNotebookStore } from "@/store/notebook.store";
import type { NotebookListItem, Notebook } from "@/types/models/notebook.types";

/**
 * useNotebooks Hook
 *
 * This is the ONLY way components should interact with notebook state.
 *
 * Why a custom hook?
 * 1. Abstraction: Components don't need to know about Zustand
 * 2. Encapsulation: Store implementation can change without breaking components
 * 3. Convenience: Provides derived state and helper functions
 * 4. Memoization: Prevents unnecessary re-renders
 * 5. Consistency: All components use notebooks the same way
 *
 * Pattern:
 * - Select only the state you need (prevents re-renders)
 * - Wrap actions in useCallback (stable references)
 * - Provide convenient helpers (isReady, hasError, etc.)
 */

interface UseNotebooksReturn {
  // State
  notebooks: NotebookListItem[];
  selectedNotebook: Notebook | null;
  loading: boolean;
  error: string | null;
  isUploading: boolean;
  uploadProgress: number;

  // Derived state
  isEmpty: boolean;
  hasNotebooks: boolean;
  hasError: boolean;

  // Actions
  fetchNotebooks: () => Promise<void>;
  fetchNotebook: (id: number) => Promise<void>;
  uploadNotebook: (file: File) => Promise<void>;
  parseNotebook: (id: number) => Promise<void>;
  deleteNotebook: (id: number) => Promise<void>;
  downloadMainPy: (id: number) => Promise<string | null>;
  downloadRequirementsTxt: (id: number) => Promise<string | null>;
  clearError: () => void;

  // Utilities
  getNotebookById: (id: number) => NotebookListItem | undefined;
  isNotebookReady: (id: number) => boolean;
}

/**
 * Main hook for notebook operations
 *
 * Usage in components:
 * ```tsx
 * const { notebooks, loading, uploadNotebook } = useNotebooks();
 *
 * // Auto-fetch on mount
 * useNotebooks({ autoFetch: true });
 * ```
 */
export function useNotebooks(options?: {
  autoFetch?: boolean;
}): UseNotebooksReturn {
  // Select state from store
  // Note: Only select what you need to minimize re-renders
  const notebooks = useNotebookStore((state) => state.notebooks);
  const selectedNotebook = useNotebookStore((state) => state.selectedNotebook);
  const loading = useNotebookStore((state) => state.loading);
  const error = useNotebookStore((state) => state.error);
  const isUploading = useNotebookStore((state) => state.isUploading);
  const uploadProgress = useNotebookStore((state) => state.uploadProgress);

  // Select actions
  const fetchNotebooksAction = useNotebookStore(
    (state) => state.fetchNotebooks
  );
  const fetchNotebookAction = useNotebookStore((state) => state.fetchNotebook);
  const uploadNotebookAction = useNotebookStore(
    (state) => state.uploadNotebook
  );
  const parseNotebookAction = useNotebookStore((state) => state.parseNotebook);
  const deleteNotebookAction = useNotebookStore(
    (state) => state.deleteNotebook
  );
  const downloadMainPyAction = useNotebookStore(
    (state) => state.downloadMainPy
  );
  const downloadRequirementsTxtAction = useNotebookStore(
    (state) => state.downloadRequirementsTxt
  );
  const clearErrorAction = useNotebookStore((state) => state.clearError);

  // Auto-fetch notebooks on mount if requested
  useEffect(() => {
    if (options?.autoFetch) {
      fetchNotebooksAction();
    }
  }, [options?.autoFetch, fetchNotebooksAction]);

  // Derived state
  const isEmpty = notebooks.length === 0 && !loading;
  const hasNotebooks = notebooks.length > 0;
  const hasError = error !== null;

  // Wrapped actions with useCallback for stable references
  const fetchNotebooks = useCallback(async () => {
    await fetchNotebooksAction();
  }, [fetchNotebooksAction]);

  const fetchNotebook = useCallback(
    async (id: number) => {
      await fetchNotebookAction(id);
    },
    [fetchNotebookAction]
  );

  const uploadNotebook = useCallback(
    async (file: File) => {
      const result = await uploadNotebookAction(file);

      // Auto-parse after upload if successful
      if (result) {
        await parseNotebookAction(result.id);
      }
    },
    [uploadNotebookAction, parseNotebookAction]
  );

  const parseNotebook = useCallback(
    async (id: number) => {
      await parseNotebookAction(id);
    },
    [parseNotebookAction]
  );

  const deleteNotebook = useCallback(
    async (id: number) => {
      await deleteNotebookAction(id);
    },
    [deleteNotebookAction]
  );

  const downloadMainPy = useCallback(
    async (id: number) => {
      return await downloadMainPyAction(id);
    },
    [downloadMainPyAction]
  );

  const downloadRequirementsTxt = useCallback(
    async (id: number) => {
      return await downloadRequirementsTxtAction(id);
    },
    [downloadRequirementsTxtAction]
  );

  const clearError = useCallback(() => {
    clearErrorAction();
  }, [clearErrorAction]);

  // Utility functions
  const getNotebookById = useCallback(
    (id: number) => {
      return notebooks.find((nb) => nb.id === id);
    },
    [notebooks]
  );

  const isNotebookReady = useCallback(
    (id: number) => {
      const notebook = getNotebookById(id);
      return notebook?.status === "ready";
    },
    [getNotebookById]
  );

  return {
    // State
    notebooks,
    selectedNotebook,
    loading,
    error,
    isUploading,
    uploadProgress,

    // Derived state
    isEmpty,
    hasNotebooks,
    hasError,

    // Actions
    fetchNotebooks,
    fetchNotebook,
    uploadNotebook,
    parseNotebook,
    deleteNotebook,
    downloadMainPy,
    downloadRequirementsTxt,
    clearError,

    // Utilities
    getNotebookById,
    isNotebookReady,
  };
}

/**
 * Hook for a single notebook
 * Convenience hook when working with one notebook
 */
export function useNotebook(id: number) {
  const selectedNotebook = useNotebookStore((state) => state.selectedNotebook);
  const loading = useNotebookStore((state) => state.loading);
  const error = useNotebookStore((state) => state.error);
  const fetchNotebookAction = useNotebookStore((state) => state.fetchNotebook);

  // Fetch on mount
  useEffect(() => {
    fetchNotebookAction(id);
  }, [id, fetchNotebookAction]);

  const isLoading = loading && selectedNotebook?.id !== id;
  const isCurrentNotebook = selectedNotebook?.id === id;

  return {
    notebook: isCurrentNotebook ? selectedNotebook : null,
    loading: isLoading,
    error,
  };
}

/**
 * Hook for file downloads
 * Handles download logic and browser download
 */
export function useNotebookFileDownload() {
  const downloadMainPy = useNotebookStore((state) => state.downloadMainPy);
  const downloadRequirementsTxt = useNotebookStore(
    (state) => state.downloadRequirementsTxt
  );

  /**
   * Download file and trigger browser download
   */
  const downloadFile = useCallback((content: string, filename: string) => {
    // Create a blob and download
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  /**
   * Download main.py for a notebook
   */
  const downloadMainPyFile = useCallback(
    async (notebookId: number, filename?: string) => {
      const content = await downloadMainPy(notebookId);
      if (content) {
        downloadFile(content, filename || `notebook-${notebookId}-main.py`);
      }
    },
    [downloadMainPy, downloadFile]
  );

  /**
   * Download requirements.txt for a notebook
   */
  const downloadRequirementsTxtFile = useCallback(
    async (notebookId: number, filename?: string) => {
      const content = await downloadRequirementsTxt(notebookId);
      if (content) {
        downloadFile(
          content,
          filename || `notebook-${notebookId}-requirements.txt`
        );
      }
    },
    [downloadRequirementsTxt, downloadFile]
  );

  return {
    downloadMainPyFile,
    downloadRequirementsTxtFile,
  };
}
