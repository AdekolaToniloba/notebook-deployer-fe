// components/ui/error-display.tsx
"use client";

import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

/**
 * ErrorDisplay Component
 *
 * A reusable component for displaying errors throughout the app.
 *
 * Why this component?
 * 1. Consistency - All errors look the same across the app
 * 2. User experience - Clear, friendly error messages
 * 3. Actionable - Provides buttons to help user recover
 * 4. Flexible - Can handle different error types and contexts
 *
 * Design principles:
 * - Not scary (avoid red/danger colors everywhere)
 * - Clear messaging (what went wrong)
 * - Helpful actions (what user can do)
 * - Subtle animation (friendly, not jarring)
 */

interface ErrorDisplayProps {
  /**
   * The error message to display
   * Keep it user-friendly, not technical
   */
  message: string;

  /**
   * Optional title for the error
   * Default: "Something went wrong"
   */
  title?: string;

  /**
   * What type of error is this?
   * This determines which action buttons to show
   * - 'generic': Just show the message
   * - 'not-found': Show "Go back" button
   * - 'network': Show "Retry" button
   * - 'permission': Show "Go home" button
   */
  type?: "generic" | "not-found" | "network" | "permission";

  /**
   * Custom retry function
   * Only used when type is 'network'
   */
  onRetry?: () => void;

  /**
   * Show/hide the icon
   * Sometimes you want just text in tight spaces
   */
  showIcon?: boolean;

  /**
   * Size variant
   * - 'default': Normal size for pages
   * - 'compact': Smaller for inline errors
   * - 'large': Bigger for empty states
   */
  size?: "default" | "compact" | "large";

  /**
   * Custom className for additional styling
   */
  className?: string;
}

export function ErrorDisplay({
  message,
  title = "Something went wrong",
  type = "generic",
  onRetry,
  showIcon = true,
  size = "default",
  className = "",
}: ErrorDisplayProps) {
  const router = useRouter();

  /**
   * Size-based styling
   * Why these sizes?
   * - Compact: For inline errors (forms, cards)
   * - Default: For page-level errors
   * - Large: For empty states when error is the only content
   */
  const sizeClasses = {
    compact: "p-4 gap-2",
    default: "p-8 gap-4",
    large: "p-12 gap-6",
  };

  const iconSizes = {
    compact: "h-5 w-5",
    default: "h-8 w-8",
    large: "h-12 w-12",
  };

  const titleSizes = {
    compact: "text-base",
    default: "text-xl",
    large: "text-2xl",
  };

  const messageSizes = {
    compact: "text-sm",
    default: "text-base",
    large: "text-lg",
  };

  /**
   * Action buttons based on error type
   * Why different actions?
   * - Not found: User probably followed bad link, help them go back
   * - Network: Might be temporary, let them retry
   * - Permission: Send them somewhere they CAN access
   * - Generic: No clear action, just inform
   */
  const renderActions = () => {
    switch (type) {
      case "not-found":
        return (
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        );

      case "network":
        if (!onRetry) return null;
        return (
          <Button onClick={onRetry} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        );

      case "permission":
        return (
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            Go to Dashboard
          </Button>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        flex flex-col items-center justify-center
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {/* Icon - uses AlertCircle for all errors */}
      {showIcon && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        >
          <div
            className={`
            rounded-full bg-destructive/10 p-3
            ${size === "large" ? "p-4" : ""}
          `}
          >
            <AlertCircle
              className={`${iconSizes[size]} text-destructive`}
              aria-hidden="true"
            />
          </div>
        </motion.div>
      )}

      {/* Error message content */}
      <div className="flex flex-col items-center gap-2 text-center max-w-md">
        <h3
          className={`
          font-semibold text-foreground
          ${titleSizes[size]}
        `}
        >
          {title}
        </h3>
        <p
          className={`
          text-foreground-muted
          ${messageSizes[size]}
        `}
        >
          {message}
        </p>
      </div>

      {/* Action buttons */}
      {renderActions() && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2 mt-2"
        >
          {renderActions()}
        </motion.div>
      )}
    </motion.div>
  );
}

/**
 * Usage Examples:
 *
 * // Generic error (just shows message)
 * <ErrorDisplay message="Failed to load data" />
 *
 * // Not found error (shows "Go Back" button)
 * <ErrorDisplay
 *   message="Notebook not found. It may have been deleted."
 *   type="not-found"
 * />
 *
 * // Network error (shows "Try Again" button)
 * <ErrorDisplay
 *   message="Unable to connect to server"
 *   type="network"
 *   onRetry={() => refetch()}
 * />
 *
 * // Permission error (shows "Go Home" button)
 * <ErrorDisplay
 *   message="You don't have permission to view this notebook"
 *   type="permission"
 * />
 *
 * // Compact inline error
 * <ErrorDisplay
 *   message="Invalid file format"
 *   size="compact"
 *   showIcon={false}
 * />
 *
 * // Large empty state error
 * <ErrorDisplay
 *   title="No notebooks found"
 *   message="Upload your first Jupyter notebook to get started"
 *   size="large"
 * />
 */
