// components/features/notebooks/NotebookList.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  useNotebooks,
  useNotebookFileDownload,
} from "@/lib/hooks/use-notebooks";
import { NotebookCard } from "./NotebookCard";
import { NotebookEmptyState } from "./NotebookEmptyState";
import { UploadNotebookDialog } from "./UploadNotebookModal";
import { AlertCircle } from "lucide-react";

/**
 * NotebookList Component
 *
 * Main component that orchestrates:
 * - Fetching notebooks
 * - Displaying list/empty state
 * - Upload dialog
 * - Delete confirmation
 * - File downloads
 * - Error handling
 *
 * This is a "smart" component - it knows about state and actions.
 * The child components are "dumb" - they only receive props.
 *
 * Why this pattern?
 * - Single source of truth (this component)
 * - Child components are pure and testable
 * - Easy to reason about data flow
 * - Keeps logic in one place
 */

/**
 * Animation variants for stagger effect
 */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function NotebookList() {
  // State management via custom hook
  const {
    notebooks,
    loading,
    error,
    isUploading,
    uploadProgress,
    isEmpty,
    uploadNotebook,
    parseNotebook,
    deleteNotebook,
    clearError,
  } = useNotebooks({ autoFetch: true });

  // File download hook
  const { downloadMainPyFile, downloadRequirementsTxtFile } =
    useNotebookFileDownload();

  // Local UI state
  const [selectedNotebookId, setSelectedNotebookId] = useState<number | null>(
    null
  );
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [deletingNotebookId, setDeletingNotebookId] = useState<number | null>(
    null
  );
  const [parsingNotebookId, setParsingNotebookId] = useState<number | null>(
    null
  );

  /**
   * Handle upload
   */
  const handleUpload = async (file: File) => {
    await uploadNotebook(file);
    // Dialog will close automatically on success
  };

  /**
   * Handle parse notebook
   */
  const handleParse = async (id: number) => {
    setParsingNotebookId(id);
    await parseNotebook(id);
    setParsingNotebookId(null);
  };

  /**
   * Handle delete with confirmation
   */
  const handleDelete = async (id: number, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${name}"?\n\nThis action cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingNotebookId(id);
    await deleteNotebook(id);
    setDeletingNotebookId(null);

    // Clear selection if deleted notebook was selected
    if (selectedNotebookId === id) {
      setSelectedNotebookId(null);
    }
  };

  /**
   * Handle open (navigate to detail page)
   * TODO: Implement navigation
   */
  const handleOpen = (id: number) => {
    // eslint-disable-next-line no-console
    console.log("Open notebook:", id);
    // In real app: router.push(`/dashboard/notebooks/${id}`)
  };

  /**
   * Handle file downloads
   */
  const handleDownloadMainPy = async (id: number) => {
    const notebook = notebooks.find((nb) => nb.id === id);
    await downloadMainPyFile(
      id,
      notebook?.filename.replace(".ipynb", "-main.py")
    );
  };

  const handleDownloadRequirements = async (id: number) => {
    const notebook = notebooks.find((nb) => nb.id === id);
    await downloadRequirementsTxtFile(
      id,
      notebook?.filename.replace(".ipynb", "-requirements.txt")
    );
  };

  /**
   * Render loading state
   */
  if (loading && notebooks.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-lg bg-error/10 border border-error/20 flex items-start gap-3"
      >
        <AlertCircle className="h-5 w-5 text-error mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-error mb-1">
            Failed to load notebooks
          </h3>
          <p className="text-sm text-error/80 mb-3">{error}</p>
          <button
            onClick={clearError}
            className="text-sm text-error hover:underline"
          >
            Dismiss
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      {/* Notebooks List */}
      {isEmpty ? (
        <NotebookEmptyState
          onUpload={() => setIsUploadDialogOpen(true)}
          onNew={() => {
            // TODO: Implement new notebook creation
            // eslint-disable-next-line no-console
            console.log("Create new notebook");
          }}
        />
      ) : (
        <motion.div
          className="grid grid-cols-1 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {notebooks.map((notebook) => (
            <motion.div key={notebook.id} variants={itemVariants}>
              <NotebookCard
                notebook={notebook}
                isSelected={selectedNotebookId === notebook.id}
                onSelect={() => setSelectedNotebookId(notebook.id)}
                onOpen={() => handleOpen(notebook.id)}
                onParse={() => handleParse(notebook.id)}
                onDelete={() => handleDelete(notebook.id, notebook.name)}
                onDownloadMainPy={() => handleDownloadMainPy(notebook.id)}
                onDownloadRequirements={() =>
                  handleDownloadRequirements(notebook.id)
                }
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Upload Dialog */}
      <UploadNotebookDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        onUpload={handleUpload}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
      />

      {/* Loading overlay for delete */}
      {deletingNotebookId !== null && (
        <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
          <div className="bg-background rounded-lg p-6 shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
            <p className="text-sm text-foreground-muted">
              Deleting notebook...
            </p>
          </div>
        </div>
      )}

      {/* Loading overlay for parse */}
      {parsingNotebookId !== null && (
        <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
          <div className="bg-background rounded-lg p-6 shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
            <p className="text-sm text-foreground-muted">Parsing notebook...</p>
          </div>
        </div>
      )}
    </>
  );
}
