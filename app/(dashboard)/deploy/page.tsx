"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileCode,
  Box,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Globe,
  Terminal as TerminalIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { notebookService } from "@/lib/api/services/notebooks.service";
import { deploymentService } from "@/lib/api/services/deployments.service";
import { toasts } from "@/lib/toast-utils";
import { LogTerminal } from "@/components/deployments/log-terminal"; // Import the terminal

// --- Types ---
type DeployStep = "upload" | "config" | "deploying";

interface ApiErrorResponse {
  response?: {
    data?: {
      detail?: Array<{ msg: string; loc: string[] }> | string;
    };
  };
  message?: string;
}

// --- Components ---
const StepIndicator = ({ step }: { step: DeployStep }) => (
  <div className="flex items-center gap-4 mb-12 font-mono text-sm font-bold">
    <div
      className={`px-3 py-1 border-2 border-black ${
        step === "upload" ? "bg-black text-white" : "bg-white text-gray-400"
      }`}
    >
      01 UPLOAD
    </div>
    <div className="h-0.5 w-8 bg-black" />
    <div
      className={`px-3 py-1 border-2 border-black ${
        step === "config" ? "bg-black text-white" : "bg-white text-gray-400"
      }`}
    >
      02 CONFIG
    </div>
    <div className="h-0.5 w-8 bg-black" />
    <div
      className={`px-3 py-1 border-2 border-black ${
        step === "deploying" ? "bg-black text-white" : "bg-white text-gray-400"
      }`}
    >
      03 DEPLOY
    </div>
  </div>
);

export default function DeployPage() {
  const router = useRouter();
  const [step, setStep] = useState<DeployStep>("upload");

  // Form State
  const [notebookFile, setNotebookFile] = useState<File | null>(null);
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [appName, setAppName] = useState("");
  const [region, setRegion] = useState("us-central1");

  // Process State
  const [notebookId, setNotebookId] = useState<number | null>(null);
  const [deploymentId, setDeploymentId] = useState<number | null>(null); // Track created deployment ID
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("Initializing..."); // Simple status text above terminal

  // Handle File Inputs
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "notebook" | "model"
  ) => {
    if (e.target.files && e.target.files[0]) {
      if (type === "notebook") setNotebookFile(e.target.files[0]);
      else setModelFile(e.target.files[0]);
    }
  };

  // Main Deployment Logic
  const startDeployment = async () => {
    if (!notebookFile) return;

    setStep("deploying");
    setIsDeploying(true);
    setStatusMessage("Uploading assets...");

    try {
      // --- STEP 1: UPLOAD ---
      const notebook = await notebookService.uploadNotebook(
        notebookFile,
        modelFile
      );
      setNotebookId(notebook.id);
      setStatusMessage("Parsing notebook structure...");

      // --- STEP 2: PARSE ---
      await notebookService.parseNotebook(notebook.id);
      setStatusMessage("Running AI Security Analysis...");

      // --- STEP 3: ANALYZE ---
      const analysis = await notebookService.analyzeNotebook(notebook.id);
      if (analysis.health_score < 50) {
        toasts.general.warning("Low Health Score", "Proceeding with caution.");
      }

      // --- STEP 4: CREATE DEPLOYMENT ---
      setStatusMessage(`Initiating Cloud Build in ${region}...`);

      const deployment = await deploymentService.createDeployment({
        notebookId: notebook.id,
        config: {
          name: appName,
          region: region,
        },
      });

      // Set ID to trigger the LogTerminal
      setDeploymentId(deployment.id);
      setStatusMessage("Build in progress. Streaming logs...");

      if (deployment.serviceUrl) {
        // Immediate success (rare for async builds, but possible)
        setDeploymentUrl(deployment.serviceUrl);
        toasts.deployment.success(deployment.id, deployment.serviceUrl);
        setIsDeploying(false);
        setStatusMessage("Deployment Complete!");
      } else {
        // Async build started - The LogTerminal will handle showing the progress
        toasts.general.info(
          "Build Started",
          "Streaming build logs from Cloud Run..."
        );

        // Optional: Poll or wait for terminal to show completion (or just let user watch)
        // In a real app, you might want to poll status here to update the "Open API" button
        // But for this flow, we'll let them watch the logs.
      }
    } catch (error: unknown) {
      const err = error as ApiErrorResponse;
      let message = "Unknown error";

      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          message = err.response.data.detail[0]?.msg || message;
        } else {
          message = err.response.data.detail;
        }
      } else if (err.message) {
        message = err.message;
      }

      setStatusMessage("Deployment Failed.");
      toasts.general.error("Pipeline Failed", message);
      setIsDeploying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <h1 className="font-mono text-4xl font-black uppercase mb-8">
          New Deployment
        </h1>
        <StepIndicator step={step} />

        <div className="border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 min-h-[600px] relative flex flex-col">
          <AnimatePresence mode="wait">
            {/* STEP 1: UPLOAD */}
            {step === "upload" && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <h2 className="font-mono text-2xl font-bold uppercase">
                  Select Files
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div
                    className={`border-2 border-dashed p-8 flex flex-col items-center gap-4 transition-colors ${
                      notebookFile
                        ? "border-green-500 bg-green-50"
                        : "border-black hover:bg-gray-50"
                    }`}
                  >
                    <FileCode className="h-12 w-12" />
                    <div className="text-center">
                      <p className="font-bold font-mono uppercase">
                        Notebook (.ipynb)
                      </p>
                      <p className="text-xs text-gray-500 mt-1">REQUIRED</p>
                    </div>
                    <input
                      type="file"
                      accept=".ipynb"
                      onChange={(e) => handleFileChange(e, "notebook")}
                      className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:border-2 file:border-black file:bg-[#B6DFF] file:font-mono file:font-bold"
                    />
                    {notebookFile && (
                      <p className="text-xs text-green-600 font-bold">
                        ✓ {notebookFile.name}
                      </p>
                    )}
                  </div>
                  <div
                    className={`border-2 border-dashed p-8 flex flex-col items-center gap-4 transition-colors ${
                      modelFile
                        ? "border-green-500 bg-green-50"
                        : "border-black hover:bg-gray-50"
                    }`}
                  >
                    <Box className="h-12 w-12" />
                    <div className="text-center">
                      <p className="font-bold font-mono uppercase">
                        Model (.pkl/.h5)
                      </p>
                      <p className="text-xs text-gray-500 mt-1">OPTIONAL</p>
                    </div>
                    <input
                      type="file"
                      accept=".pkl,.h5,.pt"
                      onChange={(e) => handleFileChange(e, "model")}
                      className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:border-2 file:border-black file:bg-[#FFDE59] file:font-mono file:font-bold"
                    />
                    {modelFile && (
                      <p className="text-xs text-green-600 font-bold">
                        ✓ {modelFile.name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end pt-8">
                  <Button
                    onClick={() => setStep("config")}
                    disabled={!notebookFile}
                    className="h-12 px-8 rounded-none border-2 border-black bg-black text-white font-mono font-bold hover:bg-gray-800 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    NEXT STEP <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: CONFIG */}
            {step === "config" && (
              <motion.div
                key="config"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <h2 className="font-mono text-2xl font-bold uppercase">
                  Configuration
                </h2>
                <div className="space-y-6">
                  <div className="border-2 border-black p-4 bg-gray-50">
                    <label className="font-mono font-bold block mb-2">
                      SERVICE NAME
                    </label>
                    <input
                      type="text"
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      placeholder="my-awesome-api"
                      className="w-full p-3 border-2 border-black font-mono focus:outline-none focus:bg-[#B6DFF] transition-colors"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Leave blank for auto-generated name
                    </p>
                  </div>
                  <div className="border-2 border-black p-4 bg-gray-50">
                    <label className="font-mono font-bold block mb-2">
                      REGION
                    </label>
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full p-3 border-2 border-black bg-white font-mono focus:outline-none focus:ring-2 focus:ring-black"
                    >
                      <option value="us-central1">us-central1 (Iowa)</option>
                      <option value="europe-west1">
                        europe-west1 (Belgium)
                      </option>
                      <option value="asia-east1">asia-east1 (Taiwan)</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-between pt-8">
                  <Button
                    variant="ghost"
                    onClick={() => setStep("upload")}
                    className="font-mono font-bold hover:bg-gray-100"
                  >
                    BACK
                  </Button>
                  <Button
                    onClick={startDeployment}
                    className="h-12 px-8 rounded-none border-2 border-black bg-[#FFDE59] text-black font-mono font-bold hover:bg-[#ffe580] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    LAUNCH DEPLOYMENT <CheckCircle2 className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: DEPLOYING (TERMINAL VIEW) */}
            {step === "deploying" && (
              <motion.div
                key="deploying"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col flex-1"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-mono text-2xl font-bold uppercase flex items-center gap-2">
                    {isDeploying ? (
                      <Loader2 className="animate-spin h-6 w-6" />
                    ) : (
                      <TerminalIcon className="text-green-600 h-6 w-6" />
                    )}
                    {statusMessage}
                  </h2>
                  {notebookId && (
                    <span className="text-xs font-mono text-gray-500">
                      Notebook #{notebookId}
                    </span>
                  )}
                </div>

                {/* 
                   Show terminal only after deployment is created (ID exists).
                   Before that, show a placeholder or earlier steps logs if you wanted to keep them.
                   For now, we switch to this view when creating the deployment.
                */}
                {deploymentId ? (
                  <div className="flex-1 min-h-[400px]">
                    <LogTerminal
                      deploymentId={deploymentId}
                      autoStream={true} // Enable auto-streaming immediately
                      className="h-full w-full"
                    />
                  </div>
                ) : (
                  <div className="flex-1 min-h-[400px] border-2 border-black bg-gray-100 flex items-center justify-center flex-col gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
                    <p className="font-mono font-bold text-gray-500">
                      Preparing Build Environment...
                    </p>
                  </div>
                )}

                {/* Success State / Deployment URL */}
                {deploymentUrl && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 bg-green-100 border-2 border-black flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="flex-1">
                      <p className="font-bold font-mono text-xs text-gray-500 mb-1">
                        API ENDPOINT READY
                      </p>
                      <a
                        href={deploymentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold font-mono text-sm underline flex items-center gap-2 hover:text-green-700 break-all"
                      >
                        {deploymentUrl}{" "}
                        <Globe className="h-4 w-4 flex-shrink-0" />
                      </a>
                    </div>
                    <Button
                      onClick={() => window.open(deploymentUrl, "_blank")}
                      className="bg-black text-white font-mono font-bold rounded-none border-2 border-transparent hover:border-black hover:bg-white hover:text-black transition-all whitespace-nowrap"
                    >
                      OPEN API
                    </Button>
                  </motion.div>
                )}

                {!isDeploying && !deploymentUrl && (
                  <div className="mt-6 flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => router.push("/deployments")}
                      className="font-mono font-bold"
                    >
                      GO TO DASHBOARD
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
