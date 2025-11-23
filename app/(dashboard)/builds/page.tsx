// app/(dashboard)/builds/page.tsx
"use client";

import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Clock, Zap } from "lucide-react";

/**
 * Builds Page
 *
 * Track notebook builds and deployments:
 * - View build history
 * - Monitor build status (success, failed, building, pending)
 * - Check build duration
 * - Track timestamps
 * - Visual status indicators
 */

interface Build {
  id: string;
  notebook: string;
  status: "success" | "failed" | "building" | "pending";
  duration: string;
  timestamp: string;
}

// Dummy data - replace with API call
const dummyBuilds: Build[] = [
  {
    id: "1",
    notebook: "data-analysis.ipynb",
    status: "success",
    duration: "2m 34s",
    timestamp: "2025-11-10 14:32",
  },
  {
    id: "2",
    notebook: "ml-pipeline.ipynb",
    status: "building",
    duration: "1m 12s",
    timestamp: "2025-11-10 14:15",
  },
  {
    id: "3",
    notebook: "api-server.ipynb",
    status: "success",
    duration: "1m 45s",
    timestamp: "2025-11-10 13:45",
  },
  {
    id: "4",
    notebook: "data-analysis.ipynb",
    status: "failed",
    duration: "0m 32s",
    timestamp: "2025-11-10 12:20",
  },
  {
    id: "5",
    notebook: "ml-pipeline.ipynb",
    status: "success",
    duration: "2m 15s",
    timestamp: "2025-11-10 11:30",
  },
  {
    id: "6",
    notebook: "api-server.ipynb",
    status: "pending",
    duration: "0m 00s",
    timestamp: "2025-11-10 10:45",
  },
];

const statusConfig = {
  success: {
    icon: CheckCircle2,
    color: "text-success bg-success/10",
    label: "Success",
  },
  failed: {
    icon: AlertCircle,
    color: "text-error bg-error/10",
    label: "Failed",
  },
  building: {
    icon: Zap,
    color: "text-primary bg-primary/10",
    label: "Building",
    animate: true,
  },
  pending: {
    icon: Clock,
    color: "text-warning bg-warning/10",
    label: "Pending",
  },
} as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function BuildsPage() {
  return (
    <div>
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-foreground mb-2">Builds</h1>
        <p className="text-foreground-muted">
          Track your notebook builds and deployments
        </p>
      </motion.div>

      {/* Builds List */}
      <motion.div
        className="grid grid-cols-1 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {dummyBuilds.length === 0 ? (
          <motion.div
            variants={itemVariants}
            className="text-center py-12 rounded-lg border border-border bg-background-secondary/50"
          >
            <p className="text-foreground-muted">No builds yet</p>
          </motion.div>
        ) : (
          dummyBuilds.map((build) => {
            const statusInfo = statusConfig[build.status];
            const StatusIcon = statusInfo.icon;

            return (
              <motion.div
                key={build.id}
                variants={itemVariants}
                className="rounded-lg border border-border bg-background-secondary/50 p-6 hover:bg-background-secondary/80 transition-colors"
                whileHover={{ x: 4 }}
              >
                <div className="flex items-center justify-between">
                  {/* Left Side: Icon and Info */}
                  <div className="flex items-center gap-4 flex-1">
                    {/* Status Icon */}
                    <div className={`p-2 rounded-lg ${statusInfo.color}`}>
                      <motion.div
                        animate={
                          statusInfo.animate
                            ? {
                                rotate: 360,
                                transition: {
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "linear",
                                },
                              }
                            : {}
                        }
                      >
                        <StatusIcon className="h-5 w-5" />
                      </motion.div>
                    </div>

                    {/* Build Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-foreground truncate">
                        {build.notebook}
                      </h3>
                      <p className="text-xs text-foreground-muted">
                        {build.timestamp}
                      </p>
                    </div>
                  </div>

                  {/* Right Side: Duration and Status */}
                  <div className="flex items-center gap-4 text-right">
                    {/* Duration */}
                    <div>
                      <p className="text-xs text-foreground-muted mb-1">
                        Duration
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {build.duration}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`px-3 py-1 rounded-full ${statusInfo.color} text-xs font-medium whitespace-nowrap`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>
    </div>
  );
}
