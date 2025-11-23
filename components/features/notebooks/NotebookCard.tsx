// components/features/notebooks/NotebookCard.tsx
"use client";

import { motion } from "framer-motion";
import { ExternalLink, Trash2, Download, FileCode, Play } from "lucide-react";
import type { NotebookListItem } from "@/types/models/notebook.types";
import { useRouter } from "next/navigation";

/**
 * NotebookCard Component
 *
 * Displays a single notebook with:
 * - Status badge
 * - Metadata (created date, counts)
 * - Action buttons (open, download, delete)
 *
 * Why a separate component?
 * - Reusable in lists and grids
 * - Isolated state and logic
 * - Easy to test
 * - Better performance (memo-izable)
 */

interface NotebookCardProps {
  notebook: NotebookListItem;
  isSelected?: boolean;
  onSelect?: () => void;
  onOpen?: () => void;
  onParse?: () => void; // Added for parsing
  onDelete?: () => void;
  onDownloadMainPy?: () => void;
  onDownloadRequirements?: () => void;
}

/**
 * Status configuration
 * Maps status to visual styles
 */
const statusConfig = {
  uploaded: {
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    label: "Uploaded",
  },
  pending: {
    badge: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    label: "Pending",
  },
  parsing: {
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    label: "Parsing...",
  },
  parsed: {
    badge: "bg-green-500/10 text-green-600 dark:text-green-400",
    label: "Parsed",
  },
  parse_failed: {
    badge: "bg-red-500/10 text-red-600 dark:text-red-400",
    label: "Parse Failed",
  },
  ready: {
    badge: "bg-green-500/10 text-green-600 dark:text-green-400",
    label: "Ready",
  },
  error: {
    badge: "bg-red-500/10 text-red-600 dark:text-red-400",
    label: "Error",
  },
} as const;

export function NotebookCard({
  notebook,
  isSelected = false,
  onSelect,
  onOpen,
  onParse,
  onDelete,
  onDownloadMainPy,
  onDownloadRequirements,
}: NotebookCardProps) {
  const statusInfo = statusConfig[notebook.status];
  const router = useRouter();

  const handleNotebookClick = (notebookId: number) => {
    router.push(`/notebooks/${notebookId}`);
  };

  // Format date
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(notebook.createdAt);

  // Can download if parsed or ready
  const canDownload =
    notebook.status === "parsed" || notebook.status === "ready";

  // Can parse if uploaded, pending, or parse_failed (allows retry)
  const canParse =
    notebook.status === "uploaded" ||
    notebook.status === "pending" ||
    notebook.status === "parse_failed";

  // Show error message for failed notebooks
  const showError =
    notebook.status === "parse_failed" || notebook.status === "error";

  return (
    <motion.div
      className={`rounded-lg border p-6 transition-all cursor-pointer ${
        isSelected
          ? "border-primary bg-background-secondary/80 ring-1 ring-primary/50"
          : "border-border bg-background-secondary/50 hover:bg-background-secondary/80"
      }`}
      onClick={onSelect}
      whileHover={{ x: 4 }}
      layout
    >
      <div
        className="flex items-start justify-between"
        onClick={() => handleNotebookClick(notebook.id)}
      >
        {/* Notebook Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-foreground truncate">
              {notebook.name}
            </h3>
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${statusInfo.badge}`}
            >
              {statusInfo.label}
            </span>
          </div>

          <p className="text-sm text-foreground-muted mb-4 truncate">
            {notebook.filename}
          </p>

          {/* Error message for failed notebooks */}
          {showError && (
            <div className="mb-3 p-2 rounded bg-red-500/10 border border-red-500/20">
              <p className="text-xs text-red-600 dark:text-red-400">
                {notebook.status === "parse_failed"
                  ? "Unable to parse notebook. Please check for syntax errors or invalid format."
                  : "An error occurred. Please try re-uploading the notebook."}
              </p>
            </div>
          )}

          <div className="flex gap-6 text-xs text-foreground-muted">
            <span>Created {formattedDate}</span>
            {notebook.codeCellsCount > 0 && (
              <span>{notebook.codeCellsCount} cells</span>
            )}
            {notebook.dependenciesCount > 0 && (
              <span>{notebook.dependenciesCount} dependencies</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 ml-4">
          {/* Parse - shown only if uploaded or pending */}
          {onParse && canParse && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                onParse();
              }}
              className="p-2 hover:bg-green-500/10 transition-colors rounded-lg"
              title="Parse notebook"
            >
              <Play className="h-4 w-4 text-green-600 dark:text-green-400" />
            </motion.button>
          )}

          {/* Open */}
          {onOpen && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                onOpen();
              }}
              className="p-2 hover:bg-background transition-colors rounded-lg"
              title="Open notebook"
            >
              <ExternalLink className="h-4 w-4 text-foreground-muted" />
            </motion.button>
          )}

          {/* Download main.py */}
          {onDownloadMainPy && canDownload && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                onDownloadMainPy();
              }}
              className="p-2 hover:bg-primary/10 transition-colors rounded-lg"
              title="Download main.py"
            >
              <FileCode className="h-4 w-4 text-primary" />
            </motion.button>
          )}

          {/* Download requirements.txt */}
          {onDownloadRequirements && canDownload && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                onDownloadRequirements();
              }}
              className="p-2 hover:bg-primary/10 transition-colors rounded-lg"
              title="Download requirements.txt"
            >
              <Download className="h-4 w-4 text-primary" />
            </motion.button>
          )}

          {/* Delete */}
          {onDelete && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-2 hover:bg-error/10 transition-colors rounded-lg"
              title="Delete notebook"
            >
              <Trash2 className="h-4 w-4 text-error" />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
