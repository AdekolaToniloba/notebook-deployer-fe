"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { notebookService } from "@/lib/api/services/notebooks.service";
import { deploymentService } from "@/lib/api/services/deployments.service";
import { toasts } from "@/lib/toast-utils";
import type { ModelVersion } from "@/lib/validations/notebook.schemas";
import { Button } from "@/components/ui/button";
import { Zap, Trash2, Replace, Loader2 } from "lucide-react"; // Removed unused 'Upload' and 'CheckCircle'

// Define a reusable error type for API responses
interface ApiError {
  response?: {
    data?: {
      detail?: string | { msg: string }[];
    };
  };
  message?: string;
}

interface ModelManagerProps {
  notebookId: number;
  deploymentId?: number;
}

export function ModelManager({ notebookId, deploymentId }: ModelManagerProps) {
  const [versions, setVersions] = useState<ModelVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const fetchModels = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await notebookService.listModelVersions(notebookId);
      setVersions(data.versions);
    } catch (error: unknown) {
      // FIX: Use 'error' variable and type as unknown
      console.error("Failed to load model versions:", error);
      toasts.general.error("Failed to load model versions.");
    } finally {
      setIsLoading(false);
    }
  }, [notebookId]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const handleReplaceModel = async (file: File) => {
    setIsUploading(true);
    try {
      const newVersion = await notebookService.replaceActiveModel(
        notebookId,
        file
      );
      toasts.general.success(
        "Model Replaced",
        `Version ${newVersion.version} is now active.`
      );

      if (deploymentId) {
        toasts.general.info(
          "Triggering Hot-Reload",
          "Your live service will be updated momentarily."
        );
        await deploymentService.reloadModel(deploymentId);
        toasts.general.success("Hot-Reload Complete!");
      }

      await fetchModels(); // Refresh list
    } catch (error: unknown) {
      // FIX: Use 'error' variable and type as unknown
      const err = error as ApiError;
      let message = "Failed to replace model.";
      if (typeof err.response?.data?.detail === "string") {
        message = err.response.data.detail;
      } else if (Array.isArray(err.response?.data?.detail)) {
        message = err.response.data.detail[0]?.msg || message;
      }
      toasts.general.error("Replacement Failed", message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleReplaceModel(e.target.files[0]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="border-2 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
    >
      <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-black">
        <h2 className="text-2xl font-black uppercase">Model Versions</h2>
        <div className="relative">
          <Button
            className="bg-[#FFDE59] text-black border-2 border-black rounded-none font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="animate-spin mr-2" />
            ) : (
              <Replace className="mr-2" />
            )}
            {isUploading ? "Uploading..." : "Replace Active Model"}
          </Button>
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileChange}
            accept=".pkl,.h5,.pt"
            disabled={isUploading}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin h-8 w-8" />
        </div>
      ) : versions.length === 0 ? (
        <p className="text-gray-500 italic">
          No model versions uploaded for this notebook yet.
        </p>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {versions.map((version) => (
              <motion.div
                key={version.version}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`flex items-center justify-between p-4 border-2 border-black ${
                  version.is_active ? "bg-green-100" : "bg-gray-50"
                }`}
              >
                <div>
                  <h4 className="font-bold">Version {version.version}</h4>
                  <p className="text-xs text-gray-500">
                    Uploaded: {new Date(version.uploaded_at).toLocaleString()}
                  </p>
                  {version.accuracy && (
                    <p className="text-xs">
                      Accuracy: {parseFloat(version.accuracy).toFixed(4)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {version.is_active ? (
                    <span className="flex items-center gap-2 text-green-700 font-bold text-sm">
                      <Zap /> ACTIVE
                    </span>
                  ) : (
                    <Button variant="ghost" size="sm">
                      Activate
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
