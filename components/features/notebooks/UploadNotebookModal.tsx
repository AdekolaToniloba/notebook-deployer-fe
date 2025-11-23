// components/features/notebooks/UploadNotebookDialog.tsx
"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, FileCode, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * UploadNotebookDialog Component
 *
 * Handles file upload with:
 * - File validation (size, type)
 * - Drag and drop support
 * - Upload progress
 * - Error handling
 *
 * Security:
 * - Client-side validation (first line of defense)
 * - File type checking
 * - Size limits
 * - Backend does the real validation
 */

interface UploadNotebookDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
  isUploading?: boolean;
  uploadProgress?: number;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function UploadNotebookDialog({
  isOpen,
  onClose,
  onUpload,
  isUploading = false,
  uploadProgress = 0,
}: UploadNotebookDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Validate file before upload
   */
  const validateFile = (file: File): string | null => {
    // Check file extension
    if (!file.name.endsWith(".ipynb")) {
      return "Please select a Jupyter notebook file (.ipynb)";
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return "File size must be less than 10MB";
    }

    // Check MIME type (may be empty or various types)
    const validTypes = [
      "",
      "application/json",
      "application/x-ipynb+json",
      "text/plain",
    ];
    if (file.type && !validTypes.includes(file.type)) {
      return "Invalid file type";
    }

    return null;
  };

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file);

    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }

    setError(null);
    setSelectedFile(file);
  }, []);

  /**
   * Handle input change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  /**
   * Handle drag and drop
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  /**
   * Handle upload
   */
  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      await onUpload(selectedFile);
      // Reset on success
      setSelectedFile(null);
      setError(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  };

  /**
   * Reset and close
   */
  const handleClose = () => {
    if (!isUploading) {
      setSelectedFile(null);
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-background rounded-lg shadow-lg max-w-md w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">
              Upload Notebook
            </h2>
            <button
              onClick={handleClose}
              disabled={isUploading}
              className="p-1 hover:bg-background-secondary rounded transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-foreground-muted"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Upload className="h-6 w-6 text-primary" />
              </div>
            </div>

            {/* File Info or Instructions */}
            {selectedFile ? (
              <div className="space-y-2">
                <FileCode className="h-8 w-8 text-primary mx-auto" />
                <p className="text-sm font-medium text-foreground">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-foreground-muted">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-foreground">
                  Drag and drop your notebook here
                </p>
                <p className="text-xs text-foreground-muted">or</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  Browse Files
                </Button>
                <p className="text-xs text-foreground-muted mt-4">
                  Supports .ipynb files up to 10MB
                </p>
              </div>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".ipynb"
            onChange={handleInputChange}
            className="hidden"
          />

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 rounded-lg bg-error/10 border border-error/20 flex items-start gap-2"
            >
              <AlertCircle className="h-4 w-4 text-error mt-0.5 flex-shrink-0" />
              <p className="text-sm text-error">{error}</p>
            </motion.div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4"
            >
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-foreground-muted">Uploading...</span>
                <span className="text-foreground">{uploadProgress}%</span>
              </div>
              <div className="h-2 bg-background-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="flex-1"
            >
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
