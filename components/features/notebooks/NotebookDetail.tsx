// components/features/notebooks/NotebookDetail.tsx
"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  FileCode2,
  Package,
  CheckCircle2,
  XCircle,
  Download,
  Trash2,
  Calendar,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Notebook } from "@/types/models/notebook.types";
import {
  useNotebooks,
  useNotebookFileDownload,
} from "@/lib/hooks/use-notebooks";

/**
 * NotebookDetail Component
 *
 * Displays comprehensive information about a single notebook.
 *
 * Why this layout?
 * 1. Header: Immediate context (what am I looking at?)
 * 2. Stats grid: Quick overview (key metrics at a glance)
 * 3. Dependencies: Important for understanding requirements
 * 4. Actions: Clear call-to-actions (what can I do?)
 * 5. Metadata: Timestamps for tracking
 *
 * Design principles:
 * - Scannable: Important info stands out
 * - Hierarchical: Most important info at the top
 * - Actionable: Clear buttons for user actions
 * - Informative: No jargon, clear labels
 */

interface NotebookDetailProps {
  notebook: Notebook;
}

export function NotebookDetail({ notebook }: NotebookDetailProps) {
  const router = useRouter();
  const { deleteNotebook } = useNotebooks();
  const { downloadMainPyFile, downloadRequirementsTxtFile } =
    useNotebookFileDownload();

  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Format date to human-readable string
   * Example: "Nov 17, 2025 at 9:52 AM"
   */
  const formatDate = (date: Date | null) => {
    if (!date) return "Not available";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  /**
   * Get status badge styling
   * Different colors for different statuses
   *
   * Why these colors?
   * - parsed/ready: Green (success, ready to use)
   * - parsing: Blue (in progress)
   * - parse_failed/error: Red (needs attention)
   * - uploaded/pending: Gray (waiting)
   */
  const getStatusBadge = () => {
    const statusConfig = {
      parsed: {
        color: "bg-green-500/10 text-green-700 dark:text-green-400",
        label: "Parsed",
      },
      ready: {
        color: "bg-green-500/10 text-green-700 dark:text-green-400",
        label: "Ready",
      },
      parsing: {
        color: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
        label: "Parsing",
      },
      parse_failed: {
        color: "bg-red-500/10 text-red-700 dark:text-red-400",
        label: "Parse Failed",
      },
      error: {
        color: "bg-red-500/10 text-red-700 dark:text-red-400",
        label: "Error",
      },
      uploaded: {
        color: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
        label: "Uploaded",
      },
      pending: {
        color: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
        label: "Pending",
      },
    };

    const config = statusConfig[notebook.status] || statusConfig.pending;

    return (
      <span
        className={`
          px-3 py-1 rounded-full text-sm font-medium
          ${config.color}
        `}
      >
        {config.label}
      </span>
    );
  };

  /**
   * Handle delete with confirmation
   * Why confirm?
   * - Destructive action
   * - Cannot be undone
   * - User might click by mistake
   */
  const handleDelete = async () => {
    // In real app, show a proper confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete "${notebook.name}"? This cannot be undone.`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    const success = await deleteNotebook(notebook.id);

    if (success) {
      // Navigate back to list after successful delete
      router.push("/dashboard/notebooks");
    } else {
      setIsDeleting(false);
      // Error is shown by the hook
    }
  };

  /**
   * Handle file downloads
   */
  const handleDownloadMainPy = async () => {
    await downloadMainPyFile(notebook.id, `${notebook.name}-main.py`);
  };

  const handleDownloadRequirements = async () => {
    await downloadRequirementsTxtFile(
      notebook.id,
      `${notebook.name}-requirements.txt`
    );
  };

  /**
   * Check if files are available for download
   * Only parsed notebooks have generated files
   */
  const hasMainPy = notebook.mainPyPath !== null;
  const hasRequirements = notebook.requirementsTxtPath !== null;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Notebooks
        </Button>

        {/* Title and status */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-foreground mb-2 break-words">
              {notebook.name}
            </h1>
            <p className="text-sm text-foreground-muted">{notebook.filename}</p>
          </div>
          {getStatusBadge()}
        </div>
      </motion.div>

      {/* Overview Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* Code Cells Count */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileCode2 className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Code Cells</h3>
          </div>
          <p className="text-3xl font-bold text-foreground">
            {notebook.codeCellsCount}
          </p>
          <p className="text-sm text-foreground-muted mt-1">
            Executable code blocks
          </p>
        </div>

        {/* Dependencies Count */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Dependencies</h3>
          </div>
          <p className="text-3xl font-bold text-foreground">
            {notebook.dependenciesCount}
          </p>
          <p className="text-sm text-foreground-muted mt-1">
            Python packages required
          </p>
        </div>

        {/* Syntax Valid */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`p-2 rounded-lg ${
                notebook.syntaxValid ? "bg-green-500/10" : "bg-red-500/10"
              }`}
            >
              {notebook.syntaxValid ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              )}
            </div>
            <h3 className="font-semibold text-foreground">Syntax</h3>
          </div>
          <p className="text-3xl font-bold text-foreground">
            {notebook.syntaxValid ? "Valid" : "Invalid"}
          </p>
          <p className="text-sm text-foreground-muted mt-1">
            {notebook.syntaxValid
              ? "No syntax errors found"
              : "Contains syntax errors"}
          </p>
        </div>
      </motion.div>

      {/* Dependencies List */}
      {notebook.dependencies.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-card border border-border rounded-lg p-6"
        >
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Package className="h-5 w-5" />
            Dependencies
          </h2>
          <div className="flex flex-wrap gap-2">
            {notebook.dependencies.map((dep, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-primary/10 text-primary rounded-md text-sm font-mono"
              >
                {dep}
              </span>
            ))}
          </div>
          <p className="text-sm text-foreground-muted mt-4">
            These packages will be installed when building your notebook.
          </p>
        </motion.div>
      )}

      {/* Actions Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-card border border-border rounded-lg p-6"
      >
        <h2 className="text-xl font-semibold text-foreground mb-4">Actions</h2>
        <div className="flex flex-wrap gap-3">
          {/* Download main.py */}
          <Button
            variant="outline"
            onClick={handleDownloadMainPy}
            disabled={!hasMainPy}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download main.py
          </Button>

          {/* Download requirements.txt */}
          <Button
            variant="outline"
            onClick={handleDownloadRequirements}
            disabled={!hasRequirements}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download requirements.txt
          </Button>

          {/* Delete notebook */}
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="gap-2 ml-auto"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? "Deleting..." : "Delete Notebook"}
          </Button>
        </div>

        {(!hasMainPy || !hasRequirements) && (
          <p className="text-sm text-foreground-muted mt-4">
            Note: Files are only available after successful parsing.
          </p>
        )}
      </motion.div>
      {/* Deploy buttons */}
      <div className="flex gap-3 mt-4">
        <Button
          onClick={() =>
            router.push(`/dashboard/deploy?notebookId=${notebook.id}`)
          }
        >
          One-Click Deploy
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            router.push(`/dashboard/notebooks/${notebook.id}/deploy`)
          }
        >
          Manual Deploy
        </Button>
      </div>

      {/* Metadata Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-card border border-border rounded-lg p-6"
      >
        <h2 className="text-xl font-semibold text-foreground mb-4">Metadata</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Created */}
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-foreground-muted mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Created</p>
              <p className="text-sm text-foreground-muted">
                {formatDate(notebook.createdAt)}
              </p>
            </div>
          </div>

          {/* Updated */}
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-foreground-muted mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Updated</p>
              <p className="text-sm text-foreground-muted">
                {formatDate(notebook.updatedAt)}
              </p>
            </div>
          </div>

          {/* Parsed */}
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-foreground-muted mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Parsed</p>
              <p className="text-sm text-foreground-muted">
                {formatDate(notebook.parsedAt)}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Component Architecture Notes:
 *
 * 1. Why separate sections?
 *    - Each section has a clear purpose
 *    - Easy to scan visually
 *    - Can be tested independently
 *    - Can be shown/hidden based on permissions
 *
 * 2. Why motion.div for each section?
 *    - Staggered animations (delay increases)
 *    - Smooth entrance effect
 *    - Professional feel
 *    - Not overwhelming (subtle delays)
 *
 * 3. Why disable download buttons?
 *    - Files only exist after parsing
 *    - Clear feedback (grayed out = not available)
 *    - Prevents confusing errors
 *
 * 4. Why confirm delete?
 *    - Destructive action
 *    - Cannot be undone
 *    - Prevents accidents
 *    - Industry standard pattern
 *
 * 5. Why show all this info?
 *    - User needs context before deploying
 *    - Dependencies show what environment needs
 *    - Syntax validation prevents bad deploys
 *    - Timestamps help with debugging
 */
