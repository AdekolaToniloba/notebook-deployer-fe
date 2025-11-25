"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Server,
  Database,
  Activity,
  ShieldAlert,
  BarChart3,
  Clock,
  TrendingUp,
} from "lucide-react";
import { adminService } from "@/lib/api/services/admin.service";
import type {
  AdminSystemMetrics,
  AdminDeploymentOverview,
} from "@/types/api/admin.types";
import { UserManagementTable } from "@/components/admin/user-management-table"; // We'll create this next
import { Loader2 } from "lucide-react";

// --- Brutalist Metric Card ---
function AdminMetricCard({
  label,
  value,
  icon: Icon,
  color = "bg-white",
  subValue,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color?: string;
  subValue?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "8px 8px 0px 0px rgba(0,0,0,1)" }}
      className={`border-2 border-black p-6 flex flex-col justify-between h-40 transition-all ${color}`}
    >
      <div className="flex justify-between items-start">
        <h3 className="font-mono font-black uppercase text-sm tracking-widest opacity-70">
          {label}
        </h3>
        <Icon className="h-6 w-6 stroke-2" />
      </div>
      <div>
        <p className="font-mono font-black text-4xl md:text-5xl">{value}</p>
        {subValue && (
          <p className="font-mono text-xs font-bold mt-2 bg-black text-white inline-block px-2 py-1">
            {subValue}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<AdminSystemMetrics | null>(null);
  const [deployStats, setDeployStats] =
    useState<AdminDeploymentOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sysData, deployData] = await Promise.all([
          adminService.getSystemMetrics(),
          adminService.getDeploymentOverview(),
        ]);
        setMetrics(sysData);
        setDeployStats(deployData);
      } catch (error) {
        console.error("Admin fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-[#FF4D4D]">
        <div className="bg-white border-4 border-black p-8 flex flex-col items-center gap-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <Loader2 className="h-12 w-12 animate-spin" />
          <h2 className="font-mono font-black text-2xl uppercase">
            Loading Admin Core...
          </h2>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 p-6 md:p-12 font-mono">
      {/* Header */}
      <div className="mb-12 border-b-4 border-black pb-6 flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <div className="bg-black text-white px-3 py-1 inline-block font-bold text-xs mb-2">
            SUPERUSER ACCESS GRANTED
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase leading-none">
            System
            <br />
            Overseer
          </h1>
        </div>
        <div className="flex gap-2">
          <div className="h-4 w-4 bg-red-500 border-2 border-black" />
          <div className="h-4 w-4 bg-yellow-500 border-2 border-black" />
          <div className="h-4 w-4 bg-green-500 border-2 border-black" />
        </div>
      </div>

      {/* System Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <AdminMetricCard
          label="Total Users"
          value={metrics?.total_users || 0}
          subValue={`${metrics?.active_users_last_30_days} ACTIVE (30d)`}
          icon={Users}
          color="bg-[#B6DFFF]"
        />
        <AdminMetricCard
          label="Notebooks"
          value={metrics?.total_notebooks || 0}
          subValue={`Avg Health: ${metrics?.avg_health_score.toFixed(1)}`}
          icon={Database}
          color="bg-[#FFDE59]"
        />
        <AdminMetricCard
          label="Storage"
          value={(metrics?.total_storage_mb || 0).toFixed(1)}
          subValue="MEGABYTES"
          icon={Server}
          color="bg-[#FF9EAA]"
        />
        <AdminMetricCard
          label="Deployments"
          value={metrics?.total_deployments || 0}
          subValue={`${deployStats?.active_deployments} LIVE NOW`}
          icon={Activity}
          color="bg-[#C1FF72]"
        />
      </div>

      {/* Deployment Deep Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Big Chart Area (Visual Placeholder) */}
        <div className="lg:col-span-2 border-4 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black uppercase flex items-center gap-3">
              <BarChart3 className="h-8 w-8" /> Deployment Velocity
            </h2>
            <div className="text-right">
              <p className="text-xs font-bold text-gray-500 uppercase">
                Success Rate
              </p>
              <p className="text-4xl font-black text-green-600">
                {deployStats?.success_rate.toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Custom Progress Bars for Stats */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1 uppercase">
                <span>Successful Builds</span>
                <span>{deployStats?.successful_deployments}</span>
              </div>
              <div className="h-4 border-2 border-black bg-gray-100 relative">
                <div
                  className="absolute top-0 left-0 h-full bg-green-500"
                  style={{ width: `${deployStats?.success_rate}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1 uppercase">
                <span>Failed Builds</span>
                <span>{deployStats?.failed_deployments}</span>
              </div>
              <div className="h-4 border-2 border-black bg-gray-100 relative">
                <div
                  className="absolute top-0 left-0 h-full bg-red-500"
                  style={{
                    width: `${100 - (deployStats?.success_rate || 0)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4 text-center border-t-2 border-black pt-6">
            <div>
              <p className="text-3xl font-black">
                {deployStats?.deployments_last_24h}
              </p>
              <p className="text-xs font-bold uppercase text-gray-500">
                Last 24h
              </p>
            </div>
            <div className="border-x-2 border-gray-200">
              <p className="text-3xl font-black">
                {deployStats?.deployments_last_7d}
              </p>
              <p className="text-xs font-bold uppercase text-gray-500">
                Last 7d
              </p>
            </div>
            <div>
              <p className="text-3xl font-black">
                {deployStats?.deployments_last_30d}
              </p>
              <p className="text-xs font-bold uppercase text-gray-500">
                Last 30d
              </p>
            </div>
          </div>
        </div>

        {/* Build Performance */}
        <div className="border-4 border-black bg-[#1a1a1a] text-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-center">
          <h3 className="text-xl font-black uppercase mb-6 flex items-center gap-2 text-yellow-400">
            <Clock className="h-6 w-6" /> Build Performance
          </h3>

          <div className="space-y-8">
            <div>
              <p className="text-gray-400 font-mono text-xs uppercase mb-1">
                Avg Build Time
              </p>
              <p className="text-5xl font-black font-mono">
                {deployStats?.avg_build_time_seconds.toFixed(1)}s
              </p>
            </div>
            <div>
              <p className="text-gray-400 font-mono text-xs uppercase mb-1">
                Total Build Hours
              </p>
              <p className="text-5xl font-black font-mono">
                {deployStats?.total_build_time_hours.toFixed(2)}h
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-700">
            <div className="flex items-center gap-2 text-sm font-bold text-green-400">
              <TrendingUp className="h-4 w-4" />
              <span>SYSTEM OPTIMAL</span>
            </div>
          </div>
        </div>
      </div>

      {/* User Management Section */}
      <div className="border-4 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-black text-white">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase">User Management</h2>
            <p className="text-sm font-bold text-gray-500">
              CONTROL ACCESS & PERMISSIONS
            </p>
          </div>
        </div>

        <UserManagementTable />
      </div>
    </div>
  );
}
