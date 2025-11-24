/**
 * Status Badge Component
 */

import { cn } from "@/lib/utils";
import type { BuildStatus } from "@/types/models/build.types";
import type { DeploymentStatus } from "@/types/models/deployment.types";

/**
 * Status Badge Props
 */
interface StatusBadgeProps {
  status: BuildStatus | DeploymentStatus | string;
  type?: "build" | "deployment" | "pipeline";
  className?: string;
}

/**
 * Status configuration
 */
const statusConfig = {
  // Build statuses
  queued: {
    label: "Queued",
    className: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    description: "Waiting to start",
  },
  building: {
    label: "Building",
    className: "bg-purple-500/10 text-purple-700 border-purple-500/20",
    description: "Build in progress",
  },
  success: {
    label: "Success",
    className: "bg-green-500/10 text-green-700 border-green-500/20",
    description: "Build completed successfully",
  },

  // Deployment statuses
  deploying: {
    label: "Deploying",
    className: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    description: "Deployment in progress",
  },
  deployed: {
    label: "Deployed",
    className: "bg-green-500/10 text-green-700 border-green-500/20",
    description: "Successfully deployed",
  },
  updating: {
    label: "Updating",
    className: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    description: "Updating deployment",
  },

  // Pipeline statuses
  processing: {
    label: "Processing",
    className: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    description: "Pipeline executing",
  },

  // Error status (shared)
  failed: {
    label: "Failed",
    className: "bg-red-500/10 text-red-700 border-red-500/20",
    description: "Operation failed",
  },

  // Notebook statuses (for reference)
  uploaded: {
    label: "Uploaded",
    className: "bg-gray-500/10 text-gray-700 border-gray-500/20",
    description: "File uploaded",
  },
  parsed: {
    label: "Parsed",
    className: "bg-green-500/10 text-green-700 border-green-500/20",
    description: "Successfully parsed",
  },
} as const;

/**
 * Get status indicator dot
 *
 * Shows pulsing animation for in-progress statuses.
 */
function StatusIndicator({ status }: { status: string }) {
  const isInProgress = [
    "building",
    "deploying",
    "processing",
    "updating",
    "queued",
  ].includes(status.toLowerCase());

  if (!isInProgress) return null;

  return (
    <span className="relative flex h-2 w-2">
      {/* Pulsing ring */}
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
      {/* Solid dot */}
      <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
    </span>
  );
}

/**
 * Status Badge Component
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();

  const config = statusConfig[
    normalizedStatus as keyof typeof statusConfig
  ] || {
    label: status,
    className: "bg-gray-500/10 text-gray-700 border-gray-500/20",
    description: "Unknown status",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border",

        config.className,

        className
      )}
      title={config.description}
    >
      {/* Status indicator (pulsing for in-progress) */}
      <StatusIndicator status={normalizedStatus} />

      {/* Status label */}
      <span>{config.label}</span>
    </span>
  );
}

/**
 * Status Badge Variants
 *
 * Pre-configured badges for common use cases.
 */

export function BuildStatusBadge({
  status,
  className,
}: {
  status: BuildStatus;
  className?: string;
}) {
  return <StatusBadge status={status} type="build" className={className} />;
}

export function DeploymentStatusBadge({
  status,
  className,
}: {
  status: DeploymentStatus;
  className?: string;
}) {
  return (
    <StatusBadge status={status} type="deployment" className={className} />
  );
}
