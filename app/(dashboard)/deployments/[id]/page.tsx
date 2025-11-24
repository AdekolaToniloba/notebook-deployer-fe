"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Globe,
  Terminal,
  Trash2,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  deploymentService,
  type DeploymentDetailResponse,
} from "@/lib/api/services/deployments.service";
import { toasts } from "@/lib/toast-utils";
import { ModelManager } from "@/components/features/notebooks/ModelManager";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ApiError {
  message?: string;
  response?: {
    data?: {
      detail?: string | { msg: string }[];
    };
  };
}

export default function DeploymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const deploymentId = Number(params.id);

  const [deployment, setDeployment] = useState<DeploymentDetailResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const getErrorMessage = (error: unknown): string => {
    const err = error as ApiError;
    if (typeof err.response?.data?.detail === "string") {
      return err.response.data.detail;
    }
    if (Array.isArray(err.response?.data?.detail)) {
      return err.response.data.detail[0]?.msg || "Invalid input";
    }
    return err.message || "An unknown error occurred.";
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!deploymentId || isNaN(deploymentId)) {
          toasts.general.error("Invalid Deployment ID");
          router.push("/deployments");
          return;
        }
        const data = await deploymentService.getDeployment(deploymentId);
        setDeployment(data);
      } catch (error: unknown) {
        toasts.general.error("Failed to load details", getErrorMessage(error));
        router.push("/deployments");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [deploymentId, router]);

  const handleDelete = async () => {
    try {
      setIsActionLoading(true);
      await deploymentService.deleteDeployment(deploymentId);
      toasts.general.success("Deployment deleted successfully");
      router.push("/deployments");
    } catch (error: unknown) {
      toasts.general.error(
        "Failed to delete deployment",
        getErrorMessage(error)
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setIsActionLoading(true);
      const content = await deploymentService.downloadDeployment(deploymentId);
      const blob = new Blob([content], { type: "application/gzip" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `deployment-${deploymentId}-source.tar.gz`;
      a.click();
      window.URL.revokeObjectURL(url);
      toasts.general.success("Download started");
    } catch (error: unknown) {
      toasts.general.error(
        "Failed to download artifacts",
        getErrorMessage(error)
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReloadModel = async () => {
    try {
      setIsActionLoading(true);
      await deploymentService.reloadModel(deploymentId);
      toasts.general.success("Model reload triggered");
    } catch (error: unknown) {
      toasts.general.error("Failed to reload model", getErrorMessage(error));
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading)
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin h-10 w-10" />
      </div>
    );
  if (!deployment) return null;

  const isLive =
    deployment.status.toLowerCase() === "active" ||
    deployment.status.toLowerCase() === "deployed";
  const isError =
    deployment.status.toLowerCase().includes("error") ||
    deployment.status.toLowerCase().includes("fail");

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen font-mono">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/deployments"
          className="flex items-center text-sm font-bold hover:underline mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> BACK TO LIST
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase mb-2 break-all">
              {deployment.name}
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" /> Created{" "}
                {new Date(deployment.created_at).toLocaleDateString()}
              </span>
              <span>ID: {deployment.id}</span>
              <span>Region: {deployment.region}</span>
            </div>
          </div>
          <div
            className={`px-4 py-2 border-2 border-black font-bold uppercase flex items-center gap-2 self-start md:self-auto ${
              isLive ? "bg-green-400" : isError ? "bg-red-400" : "bg-yellow-400"
            }`}
          >
            {isLive ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : isError ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <Loader2 className="h-5 w-5 animate-spin" />
            )}
            {deployment.status}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-8 order-2 lg:order-1">
          {/* Service URL */}
          <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-bold uppercase mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5" /> Service Endpoint
            </h3>
            {deployment.service_url ? (
              <div className="flex flex-col gap-4">
                <div className="bg-gray-100 p-4 border-2 border-black break-all font-mono text-sm">
                  {deployment.service_url}
                </div>
                <Button
                  onClick={() => window.open(deployment.service_url!, "_blank")}
                  className="bg-black text-white border-2 border-transparent hover:bg-white hover:text-black hover:border-black rounded-none font-bold w-full sm:w-auto"
                >
                  VISIT LIVE APP <Globe className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <p className="text-gray-500 italic">
                Service URL not available yet.
              </p>
            )}
          </div>

          {/* Model Manager */}
          <ModelManager
            notebookId={deployment.notebook_id}
            deploymentId={deployment.id}
          />

          {/* Logs */}
          <div className="border-2 border-black bg-[#1a1a1a] text-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-bold uppercase mb-4 flex items-center gap-2 text-green-400">
              <Terminal className="h-5 w-5" /> System Logs
            </h3>
            <div className="h-48 overflow-y-auto font-mono text-sm text-gray-300 space-y-1">
              <p>{">"} Initializing deployment view...</p>
              {deployment.error_message && (
                <p className="text-red-400">
                  {">"} Error: {deployment.error_message}
                </p>
              )}
              <p>
                {">"} Status: {deployment.status}
              </p>
              <p>
                {">"} Image: {deployment.image_url || "Building..."}
              </p>
            </div>
            {deployment.build_logs_url && (
              <a
                href={deployment.build_logs_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-xs font-bold text-white hover:underline border-b border-white pb-0.5"
              >
                VIEW FULL CLOUD BUILD LOGS →
              </a>
            )}
          </div>
        </div>

        {/* Right Column: Actions */}
        <div className="space-y-4 order-1 lg:order-2">
          <div className="border-2 border-black bg-gray-50 p-6 sticky top-24">
            <h3 className="font-bold uppercase mb-4">Actions</h3>
            <div className="space-y-3">
              <Button
                onClick={handleReloadModel}
                disabled={isActionLoading}
                className="w-full justify-start border-2 border-black bg-white text-black hover:bg-[#B6DFFF] rounded-none font-bold"
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${
                    isActionLoading ? "animate-spin" : ""
                  }`}
                />{" "}
                RELOAD MODEL
              </Button>
              <Button
                onClick={handleDownload}
                disabled={isActionLoading}
                className="w-full justify-start border-2 border-black bg-white text-black hover:bg-[#B6DFFF] rounded-none font-bold"
              >
                <Download className="mr-2 h-4 w-4" /> DOWNLOAD ARTIFACTS
              </Button>

              {/* Delete with Alert Dialog */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    disabled={isActionLoading}
                    className="w-full justify-start border-2 border-red-600 bg-white text-red-600 hover:bg-red-600 hover:text-white rounded-none font-bold"
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> DELETE DEPLOYMENT
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white rounded-none p-6 max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-mono font-black uppercase text-xl">
                      Delete Deployment?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="font-mono text-gray-600 font-medium">
                      This action cannot be undone. This will permanently shut
                      down the service and delete all associated resources.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="mt-6 gap-3">
                    <AlertDialogCancel className="font-mono font-bold border-2 border-black rounded-none hover:bg-gray-100 mt-0">
                      CANCEL
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="font-mono font-bold bg-red-600 text-white border-2 border-black rounded-none hover:bg-red-700"
                    >
                      DELETE
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
