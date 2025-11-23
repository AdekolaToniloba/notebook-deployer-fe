/**
 * Build Detail Page
 *
 * Detailed view of a specific build with logs, status, and actions.
 */

"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  Rocket,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BuildStatusBadge } from "@/components/ui/status-badge";
import {
  BuildLogsViewer,
  LogsErrorDisplay,
} from "@/components/features/builds/BuildLogsViewer";
import { useBuild, useBuildLogs } from "@/lib/hooks/use-builds";
import { toasts } from "@/lib/toast-utils";
import { formatDistanceToNow } from "date-fns";

/**
 * Build Info Card
 */
function BuildInfoCard({
  build,
}: {
  build: NonNullable<ReturnType<typeof useBuild>["build"]>;
}) {
  return (
    <Card className="p-6">
      <h2 className="mb-4 text-lg font-semibold">Build Information</h2>

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Build ID */}
        <div>
          <dt className="text-sm text-muted-foreground">Build ID</dt>
          <dd className="mt-1 text-sm font-medium">#{build.id}</dd>
        </div>

        {/* Cloud Build ID */}
        <div>
          <dt className="text-sm text-muted-foreground">Cloud Build ID</dt>
          <dd className="mt-1">
            <code className="text-xs bg-muted px-2 py-1 rounded">
              {build.buildId}
            </code>
          </dd>
        </div>

        {/* Notebook */}
        <div>
          <dt className="text-sm text-muted-foreground">Notebook</dt>
          <dd className="mt-1">
            <Link
              href={`/dashboard/notebooks/${build.notebookId}`}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              #{build.notebookId}
            </Link>
          </dd>
        </div>

        {/* Status */}
        <div>
          <dt className="text-sm text-muted-foreground">Status</dt>
          <dd className="mt-1">
            <BuildStatusBadge status={build.status} />
          </dd>
        </div>

        {/* Created */}
        <div>
          <dt className="text-sm text-muted-foreground">Created</dt>
          <dd className="mt-1 text-sm">
            {formatDistanceToNow(build.createdAt, { addSuffix: true })}
          </dd>
        </div>

        {/* Duration */}
        {build.startedAt && build.finishedAt && (
          <div>
            <dt className="text-sm text-muted-foreground">Duration</dt>
            <dd className="mt-1 text-sm font-medium">
              {Math.round(
                (build.finishedAt.getTime() - build.startedAt.getTime()) / 1000
              )}{" "}
              seconds
            </dd>
          </div>
        )}

        {/* Image */}
        <div className="sm:col-span-2">
          <dt className="text-sm text-muted-foreground">Container Image</dt>
          <dd className="mt-1">
            <code className="text-xs bg-muted px-2 py-1 rounded break-all">
              {build.imageName}
            </code>
          </dd>
        </div>
      </dl>
    </Card>
  );
}

/**
 * Build Actions Card
 */
function BuildActionsCard({
  build,
  onRefresh,
  isRefreshing,
}: {
  build: NonNullable<ReturnType<typeof useBuild>["build"]>;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  const router = useRouter();

  return (
    <Card className="p-6">
      <h2 className="mb-4 text-lg font-semibold">Actions</h2>

      <div className="space-y-3">
        {/* Refresh Status */}
        {(build.status === "building" || build.status === "queued") && (
          <Button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="w-full"
            variant="outline"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh Status
          </Button>
        )}

        {/* Deploy */}
        {build.status === "success" && (
          <Button
            onClick={() =>
              router.push(`/dashboard/notebooks/${build.notebookId}/deploy`)
            }
            className="w-full"
          >
            <Rocket className="mr-2 h-4 w-4" />
            Deploy This Build
          </Button>
        )}

        {/* View in Cloud Console */}
        {build.logUrl && (
          <Button asChild variant="outline" className="w-full">
            <a href={build.logUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              View in Cloud Console
            </a>
          </Button>
        )}

        {/* View Notebook */}
        <Button
          onClick={() =>
            router.push(`/dashboard/notebooks/${build.notebookId}`)
          }
          variant="outline"
          className="w-full"
        >
          View Notebook
        </Button>
      </div>
    </Card>
  );
}

/**
 * Build Detail Page
 */
export default function BuildDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const buildId = parseInt(id, 10);
  const router = useRouter();

  const [showFullLogs, setShowFullLogs] = useState(false);

  // Fetch build with auto-polling if in progress
  const { build, loading, refresh, isPolling } = useBuild(buildId, {
    autoPoll: true,
  });

  // Fetch logs
  const { logs, loading: logsLoading, fetchLogs } = useBuildLogs(buildId);

  // Load logs on mount
  const [logsData, setLogsData] = useState<string | null>(null);
  const [logsError, setLogsError] = useState(false);

  const loadLogs = async () => {
    const data = await fetchLogs();
    if (data) {
      setLogsData(data);
    } else {
      setLogsError(true);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    await refresh();
    toasts.build.refreshed(buildId);
  };

  if (loading && !build) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading build details...</p>
        </div>
      </div>
    );
  }

  if (!build) {
    return (
      <div className="text-center py-12">
        <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold">Build Not Found</h2>
        <p className="mt-2 text-muted-foreground">
          The build you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button
          className="mt-4"
          onClick={() => router.push("/dashboard/builds")}
        >
          Back to Builds
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/builds"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Builds
        </Link>
        <div className="mt-4 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Build #{build.id}</h1>
            <p className="mt-2 text-muted-foreground">
              {formatDistanceToNow(build.createdAt, { addSuffix: true })}
            </p>
          </div>
          {isPolling && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <div className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
              <span>Auto-refreshing...</span>
            </div>
          )}
        </div>
      </div>

      {/* Error Message (if failed) */}
      {build.status === "failed" && build.errorMessage && (
        <Card className="border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Build Failed</h3>
              <p className="mt-1 text-sm text-red-800">{build.errorMessage}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Success Message */}
      {build.status === "success" && (
        <Card className="border-green-200 bg-green-50 p-6">
          <div className="flex items-start gap-3">
            <RefreshCw className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-900">Build Successful</h3>
              <p className="mt-1 text-sm text-green-800">
                Container image built successfully. You can now deploy this
                build.
              </p>
            </div>
            <Button
              onClick={() =>
                router.push(`/dashboard/notebooks/${build.notebookId}/deploy`)
              }
            >
              Deploy Now
            </Button>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Build Info */}
          <BuildInfoCard build={build} />

          {/* Logs */}
          {build.status !== "queued" && (
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Build Logs</h2>
                {!logsData && !logsError && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={loadLogs}
                    disabled={logsLoading}
                  >
                    Load Logs
                  </Button>
                )}
              </div>

              {logsData ? (
                <>
                  {/* Error summary */}
                  {build.status === "failed" && !showFullLogs && (
                    <div className="mb-4">
                      <LogsErrorDisplay logs={logsData} />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowFullLogs(true)}
                        className="mt-4"
                      >
                        Show Full Logs
                      </Button>
                    </div>
                  )}

                  {/* Full logs */}
                  {(showFullLogs || build.status !== "failed") && (
                    <BuildLogsViewer
                      logs={logsData}
                      buildId={buildId}
                      showLineNumbers
                    />
                  )}
                </>
              ) : logsError ? (
                <p className="text-sm text-muted-foreground">
                  Failed to load logs. Try refreshing the page.
                </p>
              ) : logsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Click &quot;Load Logs&quot; to view build output.
                </p>
              )}
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <BuildActionsCard
            build={build}
            onRefresh={handleRefresh}
            isRefreshing={loading}
          />
        </div>
      </div>
    </div>
  );
}
