"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/hooks/use-auth";
import { useAuthStore } from "@/store/auth-store";
import {
  BookMarked,
  Cloud,
  TrendingUp,
  Github,
  Plus,
  Activity as ActivityIcon,
  GitBranch,
} from "lucide-react";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import type { Activity } from "@/types"; // Ensure this imports your shared type

// --- Brutalist Components (Fixed Types) ---

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  trend?: {
    value: number;
    positive: boolean;
  };
}

function StatCard({ label, value, icon: Icon, trend }: StatCardProps) {
  return (
    <div className="relative h-full group">
      <div className="absolute inset-0 translate-x-2 translate-y-2 bg-black" />
      <div className="relative h-full border-2 border-black bg-white p-6 transition-transform group-hover:-translate-y-1 group-hover:-translate-x-1">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-xs font-bold uppercase text-gray-500">
              {label}
            </p>
            <h3 className="mt-2 font-mono text-4xl font-black">{value}</h3>
          </div>
          <div className="flex h-12 w-12 items-center justify-center border-2 border-black bg-[#B6DFF]">
            <Icon className="h-6 w-6 text-black" />
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center gap-2 font-mono text-xs font-bold">
            <span
              className={trend.positive ? "text-green-600" : "text-red-600"}
            >
              {trend.positive ? "▲" : "▼"} {trend.value}%
            </span>
            <span className="text-gray-400">VS LAST WEEK</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface ActionCardProps {
  title: string;
  icon: React.ElementType;
  href: string;
  color?: string;
}

function ActionCard({
  title,
  icon: Icon,
  href,
  color = "#FFFFFF", // Default to white hex
}: ActionCardProps) {
  return (
    <Link href={href} className="block relative group h-full">
      {/* Shadow layer */}
      <div className="absolute inset-0 translate-x-2 translate-y-2 bg-black" />

      {/* Main card layer */}
      <div
        className="relative z-10 h-full border-2 border-black p-6 flex flex-col items-center justify-center gap-4 transition-transform group-hover:-translate-y-1 group-hover:-translate-x-1"
        style={{ backgroundColor: color }} // <--- Inline style guarantees color
      >
        <Icon className="h-10 w-10 text-black" />
        <span className="font-mono font-bold uppercase text-lg text-center text-black">
          {title}
        </span>
      </div>
    </Link>
  );
}

// --- Mock Data (Fixed Types) ---
const activities: Activity[] = [
  {
    id: "1",
    type: "success", // Strictly typed literal
    title: "Deployment Successful",
    description: "churn_model_v2.ipynb is live",
    timestamp: "10m ago",
  },
  {
    id: "2",
    type: "info",
    title: "Notebook Uploaded",
    description: "financial_forecast.ipynb parsed",
    timestamp: "1h ago",
  },
  {
    id: "3",
    type: "error",
    title: "Build Failed",
    description: "Missing 'pandas' dependency",
    timestamp: "2h ago",
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const isGithubConnected = useAuthStore((state) => state.isGithubConnected);

  const stats = useMemo(
    () => [
      {
        label: "Active Deployments",
        value: 3,
        icon: Cloud,
        trend: { value: 12, positive: true },
      },
      {
        label: "Total Notebooks",
        value: 8,
        icon: BookMarked,
        trend: { value: 4, positive: true },
      },
      {
        label: "Success Rate",
        value: "94%",
        icon: TrendingUp,
        trend: { value: 2, positive: false },
      },
    ],
    []
  );

  return (
    <div className="p-6 md:p-12 space-y-12 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-2 border-black pb-6">
        <div>
          <h1 className="font-mono text-4xl md:text-5xl font-black uppercase tracking-tight">
            OVERVIEW
          </h1>
          <p className="mt-2 font-mono text-gray-500 font-bold">
            WELCOME BACK, {user?.username?.toUpperCase() || "COMMANDER"}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 border-2 border-black bg-green-400">
          <ActivityIcon className="h-4 w-4 animate-pulse text-black" />
          <span className="font-mono text-xs font-bold uppercase text-black">
            System Operational
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <StatCard {...stat} />
          </motion.div>
        ))}
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Activity Feed */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <div className="border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="border-b-2 border-black bg-black p-4 flex justify-between items-center">
              <h2 className="font-mono font-bold text-white uppercase">
                Live Feed
              </h2>
              <div className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
            </div>
            <div className="p-6">
              <ActivityFeed activities={activities} />
            </div>
          </div>
        </div>

        {/* Right Column: Quick Actions */}
        <div className="flex flex-col gap-6">
          <div className="h-40">
            <ActionCard
              title="New Deployment"
              icon={Plus}
              href="/deploy"
              color="#FFDE59"
            />
          </div>
          <div className="h-40">
            {isGithubConnected ? (
              <ActionCard
                title="Manage Repos"
                icon={GitBranch}
                href="/settings" // Or /deployments if you want to link there
                color="#a7f3d0" // Light Green for connected
              />
            ) : (
              <ActionCard
                title="Connect GitHub"
                icon={Github}
                href="/settings"
                color="#B6DFFF" // Blue for unconnected
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
