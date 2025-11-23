/**
 * Progress Bar Component
 *
 * Linear progress indicator with smooth transitions.
 * Used for showing build/deployment/pipeline progress.
 *
 * Design: Clean, minimal progress bar with subtle gradient.
 * Smooth transitions for a polished feel.
 */

import { cn } from "@/lib/utils";

/**
 * Progress Bar Props
 */
interface ProgressBarProps {
  value: number; // Progress value (0-100)
  max?: number; // Maximum value (default: 100)
  showPercentage?: boolean; // Show percentage text
  label?: string; // Optional label
  size?: "sm" | "md" | "lg"; // Size variant
  variant?: "default" | "success" | "warning" | "error";
  className?: string;
}

/**
 * Size configurations
 */
const sizeConfig = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-3",
} as const;

/**
 * Variant configurations
 */
const variantConfig = {
  default: "bg-blue-600",
  success: "bg-green-600",
  warning: "bg-yellow-600",
  error: "bg-red-600",
} as const;

/**
 * Progress Bar Component
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ProgressBar value={60} />
 *
 * // With label and percentage
 * <ProgressBar
 *   value={75}
 *   label="Building container"
 *   showPercentage
 * />
 *
 * // Custom size and variant
 * <ProgressBar
 *   value={100}
 *   size="lg"
 *   variant="success"
 * />
 * ```
 */
export function ProgressBar({
  value,
  max = 100,
  showPercentage = false,
  label,
  size = "md",
  variant = "default",
  className,
}: ProgressBarProps) {
  // Calculate percentage
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  // Determine variant based on completion
  const progressVariant = (() => {
    if (variant !== "default") return variant;
    if (percentage === 100) return "success";
    return "default";
  })();

  return (
    <div className={cn("w-full space-y-2", className)}>
      {/* Label and percentage row */}
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-sm">
          {label && (
            <span className="text-muted-foreground font-medium">{label}</span>
          )}
          {showPercentage && (
            <span className="text-muted-foreground tabular-nums">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}

      {/* Progress bar track */}
      <div
        className={cn(
          // Base styles
          "w-full overflow-hidden rounded-full bg-secondary",
          // Size
          sizeConfig[size]
        )}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {/* Progress bar fill */}
        <div
          className={cn(
            // Base styles
            "h-full rounded-full transition-all duration-500 ease-out",
            // Variant color
            variantConfig[progressVariant],
            // Shimmer effect for in-progress
            percentage > 0 && percentage < 100 && "animate-pulse"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Circular Progress Component
 *
 * Alternative circular progress indicator.
 * Useful for compact displays.
 *
 * @example
 * ```tsx
 * <CircularProgress value={75} size={64} />
 * ```
 */
interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  showPercentage?: boolean;
  variant?: "default" | "success" | "warning" | "error";
  className?: string;
}

export function CircularProgress({
  value,
  max = 100,
  size = 48,
  strokeWidth = 4,
  showPercentage = true,
  variant = "default",
  className,
}: CircularProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  // SVG calculations
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  // Determine color
  const colorMap = {
    default: "stroke-blue-600",
    success: "stroke-green-600",
    warning: "stroke-yellow-600",
    error: "stroke-red-600",
  };

  const progressVariant =
    variant !== "default"
      ? variant
      : percentage === 100
      ? "success"
      : "default";

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        className
      )}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-secondary"
        />

        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn(
            "transition-all duration-500 ease-out",
            colorMap[progressVariant]
          )}
        />
      </svg>

      {/* Percentage text */}
      {showPercentage && (
        <span className="absolute text-sm font-semibold tabular-nums">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}

/**
 * Indeterminate Progress
 *
 * Shows loading state when exact progress is unknown.
 *
 * @example
 * ```tsx
 * <IndeterminateProgress />
 * ```
 */
interface IndeterminateProgressProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function IndeterminateProgress({
  size = "md",
  className,
}: IndeterminateProgressProps) {
  return (
    <div className={cn("w-full space-y-2", className)}>
      {/* Progress bar track */}
      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-secondary relative",
          sizeConfig[size]
        )}
      >
        {/* Animated shimmer */}
        <div
          className="h-full w-1/3 bg-blue-600 absolute animate-shimmer"
          style={{
            animation: "shimmer 1.5s infinite ease-in-out",
          }}
        />
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
