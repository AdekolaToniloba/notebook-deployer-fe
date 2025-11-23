"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  Trash2,
  RotateCw,
  ArrowRight,
} from "lucide-react";

import { deploymentService } from "@/lib/api/services/deployments.service";
import { toasts } from "@/lib/toast-utils";
import type { DeploymentListItem } from "@/types/models/deployment.types"; // Import Domain Model

// Status configuration for UI
const statusConfig: Record<
  string,
  { icon: React.ElementType; color: string; label: string }
> = {
  active: {
    icon: CheckCircle2,
    color: "bg-green-100 text-green-700 border-green-700",
    label: "Active",
  },
  deployed: {
    icon: CheckCircle2,
    color: "bg-green-100 text-green-700 border-green-700",
    label: "Deployed",
  },
  building: {
    icon: Loader2,
    color: "bg-yellow-100 text-yellow-700 border-yellow-700",
    label: "Building",
  },
  error: {
    icon: AlertCircle,
    color: "bg-red-100 text-red-700 border-red-700",
    label: "Error",
  },
  inactive: {
    icon: AlertCircle,
    color: "bg-gray-100 text-gray-700 border-gray-700",
    label: "Inactive",
  },
};

export default function DeploymentsPage() {
  // unused router removed if strictly not used, but we might need it for programmatic nav if link doesn't work
  const router = useRouter();
  const [deployments, setDeployments] = useState<DeploymentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDeployments = async () => {
    try {
      // Service returns domain model (camelCase)
      const res = await deploymentService.listDeployments();
      setDeployments(res);
    } catch (err: unknown) {
      console.error("Fetch error:", err);
      toasts.general.error("Failed to load deployments");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeployments();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // Stop card click
    e.preventDefault(); // Prevent link navigation

    if (!confirm("Delete this deployment? This will shut down the service."))
      return;

    try {
      await deploymentService.deleteDeployment(id);
      setDeployments((prev) => prev.filter((d) => d.id !== id));
      toasts.general.success("Deployment Deleted");
    } catch (error: unknown) {
      console.error(error);
      toasts.general.error("Failed to delete deployment");
    }
  };

  const handleCardClick = (id: number) => {
    router.push(`/deployments/${id}`);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex justify-between items-end border-b-2 border-black pb-6 mb-8">
        <div>
          <h1 className="font-mono text-4xl font-black uppercase">
            Deployments
          </h1>
          <p className="font-mono text-gray-500 mt-2">
            Monitor your active services.
          </p>
        </div>
        <button
          onClick={fetchDeployments}
          className="p-2 border-2 border-black hover:bg-gray-100 transition-colors"
          title="Refresh list"
        >
          <RotateCw className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin h-10 w-10" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence>
            {deployments.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-black bg-gray-50">
                <p className="font-mono font-bold text-gray-500">
                  No deployments active.
                </p>
              </div>
            ) : (
              deployments.map((dep) => {
                const statusKey = dep.status?.toLowerCase() || "inactive";
                const statusInfo =
                  statusConfig[statusKey] || statusConfig.inactive;
                const StatusIcon = statusInfo.icon;

                // Safely handle nullable date
                const createdDate = dep.createdAt
                  ? new Date(dep.createdAt).toLocaleDateString()
                  : "Unknown";

                return (
                  <motion.div
                    key={dep.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onClick={() => handleCardClick(dep.id)}
                    className="group block border-2 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] transition-all cursor-pointer relative"
                  >
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-mono font-bold text-xl uppercase group-hover:underline decoration-2 underline-offset-2">
                            {dep.serviceName || "Unnamed Service"}
                          </h3>
                          <div
                            className={`flex items-center gap-1 px-2 py-0.5 border text-xs font-bold uppercase ${statusInfo.color}`}
                          >
                            <StatusIcon
                              className={`h-3 w-3 ${
                                statusKey === "building" ? "animate-spin" : ""
                              }`}
                            />
                            {statusInfo.label}
                          </div>
                        </div>
                        <p className="font-mono text-xs text-gray-500">
                          ID: {dep.id} • Created {createdDate}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 z-10">
                        {dep.serviceUrl && (
                          <a
                            href={dep.serviceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-blue-600 font-bold hover:underline flex items-center gap-1 px-2 py-1 hover:bg-blue-50"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-4 w-4" /> LIVE APP
                          </a>
                        )}

                        <div className="h-4 w-[1px] bg-gray-300 mx-2 hidden md:block" />

                        <button
                          onClick={(e) => handleDelete(e, dep.id)}
                          className="text-gray-400 hover:text-red-600 p-1 hover:bg-red-50 transition-colors"
                          title="Delete Deployment"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>

                        <ArrowRight className="h-5 w-5 text-black opacity-0 group-hover:opacity-100 transition-opacity -ml-2 group-hover:ml-0" />
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
