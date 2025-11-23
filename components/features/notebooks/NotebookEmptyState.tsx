// components/features/notebooks/NotebookEmptyState.tsx
"use client";

import { motion } from "framer-motion";
import { FileCode, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * NotebookEmptyState Component
 *
 * Shown when user has no notebooks yet.
 *
 * Why a separate component?
 * - Keeps list component clean
 * - Reusable pattern for other empty states
 * - Easy to update messaging
 * - Consistent UX
 */

interface NotebookEmptyStateProps {
  onUpload?: () => void;
  onNew?: () => void;
}

export function NotebookEmptyState({
  onUpload,
  onNew,
}: NotebookEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12 rounded-lg border border-border bg-background-secondary/50"
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring" }}
        className="flex justify-center mb-4"
      >
        <div className="p-4 rounded-full bg-primary/10">
          <FileCode className="h-8 w-8 text-primary" />
        </div>
      </motion.div>

      {/* Message */}
      <h3 className="text-lg font-semibold text-foreground mb-2">
        No notebooks yet
      </h3>
      <p className="text-foreground-muted mb-6 max-w-md mx-auto">
        Get started by uploading a Jupyter notebook or creating a new one
      </p>

      {/* Actions */}
      <div className="flex gap-3 justify-center">
        {onUpload && (
          <Button variant="outline" onClick={onUpload}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Notebook
          </Button>
        )}
        {onNew && (
          <Button onClick={onNew}>
            <Plus className="h-4 w-4 mr-2" />
            Create New
          </Button>
        )}
      </div>
    </motion.div>
  );
}
