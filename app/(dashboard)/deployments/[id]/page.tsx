"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Globe,
  Trash2,
  Download, // Used now
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Box,
  ShieldAlert,
  Zap,
  FileArchive,
  Terminal as TerminalIcon,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  deploymentService,
  type DeploymentDetailResponse,
} from "@/lib/api/services/deployments.service";
import { logsService } from "@/lib/api/services/logs.service";
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
import type { LogEntry } from "@/types/models/logs.types";

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
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
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

        // Fetch logs immediately after deployment details
        fetchLogs(deploymentId);
      } catch (error: unknown) {
        toasts.general.error("Failed to load details", getErrorMessage(error));
        router.push("/deployments");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [deploymentId, router]);

  const fetchLogs = async (id: number) => {
    setLoadingLogs(true);
    try {
      const logData = await logsService.getDeploymentLogs(id);
      setLogs(logData.entries);
    } catch (error) {
      console.error("Failed to fetch logs", error);
    } finally {
      setLoadingLogs(false);
    }
  };

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

  const handleDownloadSource = async () => {
    try {
      setIsActionLoading(true);
      toasts.general.info("Preparing Download", "Fetching source artifacts...");
      const content = await deploymentService.downloadDeployment(deploymentId);

      const blob = new Blob([content], { type: "application/gzip" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `deployment-${deploymentId}-source.tar.gz`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
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

  const handleDownloadLogs = async () => {
    try {
      toasts.general.info("Fetching Logs", "Downloading text logs...");
      await logsService.downloadLogs(deploymentId);
      toasts.general.success("Logs Downloaded");
    } catch (error) {
      console.error("Log download error:", error); // Used 'error'
      toasts.general.error("Failed to download logs");
    }
  };

  const handleReloadModel = async () => {
    try {
      setIsActionLoading(true);
      toasts.general.info("Reloading Model", "Triggering hot-reload...");
      await deploymentService.reloadModel(deploymentId);
      toasts.general.success("Model reload triggered");
    } catch (error: unknown) {
      toasts.general.error("Failed to reload model", getErrorMessage(error));
    } finally {
      setIsActionLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toasts.general.success("Copied to clipboard");
  };

  if (isLoading)
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#f4f4f0]">
        <div className="flex flex-col items-center gap-4 border-4 border-black p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <Loader2 className="animate-spin h-12 w-12 text-black" />
          <p className="font-mono font-bold uppercase animate-pulse">
            Loading Mission Control...
          </p>
        </div>
      </div>
    );
  if (!deployment) return null;

  const isLive =
    deployment.status.toLowerCase() === "active" ||
    deployment.status.toLowerCase() === "deployed";
  const isError =
    deployment.status.toLowerCase().includes("error") ||
    deployment.status.toLowerCase().includes("fail");
  const serviceUrlWithDocs = deployment.service_url
    ? `${deployment.service_url.replace(/\/$/, "")}/docs`
    : null;

  return (
    <div className="p-4 md:p-8 lg:p-12 max-w-7xl mx-auto min-h-screen font-mono bg-[#f4f4f0]">
      {/* Header Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 md:mb-12"
      >
        <Link
          href="/deployments"
          className="inline-flex items-center text-sm font-bold hover:underline mb-6 group"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />{" "}
          BACK TO FLEET
        </Link>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-b-4 border-black pb-6">
          <div className="w-full lg:w-auto">
            <div className="flex items-center gap-3 mb-2">
              <Box className="h-6 w-6 md:h-8 md:w-8 stroke-[2.5px] shrink-0" />
              <h1 className="text-2xl md:text-4xl lg:text-6xl font-black uppercase tracking-tighter break-all leading-none">
                {deployment.name}
              </h1>
            </div>
            <div className="flex flex-wrap gap-2 md:gap-4 text-xs md:text-sm font-bold text-gray-500 uppercase tracking-wide">
              <span className="flex items-center gap-1 bg-white px-2 py-1 border border-black">
                <Clock className="h-3 w-3 md:h-4 md:w-4" />{" "}
                {new Date(deployment.created_at).toLocaleDateString()}
              </span>
              <span className="bg-white px-2 py-1 border border-black">
                ID: {deployment.id}
              </span>
              <span className="bg-white px-2 py-1 border border-black">
                Region: {deployment.region}
              </span>
            </div>
          </div>

          <div
            className={`w-full lg:w-auto px-4 py-2 md:px-6 md:py-3 border-4 border-black font-black uppercase flex items-center justify-center lg:justify-start gap-3 text-sm md:text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 ${
              isLive
                ? "bg-[#D6FFB7]"
                : isError
                ? "bg-[#FF9EAA]"
                : "bg-[#FFDE59]"
            }`}
          >
            {isLive ? (
              <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 stroke-[3px]" />
            ) : isError ? (
              <AlertCircle className="h-5 w-5 md:h-6 md:w-6 stroke-[3px]" />
            ) : (
              <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin stroke-[3px]" />
            )}
            {deployment.status}
          </div>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Operational Area */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-8 order-2 lg:order-1"
        >
          {/* 1. Endpoint Card */}
          <div className="border-4 border-black bg-white p-4 md:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 bg-black text-white px-3 py-1 text-[10px] md:text-xs font-bold uppercase">
              Public Interface
            </div>
            <h3 className="font-black text-xl md:text-2xl uppercase mb-6 flex items-center gap-3">
              <Globe className="h-5 w-5 md:h-6 md:w-6" /> Service Endpoint
            </h3>

            {serviceUrlWithDocs ? (
              <div className="flex flex-col gap-4">
                <div className="bg-gray-100 p-4 border-2 border-black font-mono text-xs md:text-sm break-all relative group-hover:bg-[#B6DFFF] transition-colors">
                  <span className="text-gray-400 absolute top-2 right-2 text-[10px] font-bold">
                    SWAGGER DOCS
                  </span>
                  {serviceUrlWithDocs}
                  <button
                    onClick={() => copyToClipboard(serviceUrlWithDocs)}
                    className="absolute bottom-2 right-2 p-1 hover:bg-white border border-black transition-colors"
                    title="Copy URL"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex gap-4">
                  <Button
                    onClick={() => window.open(serviceUrlWithDocs, "_blank")}
                    className="flex-1 bg-black text-white border-4 border-transparent hover:bg-white hover:text-black hover:border-black rounded-none font-bold h-12 md:h-14 text-sm md:text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all active:translate-y-1"
                  >
                    LAUNCH INTERFACE{" "}
                    <Globe className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-black p-8 text-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 opacity-50" />
                <p className="text-gray-500 italic font-bold uppercase text-sm">
                  Endpoint Provisioning...
                </p>
              </div>
            )}
          </div>

          {/* 2. Model Manager Component */}
          <ModelManager
            notebookId={deployment.notebook_id}
            deploymentId={deployment.id}
          />

          {/* 3. System Logs Viewer */}
          <div className="relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <h3 className="font-black text-lg md:text-xl uppercase flex items-center gap-2">
                <TerminalIcon className="h-5 w-5 md:h-6 md:w-6" /> System Logs
              </h3>
              <Button
                onClick={handleDownloadLogs}
                size="sm"
                className="w-full sm:w-auto border-2 border-black bg-[#FFDE59] text-black hover:bg-black hover:text-[#FFDE59] font-bold uppercase rounded-none"
              >
                <Download className="h-4 w-4 mr-2" /> Download Log File
              </Button>
            </div>

            {/* Log Viewer Container */}
            <div className="border-4 border-black bg-[#1a1a1a] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] h-80 md:h-96 flex flex-col">
              {/* Logs Header */}
              <div className="bg-black p-2 flex justify-between items-center px-4">
                <span className="text-white font-bold text-[10px] md:text-xs uppercase tracking-widest">
                  Build & Runtime History
                </span>
                <div className="flex gap-2">
                  <div className="w-2 h-2 md:w-3 md:h-3 bg-red-500 rounded-full" />
                  <div className="w-2 h-2 md:w-3 md:h-3 bg-yellow-500 rounded-full" />
                  <div className="w-2 h-2 md:w-3 md:h-3 bg-green-500 rounded-full" />
                </div>
              </div>

              {/* Log Content */}
              <div className="flex-1 overflow-y-auto p-2 md:p-4 font-mono text-xs md:text-sm space-y-1 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-[#1a1a1a]">
                {loadingLogs ? (
                  <div className="h-full flex items-center justify-center text-gray-500 gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" /> Fetching
                    telemetry...
                  </div>
                ) : logs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-600 italic">
                    No logs available for this deployment yet.
                  </div>
                ) : (
                  logs.map((log, i) => (
                    <div
                      key={i}
                      className="flex flex-col sm:flex-row sm:gap-3 hover:bg-white/5 p-1 -mx-1 px-2 transition-colors group border-l-2 border-transparent hover:border-white/20"
                    >
                      <div className="flex gap-2 sm:block shrink-0">
                        <span className="text-gray-500 text-[10px] sm:text-xs w-36 block">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                        <span
                          className={`text-[10px] sm:text-xs font-bold w-16 block uppercase ${
                            log.severity === "error" ||
                            log.severity === "critical"
                              ? "text-red-500"
                              : log.severity === "warning"
                              ? "text-yellow-500"
                              : "text-green-500"
                          }`}
                        >
                          [{log.severity}]
                        </span>
                      </div>
                      <span className="text-gray-300 break-all whitespace-pre-wrap group-hover:text-white mt-1 sm:mt-0">
                        {log.message}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Control Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6 order-1 lg:order-2"
        >
          <div className="border-4 border-black bg-[#B6DFFF] p-4 md:p-6 sticky top-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black text-lg md:text-xl uppercase mb-6 flex items-center gap-2 border-b-4 border-black pb-4">
              <Zap className="h-5 w-5 md:h-6 md:w-6 fill-black" /> Operations
            </h3>

            <div className="space-y-4">
              {/* Reload Model */}
              <div className="group">
                <Button
                  onClick={handleReloadModel}
                  disabled={isActionLoading}
                  className="w-full justify-start border-4 border-black bg-white text-black hover:bg-[#FFDE59] rounded-none font-bold h-12 md:h-14 text-sm md:text-base transition-all active:translate-y-1"
                >
                  <RefreshCw
                    className={`mr-3 h-4 w-4 md:h-5 md:w-5 ${
                      isActionLoading ? "animate-spin" : ""
                    }`}
                  />
                  HOT RELOAD MODEL
                </Button>
                <p className="text-[10px] font-bold uppercase mt-1 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Refreshes model artifact without downtime
                </p>
              </div>

              {/* Download Source */}
              <div className="group">
                <Button
                  onClick={handleDownloadSource}
                  disabled={isActionLoading}
                  className="w-full justify-start border-4 border-black bg-white text-black hover:bg-[#FFDE59] rounded-none font-bold h-12 md:h-14 text-sm md:text-base transition-all active:translate-y-1"
                >
                  <FileArchive className="mr-3 h-4 w-4 md:h-5 md:w-5" />
                  GET SOURCE CODE
                </Button>
                <p className="text-[10px] font-bold uppercase mt-1 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Download full container context (.tar.gz)
                </p>
              </div>

              {/* Danger Zone */}
              <div className="pt-6 mt-6 border-t-4 border-black">
                <div className="flex items-center gap-2 text-red-600 font-black uppercase text-xs md:text-sm mb-3">
                  <ShieldAlert className="h-4 w-4" /> Danger Zone
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      disabled={isActionLoading}
                      className="w-full justify-start border-4 border-red-600 bg-red-600 text-white hover:bg-red-700 hover:border-red-800 rounded-none font-bold h-12 md:h-14 text-sm md:text-base transition-all shadow-none active:translate-y-1"
                    >
                      <Trash2 className="mr-3 h-4 w-4 md:h-5 md:w-5" />{" "}
                      TERMINATE SERVICE
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-[#FFE4E6] rounded-none p-6 md:p-8 max-w-md">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-black text-2xl md:text-3xl uppercase text-red-600 mb-2">
                        Critical Action
                      </AlertDialogTitle>
                      <AlertDialogDescription className="font-mono font-bold text-black text-sm md:text-base">
                        You are about to permanently destroy this deployment.
                      </AlertDialogDescription>

                      <div className="font-mono font-bold text-black text-sm md:text-base mt-4">
                        This will:
                        <ul className="list-disc pl-4 mt-2 space-y-1 text-xs md:text-sm">
                          <li>Stop the active container</li>
                          <li>Delete the Cloud Run service</li>
                          <li>Remove DNS routing</li>
                        </ul>
                      </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-8 gap-3 md:gap-4 flex-col sm:flex-row">
                      <AlertDialogCancel className="w-full sm:w-auto flex-1 font-black border-4 border-black bg-white hover:bg-gray-100 rounded-none h-12 mt-0 uppercase">
                        Abort
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="w-full sm:w-auto flex-1 font-black bg-red-600 border-4 border-black text-white hover:bg-red-700 rounded-none h-12 uppercase"
                      >
                        Confirm Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
