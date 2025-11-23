/**
 * Build Card Component
 *
 * Displays build information in a card format.
 * Used in build lists and notebook detail views.
 *
 * Features:
 * - Build status with visual indicator
 * - Start/finish times
 * - Quick actions (view logs, refresh)
 * - Link to build details
 */

"use client";

import { ExternalLink, RefreshCw, FileText, Clock } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { BuildStatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import type { Build, BuildListItem } from "@/types/models/build.types";

/**
 * Build Card Props
 */
interface BuildCardProps {
  build: BuildListItem | Build;
  onRefresh?: (buildId: number) => void;
  onViewLogs?: (buildId: number) => void;
  isRefreshing?: boolean;
  showActions?: boolean;
  className?: string;
}

/**
 * Check if build is detailed
 */
function isBuildDetailed(build: BuildListItem | Build): build is Build {
  return "logUrl" in build;
}

/**
 * Build Card Component
 *
 * @example
 * ```tsx
 * <BuildCard
 *   build={build}
 *   onRefresh={(id) => refreshBuild(id)}
 *   onViewLogs={(id) => viewLogs(id)}
 *   showActions
 * />
 * ```
 */
export function BuildCard({
  build,
  onRefresh,
  onViewLogs,
  isRefreshing = false,
  showActions = true,
  className,
}: BuildCardProps) {
  const isDetailed = isBuildDetailed(build);
  const isInProgress = build.status === "queued" || build.status === "building";
  const isComplete = build.status === "success" || build.status === "failed";

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
          {/* Build ID and Status */}
          <div className="flex items-center gap-2 mb-2">
            <Link
              href={`/dashboard/builds/${build.id}`}
              className="text-sm font-medium hover:underline truncate"
            >
              Build #{build.id}
            </Link>
            <BuildStatusBadge status={build.status} />
          </div>

          {/* Build Details */}
          <div className="space-y-1 text-sm text-muted-foreground">
            {/* Notebook reference */}
            <div className="flex items-center gap-2">
              <span className="text-xs">Notebook ID:</span>
              <Link
                href={`/dashboard/notebooks/${build.notebookId}`}
                className="text-xs hover:underline"
              >
                #{build.notebookId}
              </Link>
            </div>

            {/* Build ID */}
            <div className="flex items-center gap-2">
              <span className="text-xs">Cloud Build ID:</span>
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded truncate">
                {build.buildId}
              </code>
            </div>

            {/* Image name */}
            <div className="flex items-center gap-2">
              <span className="text-xs">Image:</span>
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded truncate max-w-[300px]">
                {build.imageName}
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Timing Information */}
      <div className="mt-4 pt-4 border-t">
        <div className="grid grid-cols-2 gap-4 text-xs">
          {/* Created */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <div>
              <p className="font-medium">Created</p>
              <p>{formatDistanceToNow(build.createdAt, { addSuffix: true })}</p>
            </div>
          </div>

          {/* Duration (if detailed) */}
          {isDetailed && isComplete && build.startedAt && build.finishedAt && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <div>
                <p className="font-medium">Duration</p>
                <p>
                  {Math.round(
                    (build.finishedAt.getTime() - build.startedAt.getTime()) /
                      1000
                  )}
                  s
                </p>
              </div>
            </div>
          )}

          {/* In progress indicator */}
          {isInProgress && (
            <div className="flex items-center gap-2 text-blue-600">
              <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
              <p className="font-medium">Building...</p>
            </div>
          )}
        </div>

        {/* Error message (if failed) */}
        {isDetailed && build.status === "failed" && build.errorMessage && (
          <div className="mt-3 rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-xs font-medium text-red-800 mb-1">Error</p>
            <p className="text-xs text-red-700">{build.errorMessage}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="mt-4 pt-4 border-t flex gap-2">
          {/* Refresh button (for in-progress builds) */}
          {isInProgress && onRefresh && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRefresh(build.id)}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={cn("h-3 w-3 mr-2", isRefreshing && "animate-spin")}
              />
              Refresh
            </Button>
          )}

          {/* View logs button */}
          {onViewLogs && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewLogs(build.id)}
            >
              <FileText className="h-3 w-3 mr-2" />
              View Logs
            </Button>
          )}

          {/* Cloud Build console link (if detailed) */}
          {isDetailed && build.logUrl && (
            <Button size="sm" variant="outline" asChild>
              <a
                href={build.logUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto"
              >
                <ExternalLink className="h-3 w-3 mr-2" />
                Cloud Console
              </a>
            </Button>
          )}

          {/* View details link (if not detailed) */}
          {!isDetailed && (
            <Button size="sm" variant="outline" asChild className="ml-auto">
              <Link href={`/dashboard/builds/${build.id}`}>View Details</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Compact Build Card
 *
 * Minimal version for tight spaces.
 *
 * @example
 * ```tsx
 * <CompactBuildCard build={build} />
 * ```
 */
interface CompactBuildCardProps {
  build: BuildListItem | Build;
  onClick?: (buildId: number) => void;
  className?: string;
}

export function CompactBuildCard({
  build,
  onClick,
  className,
}: CompactBuildCardProps) {
  return (
    <button
      onClick={() => onClick?.(build.id)}
      className={cn(
        "w-full text-left rounded-md border bg-card p-3 hover:bg-accent transition-colors",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Build info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">Build #{build.id}</span>
            <BuildStatusBadge status={build.status} />
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {formatDistanceToNow(build.createdAt, { addSuffix: true })}
          </p>
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
 * Build List
 *
 * Container for multiple build cards.
 *
 * @example
 * ```tsx
 * <BuildList builds={builds} onRefresh={refresh} />
 * ```
 */
interface BuildListProps {
  builds: BuildListItem[] | Build[];
  onRefresh?: (buildId: number) => void;
  onViewLogs?: (buildId: number) => void;
  emptyMessage?: string;
  className?: string;
}

export function BuildList({
  builds,
  onRefresh,
  onViewLogs,
  emptyMessage = "No builds yet",
  className,
}: BuildListProps) {
  if (builds.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {builds.map((build) => (
        <BuildCard
          key={build.id}
          build={build}
          onRefresh={onRefresh}
          onViewLogs={onViewLogs}
        />
      ))}
    </div>
  );
}
