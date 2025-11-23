/**
 * Manual Deploy Page
 *
 * Step-by-step deployment flow for a specific notebook.
 * Gives users control over each stage: build → deploy.
 */

"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play, Rocket, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BuildStatusBadge } from "@/components/ui/status-badge";
import { DeploymentConfigForm } from "@/components/features/deployments/DeploymentConfigForm";
import { BuildCard } from "@/components/features/builds/BuildCard";
import { DeploymentCard } from "@/components/features/deployments/DeploymentCard";
import { useNotebook } from "@/lib/hooks/use-notebooks";
import { useNotebookBuilds, useBuild } from "@/lib/hooks/use-builds";
import {
  useNotebookDeployments,
  useDeployment,
} from "@/lib/hooks/use-deployments";
import { toasts } from "@/lib/toast-utils";
import type { DeploymentConfig } from "@/types/models/deployment.types";

/**
 * Deployment Step Indicator
 */
function DeploymentStepIndicator({
  currentStep,
}: {
  currentStep: "build" | "deploy" | "complete";
}) {
  const steps = [
    { id: "build", label: "Build Container", icon: Play },
    { id: "deploy", label: "Deploy to Cloud", icon: Rocket },
    { id: "complete", label: "Live", icon: CheckCircle2 },
  ];

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = step.id === currentStep;
        const isComplete =
          steps.findIndex((s) => s.id === currentStep) >
          steps.findIndex((s) => s.id === step.id);
        const isLast = index === steps.length - 1;

        return (
          <div key={step.id} className="flex flex-1 items-center">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                  isComplete
                    ? "border-green-600 bg-green-600 text-white"
                    : isActive
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-muted-foreground/30 text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p
                  className={`text-sm font-medium ${
                    isComplete || isActive
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </p>
              </div>
            </div>
            {!isLast && (
              <div
                className={`mx-4 h-0.5 flex-1 ${
                  isComplete ? "bg-green-600" : "bg-muted-foreground/20"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Manual Deploy Page
 */
export default function ManualDeployPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const notebookId = parseInt(id, 10);
  const router = useRouter();

  const [showDeployForm, setShowDeployForm] = useState(false);

  // Fetch notebook and related data
  const { notebook, loading: notebookLoading } = useNotebook(notebookId, {
    autoFetch: true,
  });
  const {
    builds,
    triggerBuild,
    loading: buildsLoading,
  } = useNotebookBuilds(notebookId, { autoFetch: true });
  const {
    deployments,
    latestDeployment,
    createDeployment,
    loading: deploymentsLoading,
  } = useNotebookDeployments(notebookId, { autoFetch: true });

  // Get latest build
  const latestBuild = builds[0];

  // Auto-poll latest build if in progress
  const { build: pollingBuild } = useBuild(latestBuild?.id || 0, {
    autoPoll:
      latestBuild?.status === "building" || latestBuild?.status === "queued",
  });

  // Auto-poll latest deployment if in progress
  const { deployment: pollingDeployment } = useDeployment(
    latestDeployment?.id || 0,
    {
      autoPoll:
        latestDeployment?.status === "deploying" ||
        latestDeployment?.status === "updating",
    }
  );

  // Determine current step
  const currentStep = (() => {
    if (latestDeployment?.status === "deployed") return "complete";
    if (latestBuild?.status === "success") return "deploy";
    return "build";
  })();

  // Handle build trigger
  const handleTriggerBuild = async () => {
    const build = await triggerBuild();
    if (build) {
      toasts.build.triggered(build.id, notebookId);
    }
  };

  // Handle deployment
  const handleDeploy = async (config: DeploymentConfig) => {
    if (!latestBuild) return;

    const deployment = await createDeployment({
      buildId: latestBuild.id,
      config,
    });

    if (deployment) {
      toasts.deployment.started(deployment.id, notebookId);
      setShowDeployForm(false);
    }
  };

  if (notebookLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading notebook...</p>
        </div>
      </div>
    );
  }

  if (!notebook) {
    return (
      <div className="text-center py-12">
        <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold">Notebook Not Found</h2>
        <p className="mt-2 text-muted-foreground">
          The notebook you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button
          className="mt-4"
          onClick={() => router.push("/dashboard/notebooks")}
        >
          Back to Notebooks
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/dashboard/notebooks/${notebookId}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Notebook
        </Link>
        <h1 className="mt-4 text-3xl font-bold">Manual Deploy</h1>
        <p className="mt-2 text-muted-foreground">{notebook.name}</p>
      </div>

      {/* Progress Indicator */}
      <Card className="p-6">
        <DeploymentStepIndicator currentStep={currentStep} />
      </Card>

      {/* Step 1: Build */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Step 1: Build Container</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a Docker container image from your notebook.
            </p>
          </div>

          {!latestBuild && (
            <Button onClick={handleTriggerBuild} disabled={buildsLoading}>
              <Play className="mr-2 h-4 w-4" />
              Start Build
            </Button>
          )}
        </div>

        {/* Latest Build */}
        {latestBuild && (
          <div className="mt-6">
            <BuildCard
              build={pollingBuild || latestBuild}
              onRefresh={handleTriggerBuild}
              showActions
            />
          </div>
        )}

        {/* Build History */}
        {builds.length > 1 && (
          <div className="mt-6">
            <details className="group">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                View previous builds ({builds.length - 1})
              </summary>
              <div className="mt-4 space-y-4">
                {builds.slice(1).map((build) => (
                  <BuildCard key={build.id} build={build} showActions={false} />
                ))}
              </div>
            </details>
          </div>
        )}
      </Card>

      {/* Step 2: Deploy */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Step 2: Deploy to Cloud</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Deploy your container to Google Cloud Run.
            </p>
          </div>

          {latestBuild?.status === "success" && !showDeployForm && (
            <Button
              onClick={() => setShowDeployForm(true)}
              disabled={deploymentsLoading}
            >
              <Rocket className="mr-2 h-4 w-4" />
              Deploy Now
            </Button>
          )}
        </div>

        {/* Requirements */}
        {!latestBuild && (
          <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">
              Complete the build step first before deploying.
            </p>
          </div>
        )}

        {latestBuild?.status === "building" && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              Waiting for build to complete...
            </p>
          </div>
        )}

        {latestBuild?.status === "failed" && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">
              Build failed. Please fix the errors and try again.
            </p>
          </div>
        )}

        {/* Deploy Form */}
        {showDeployForm && latestBuild?.status === "success" && (
          <div className="mt-6">
            <DeploymentConfigForm
              onSubmit={handleDeploy}
              onCancel={() => setShowDeployForm(false)}
              isSubmitting={deploymentsLoading}
            />
          </div>
        )}

        {/* Latest Deployment */}
        {latestDeployment && !showDeployForm && (
          <div className="mt-6">
            <DeploymentCard
              deployment={pollingDeployment || latestDeployment}
              showActions
            />
          </div>
        )}

        {/* Deployment History */}
        {deployments.length > 1 && !showDeployForm && (
          <div className="mt-6">
            <details className="group">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                View previous deployments ({deployments.length - 1})
              </summary>
              <div className="mt-4 space-y-4">
                {deployments.slice(1).map((deployment) => (
                  <DeploymentCard
                    key={deployment.id}
                    deployment={deployment}
                    showActions={false}
                  />
                ))}
              </div>
            </details>
          </div>
        )}
      </Card>

      {/* Success State */}
      {latestDeployment?.status === "deployed" &&
        latestDeployment.serviceUrl && (
          <Card className="border-green-200 bg-green-50 p-6">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900">
                  Deployment Successful!
                </h3>
                <p className="mt-1 text-sm text-green-800">
                  Your notebook is now live and accessible at:
                </p>
                <a
                  href={latestDeployment.serviceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm font-medium text-green-700 hover:underline"
                >
                  {latestDeployment.serviceUrl}
                </a>
              </div>
              <Button asChild>
                <a
                  href={latestDeployment.serviceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit App
                </a>
              </Button>
            </div>
          </Card>
        )}
    </div>
  );
}
