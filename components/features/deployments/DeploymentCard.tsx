/**
 * Deployment Card Component
 *
 * Displays deployment information in a card format.
 * Used in deployment lists and notebook detail views.
 *
 * Features:
 * - Deployment status with visual indicator
 * - Service URL (clickable)
 * - Resource configuration
 * - Quick actions (update traffic, rollback)
 */

"use client";

import { ExternalLink, Settings, RotateCcw, Globe } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { DeploymentStatusBadge } from "@/components/ui/status-badge";
import { DeploymentConfigSummary } from "@/components/features/deployments/DeploymentConfigForm";
import { cn } from "@/lib/utils";
import type {
  Deployment,
  DeploymentListItem,
} from "@/types/models/deployment.types";

/**
 * Deployment Card Props
 */
interface DeploymentCardProps {
  deployment: DeploymentListItem | Deployment;
  onUpdateTraffic?: (deploymentId: number) => void;
  onRollback?: (deploymentId: number) => void;
  showActions?: boolean;
  className?: string;
}

/**
 * Check if deployment is detailed
 */
function isDeploymentDetailed(
  deployment: DeploymentListItem | Deployment
): deployment is Deployment {
  return "imageUri" in deployment;
}

/**
 * Deployment Card Component
 *
 * @example
 * ```tsx
 * <DeploymentCard
 *   deployment={deployment}
 *   onUpdateTraffic={(id) => handleUpdateTraffic(id)}
 *   onRollback={(id) => handleRollback(id)}
 *   showActions
 * />
 * ```
 */
export function DeploymentCard({
  deployment,
  onUpdateTraffic,
  onRollback,
  showActions = true,
  className,
}: DeploymentCardProps) {
  const isDetailed = isDeploymentDetailed(deployment);
  const isActive = deployment.status === "deployed";
  const isInProgress =
    deployment.status === "deploying" || deployment.status === "updating";

  return (
    <div
      className={cn(
        "group relative rounded-lg border bg-card p-4 hover:shadow-md transition-all",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Service name and status */}
          <div className="flex items-center gap-2 mb-2">
            <Link
              href={`/dashboard/deployments/${deployment.id}`}
              className="text-sm font-medium hover:underline truncate"
            >
              {deployment.serviceName}
            </Link>
            <DeploymentStatusBadge status={deployment.status} />
          </div>

          {/* Service URL */}
          {deployment.serviceUrl && (
            <a
              href={deployment.serviceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline mb-3"
            >
              <Globe className="h-3 w-3" />
              <span className="truncate max-w-[300px]">
                {deployment.serviceUrl}
              </span>
              <ExternalLink className="h-3 w-3 flex-shrink-0" />
            </a>
          )}

          {/* Deployment info */}
          <div className="space-y-1 text-sm text-muted-foreground">
            {/* Notebook reference */}
            <div className="flex items-center gap-2">
              <span className="text-xs">Notebook:</span>
              <Link
                href={`/dashboard/notebooks/${deployment.notebookId}`}
                className="text-xs hover:underline"
              >
                #{deployment.notebookId}
              </Link>
            </div>

            {/* Deployment ID */}
            <div className="flex items-center gap-2">
              <span className="text-xs">Deployment ID:</span>
              <span className="text-xs">#{deployment.id}</span>
            </div>

            {/* Created time */}
            <div className="flex items-center gap-2">
              <span className="text-xs">Created:</span>
              <span className="text-xs">
                {formatDistanceToNow(deployment.createdAt, { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration (if detailed) */}
      {isDetailed && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs font-medium mb-3">Configuration</p>

          {/* Resource config */}
          <div className="grid grid-cols-2 gap-3 text-xs mb-3">
            <div>
              <p className="text-muted-foreground">Image</p>
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded truncate block">
                {deployment.imageUri.split("/").pop()}
              </code>
            </div>

            {deployment.revisionName && (
              <div>
                <p className="text-muted-foreground">Revision</p>
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded truncate block">
                  {deployment.revisionName.split("-").slice(-2).join("-")}
                </code>
              </div>
            )}

            <div>
              <p className="text-muted-foreground">Traffic</p>
              <p className="font-medium">{deployment.trafficPercent}%</p>
            </div>

            {deployment.deployedAt && (
              <div>
                <p className="text-muted-foreground">Deployed</p>
                <p className="font-medium">
                  {formatDistanceToNow(deployment.deployedAt, {
                    addSuffix: true,
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* In progress indicator */}
      {isInProgress && (
        <div className="mt-3 flex items-center gap-2 text-blue-600 text-sm">
          <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
          <p className="font-medium">
            {deployment.status === "deploying" ? "Deploying..." : "Updating..."}
          </p>
        </div>
      )}

      {/* Error message (if failed) */}
      {deployment.status === "failed" && deployment.errorMessage && (
        <div className="mt-3 rounded-md bg-red-50 border border-red-200 p-3">
          <p className="text-xs font-medium text-red-800 mb-1">
            Deployment Failed
          </p>
          <p className="text-xs text-red-700">{deployment.errorMessage}</p>
        </div>
      )}

      {/* Actions */}
      {showActions && isActive && (
        <div className="mt-4 pt-4 border-t flex gap-2">
          {/* Update traffic */}
          {onUpdateTraffic && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpdateTraffic(deployment.id)}
            >
              <Settings className="h-3 w-3 mr-2" />
              Update Traffic
            </Button>
          )}

          {/* Rollback */}
          {onRollback && isDetailed && deployment.revisionName && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRollback(deployment.id)}
            >
              <RotateCcw className="h-3 w-3 mr-2" />
              Rollback
            </Button>
          )}

          {/* View details */}
          <Button size="sm" variant="outline" asChild className="ml-auto">
            <Link href={`/dashboard/deployments/${deployment.id}`}>
              View Details
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Compact Deployment Card
 *
 * Minimal version for tight spaces.
 * Shows just status and URL.
 *
 * @example
 * ```tsx
 * <CompactDeploymentCard deployment={deployment} />
 * ```
 */
interface CompactDeploymentCardProps {
  deployment: DeploymentListItem | Deployment;
  onClick?: (deploymentId: number) => void;
  className?: string;
}

export function CompactDeploymentCard({
  deployment,
  onClick,
  className,
}: CompactDeploymentCardProps) {
  return (
    <button
      onClick={() => onClick?.(deployment.id)}
      className={cn(
        "w-full text-left rounded-md border bg-card p-3 hover:bg-accent transition-colors",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Deployment info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium truncate">
              {deployment.serviceName}
            </span>
            <DeploymentStatusBadge status={deployment.status} />
          </div>

          {deployment.serviceUrl ? (
            <a
              href={deployment.serviceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline truncate block"
              onClick={(e) => e.stopPropagation()}
            >
              {deployment.serviceUrl}
            </a>
          ) : (
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(deployment.createdAt, { addSuffix: true })}
            </p>
          )}
        </div>

        {/* Arrow */}
        {onClick && (
          <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}
      </div>
    </button>
  );
}

/**
 * Deployment List
 *
 * Container for multiple deployment cards.
 *
 * @example
 * ```tsx
 * <DeploymentList
 *   deployments={deployments}
 *   onUpdateTraffic={handleUpdateTraffic}
 *   onRollback={handleRollback}
 * />
 * ```
 */
interface DeploymentListProps {
  deployments: DeploymentListItem[] | Deployment[];
  onUpdateTraffic?: (deploymentId: number) => void;
  onRollback?: (deploymentId: number) => void;
  emptyMessage?: string;
  className?: string;
}

export function DeploymentList({
  deployments,
  onUpdateTraffic,
  onRollback,
  emptyMessage = "No deployments yet",
  className,
}: DeploymentListProps) {
  if (deployments.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {deployments.map((deployment) => (
        <DeploymentCard
          key={deployment.id}
          deployment={deployment}
          onUpdateTraffic={onUpdateTraffic}
          onRollback={onRollback}
        />
      ))}
    </div>
  );
}

/**
 * Active Deployment Badge
 *
 * Small badge showing active deployment status.
 * Useful for inline display in other components.
 *
 * @example
 * ```tsx
 * <ActiveDeploymentBadge deployment={latestDeployment} />
 * ```
 */
interface ActiveDeploymentBadgeProps {
  deployment: DeploymentListItem | Deployment | null;
  className?: string;
}

export function ActiveDeploymentBadge({
  deployment,
  className,
}: ActiveDeploymentBadgeProps) {
  if (!deployment) {
    return (
      <div className={cn("text-xs text-muted-foreground", className)}>
        No active deployment
      </div>
    );
  }

  if (deployment.status !== "deployed" || !deployment.serviceUrl) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <DeploymentStatusBadge status={deployment.status} />
      </div>
    );
  }

  return (
    <a
      href={deployment.serviceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-2 text-xs text-green-600 hover:underline",
        className
      )}
    >
      <div className="h-2 w-2 rounded-full bg-green-600" />
      <span>Live</span>
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}
