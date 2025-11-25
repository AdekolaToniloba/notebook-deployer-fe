"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/hooks/use-auth";
import { useAuthStore } from "@/store/auth-store";
import { useDashboard } from "@/lib/hooks/use-dashboard";
import {
  BookMarked,
  Cloud,
  TrendingUp,
  Github,
  Plus,
  Activity as ActivityIcon,
  GitBranch,
  AlertTriangle,
  Server,
  RefreshCw,
  Clock,
  AlertCircle,
  Database,
  FileCode,
} from "lucide-react";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { Activity } from "@/types";

// --- Utility: Number Formatter ---

/**
 * Rounds numbers to at most 2 decimal points.
 * Examples:
 * 71.33333 -> 71.33
 * 97.0000 -> 97
 * 66.67 -> 66.67
 */
const formatValue = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return "0";
  const rounded = Math.round((num + Number.EPSILON) * 100) / 100;
  return rounded.toString();
};

// --- Brutalist Flip Card Component ---

interface StatDetail {
  label: string;
  value: string | number;
}

interface FlipStatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  subValue?: string;
  color?: string;
  backColor?: string;
  isLoading?: boolean;
  details?: StatDetail[];
}

function FlipStatCard({
  label,
  value,
  icon: Icon,
  subValue,
  color = "bg-white",
  backColor = "bg-black",
  isLoading,
  details = [],
}: FlipStatCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <motion.div
      className="relative h-40 w-full group cursor-pointer perspective-1000"
      onClick={() => setIsFlipped(!isFlipped)}
      whileHover={{ scale: 1.02 }} // <-- Scale up slightly on hover
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {/* Static Shadow (doesn't flip) */}
      <div className="absolute inset-0 translate-x-2 translate-y-2 bg-black/20 transition-transform group-hover:translate-x-3 group-hover:translate-y-3" />

      {/* Flippable Container */}
      <motion.div
        className="relative h-full w-full"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{
          duration: 0.6,
          type: "spring",
          stiffness: 260,
          damping: 20,
        }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* --- FRONT FACE --- */}
        <div
          className={`absolute inset-0 h-full w-full border-4 border-black p-6 flex flex-col justify-between backface-hidden ${color}`}
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="flex items-start justify-between">
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-black/70">
              {label}
            </p>
            <div className="p-2 border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Icon className="h-5 w-5 text-black" />
            </div>
          </div>

          <div>
            {isLoading ? (
              <div className="h-10 w-24 bg-black/10 animate-pulse mb-2" />
            ) : (
              <h3 className="font-mono text-4xl font-black text-black tracking-tighter truncate">
                {value}
              </h3>
            )}
            {subValue && (
              <div className="mt-1 inline-block border-2 border-black bg-black text-white px-2 py-0.5 text-[10px] font-mono font-bold uppercase">
                {subValue}
              </div>
            )}
          </div>

          {/* Hover Hint */}
          <div className="absolute top-2 right-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[10px] font-bold px-2 py-1 uppercase pointer-events-none z-10">
            Click to Flip
          </div>

          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <RefreshCw className="h-3 w-3 text-black/50" />
          </div>
        </div>

        {/* --- BACK FACE --- */}
        <div
          className={`absolute inset-0 h-full w-full border-4 border-black p-6 flex flex-col justify-center backface-hidden ${backColor}`}
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <h4 className="text-white font-mono text-xs font-bold uppercase mb-4 opacity-80 border-b border-white/20 pb-2">
            Detailed Stats
          </h4>
          <div className="space-y-3">
            {details.map((detail, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="text-white/70 font-mono text-xs uppercase">
                  {detail.label}
                </span>
                <span className="text-white font-mono font-bold text-sm">
                  {detail.value}
                </span>
              </div>
            ))}
            {details.length === 0 && (
              <p className="text-white/50 text-xs font-mono text-center">
                No additional data
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface ActionCardProps {
  title: string;
  icon: React.ElementType;
  href: string;
  bgColor: string;
}

function ActionCard({ title, icon: Icon, href, bgColor }: ActionCardProps) {
  return (
    <Link href={href} className="block relative group h-full w-full">
      <div className="absolute inset-0 translate-x-2 translate-y-2 bg-black" />
      <div
        className="relative h-full border-4 border-black p-6 flex flex-row items-center gap-4 transition-all duration-200 group-hover:-translate-y-1 group-hover:-translate-x-1 group-hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        style={{ backgroundColor: bgColor }}
      >
        <div className="bg-white border-2 border-black p-3">
          <Icon className="h-6 w-6 text-black" />
        </div>
        <span className="font-mono font-black uppercase text-xl text-black tracking-tight">
          {title}
        </span>
        <div className="ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 font-mono font-bold text-2xl">
          →
        </div>
      </div>
    </Link>
  );
}

// --- Main Page ---

export default function DashboardPage() {
  const { user } = useAuth();
  const isGithubConnected = useAuthStore((state) => state.isGithubConnected);
  const { data, isLoading, error, refresh } = useDashboard();

  // Lazy initial state for Stream ID (consistent across renders)
  const [streamId] = useState(() => {
    if (typeof window !== "undefined") return Date.now().toString().slice(-6);
    return "000000";
  });

  const feedActivities: Activity[] = useMemo(() => {
    if (!data?.recentActivity) return [];

    return data.recentActivity.map((item, idx) => {
      let type: Activity["type"] = "info";
      if (item.type === "error") type = "error";
      else if (item.type === "success") type = "success";
      else if (item.type === "warning") type = "pending";
      else type = "info";

      return {
        id: `${item.resourceId}-${idx}`,
        type: type,
        title: item.action,
        description: `${item.resourceName} • ${item.status}`,
        timestamp: new Date(item.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    });
  }, [data]);

  if (error)
    return (
      <div className="min-h-screen bg-red-50 p-12 flex items-center justify-center font-mono">
        <div className="border-4 border-black bg-white p-8 text-center max-w-md shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-600" />
          <h2 className="text-2xl font-black uppercase mb-2">
            System Malfunction
          </h2>
          <p className="mb-6 text-sm font-bold text-gray-600">
            Could not retrieve dashboard telemetry.
          </p>
          <button
            onClick={refresh}
            className="bg-black text-white px-6 py-3 font-bold uppercase hover:bg-gray-800"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f4f4f0] p-6 md:p-12 font-mono">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-4 border-black pb-8"
        >
          <div>
            <div className="inline-block bg-black text-white px-2 py-1 text-xs font-bold uppercase mb-2">
              v1.0.0-alpha
            </div>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none text-black">
              Command
              <br />
              Center
            </h1>
          </div>

          <div className="flex flex-col items-end gap-2">
            <p className="font-bold uppercase text-right text-sm tracking-widest">
              Operator: {user?.username || "Unknown"}
            </p>
            <div
              className={`flex items-center gap-3 px-4 py-2 border-4 border-black ${
                isLoading ? "bg-yellow-300" : "bg-green-400"
              } shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}
            >
              {isLoading ? (
                <RefreshCw className="h-5 w-5 animate-spin text-black" />
              ) : (
                <ActivityIcon className="h-5 w-5 animate-pulse text-black" />
              )}
              <span className="font-black text-sm uppercase text-black">
                {isLoading ? "SYNCING..." : "SYSTEM ONLINE"}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid (Animated Flip Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {/* 1. Total Notebooks */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <FlipStatCard
              label="Notebooks"
              value={formatValue(data?.summary.totalNotebooks)}
              icon={BookMarked}
              color="bg-[#FFE8A3]" // Pastel Yellow
              backColor="bg-[#B48F18]" // Darker Yellow for back
              isLoading={isLoading}
              details={[
                {
                  label: "Models",
                  value: formatValue(data?.summary.totalModels),
                },
                {
                  label: "Analyses",
                  value: formatValue(data?.summary.totalAnalyses),
                },
              ]}
            />
          </motion.div>

          {/* 2. Active Deployments */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <FlipStatCard
              label="Active Deploys"
              value={formatValue(data?.summary.activeDeployments)}
              subValue={`${formatValue(
                data?.summary.failedDeployments
              )} FAILED`}
              icon={Cloud}
              color="bg-[#C4F5FC]" // Cyan
              backColor="bg-[#0E7490]" // Dark Cyan for back
              isLoading={isLoading}
              details={[
                {
                  label: "Total Deploys",
                  value: formatValue(data?.summary.totalDeployments),
                },
                {
                  label: "Failed",
                  value: formatValue(data?.summary.failedDeployments),
                },
              ]}
            />
          </motion.div>

          {/* 3. Success Rate */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <FlipStatCard
              label="Success Rate"
              value={`${formatValue(data?.deploymentStats.successRate)}%`}
              icon={TrendingUp}
              color="bg-[#D6FFB7]" // Lime
              backColor="bg-[#4D7C0F]" // Dark Lime for back
              isLoading={isLoading}
              details={[
                {
                  label: "Avg Build",
                  value: `${formatValue(
                    data?.deploymentStats.averageBuildTime
                  )}s`,
                },
                {
                  label: "Fastest",
                  value: `${formatValue(
                    data?.deploymentStats.fastestDeployment
                  )}s`,
                },
                {
                  label: "Slowest",
                  value: `${formatValue(
                    data?.deploymentStats.slowestDeployment
                  )}s`,
                },
              ]}
            />
          </motion.div>

          {/* 4. Health Score */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <FlipStatCard
              label="Health Score"
              value={formatValue(data?.healthOverview.averageHealthScore)}
              subValue={`${
                data?.healthOverview.notebooksWithIssues ?? 0
              } ISSUES`}
              icon={ActivityIcon}
              color="bg-[#FFBFD2]" // Pink
              backColor="bg-[#BE185D]" // Dark Pink for back
              isLoading={isLoading}
              details={[
                {
                  label: "Issues Found",
                  value: formatValue(data?.healthOverview.notebooksWithIssues),
                },
                {
                  label: "Analyzed",
                  value: formatValue(data?.healthOverview.notebooksAnalyzed),
                },
              ]}
            />
          </motion.div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left: Live Feed */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-3 w-3 bg-black animate-bounce" />
              <h2 className="text-xl font-black uppercase tracking-tight">
                Live Telemetry
              </h2>
            </div>

            <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] min-h-[400px]">
              <div className="bg-black p-3 flex justify-between items-center border-b-4 border-black">
                <span className="text-white font-mono text-xs font-bold uppercase">
                  Stream_ID: {streamId}
                </span>
                <div className="flex gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500 border border-white" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500 border border-white" />
                  <div className="h-3 w-3 rounded-full bg-green-500 border border-white" />
                </div>
              </div>
              <div className="p-6">
                {isLoading ? (
                  <div className="space-y-4 animate-pulse">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-16 bg-gray-100 border-2 border-gray-200"
                      />
                    ))}
                  </div>
                ) : feedActivities.length > 0 ? (
                  <ActivityFeed activities={feedActivities} />
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-gray-400 opacity-50">
                    <Server className="h-16 w-16 mb-4" />
                    <p className="font-bold uppercase">No Activity Logged</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-col gap-6 sticky top-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-3 w-3 bg-black" />
              <h2 className="text-xl font-black uppercase tracking-tight">
                Quick Ops
              </h2>
            </div>

            <div className="h-32">
              <ActionCard
                title="New Deploy"
                icon={Plus}
                href="/deploy"
                bgColor="#FFDE59"
              />
            </div>

            <div className="h-32">
              {isGithubConnected ? (
                <ActionCard
                  title="Repo Sync"
                  icon={GitBranch}
                  href="/settings"
                  bgColor="#A3E635"
                />
              ) : (
                <ActionCard
                  title="Link Github"
                  icon={Github}
                  href="/settings"
                  bgColor="#60A5FA"
                />
              )}
            </div>

            <div className="border-4 border-black p-4 bg-white mt-4">
              <h3 className="font-bold uppercase text-xs border-b-2 border-black pb-2 mb-3">
                Backend Infrastructure
              </h3>
              <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="opacity-60">BUILD ENG:</span>
                  <span className="font-bold text-green-600">READY</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">AVG BUILD:</span>
                  <span className="font-bold">
                    {data?.deploymentStats.averageBuildTime
                      ? `${formatValue(data.deploymentStats.averageBuildTime)}s`
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">REGION:</span>
                  <span className="font-bold">US-CENTRAL1</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
