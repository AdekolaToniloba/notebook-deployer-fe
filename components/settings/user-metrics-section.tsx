"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  BarChart2,
  Zap,
  Box,
  Check,
  X,
  Database,
  Server,
  Loader2,
} from "lucide-react";
import { metricsService } from "@/lib/api/services/metrics.service";
import type {
  DeploymentMetricsResponse,
  NotebookHealthResponse,
  ModelMetricsResponse,
} from "@/types/api/metrics.types";

function StatCard({
  label,
  value,
  subValue,
  icon: Icon,
  color = "bg-white",
}: {
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.ElementType;
  color?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`border-2 border-black p-4 flex flex-col justify-between h-32 ${color}`}
    >
      <div className="flex justify-between items-start">
        <h4 className="font-black text-xs uppercase tracking-widest opacity-60">
          {label}
        </h4>
        <Icon className="h-5 w-5 stroke-2" />
      </div>
      <div>
        <p className="font-mono font-black text-3xl">{value}</p>
        {subValue && (
          <p className="font-mono text-[10px] font-bold mt-1 uppercase">
            {subValue}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export function UserMetricsSection() {
  const [deployMetrics, setDeployMetrics] =
    useState<DeploymentMetricsResponse | null>(null);
  const [healthMetrics, setHealthMetrics] =
    useState<NotebookHealthResponse | null>(null);
  const [modelMetrics, setModelMetrics] = useState<ModelMetricsResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deployData, healthData, modelData] = await Promise.all([
          metricsService.getDeploymentMetrics(),
          metricsService.getNotebookHealth(),
          metricsService.getModelMetrics(),
        ]);
        setDeployMetrics(deployData);
        setHealthMetrics(healthData);
        setModelMetrics(modelData);
      } catch (err) {
        console.error("Failed to load user metrics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center border-2 border-black bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Success Rate"
          value={`${deployMetrics?.aggregates.success_rate.toFixed(0)}%`}
          subValue={`${deployMetrics?.aggregates.successful} Successful Deploys`}
          icon={Zap}
          color="bg-[#D6FFB7]" // Lime
        />
        <StatCard
          label="Avg Build Time"
          value={`${deployMetrics?.aggregates.avg_build_duration.toFixed(0)}s`}
          subValue="Faster than 80% users"
          icon={Activity}
          color="bg-[#B6DFFF]" // Blue
        />
        <StatCard
          label="Code Health"
          value={healthMetrics?.average_health_score.toFixed(0) || 0}
          subValue={`${healthMetrics?.total_notebooks} Notebooks Scanned`}
          icon={Activity}
          color="bg-[#FFDE59]" // Yellow
        />
        <StatCard
          label="Models Stored"
          value={modelMetrics?.aggregates.total_models || 0}
          subValue={`${modelMetrics?.aggregates.total_size_mb.toFixed(
            1
          )} MB Used`}
          icon={Database}
          color="bg-[#FF9EAA]" // Pink
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Deployment Visualization */}
        <div className="border-2 border-black bg-white p-6 relative overflow-hidden">
          <div className="flex justify-between items-end mb-6 relative z-10">
            <div>
              <h3 className="font-black text-lg uppercase flex items-center gap-2">
                <Server className="h-5 w-5" /> Deployment Activity
              </h3>
              <p className="text-xs font-bold text-gray-500">
                LAST 7 DAYS PERFORMANCE
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-black"></div> Total
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500"></div> Fail
                </span>
              </div>
            </div>
          </div>

          {/* CSS Bar Chart */}
          <div className="flex items-end justify-between h-32 gap-2 relative z-10">
            {deployMetrics?.time_series.slice(-7).map((day, i) => (
              <div
                key={i}
                className="flex-1 flex flex-col justify-end gap-1 group"
              >
                <div className="relative w-full bg-gray-100 h-full flex flex-col justify-end overflow-hidden">
                  {/* Failure Portion */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{
                      height: `${
                        (day.failures / (day.deployments || 1)) * 100
                      }%`,
                    }}
                    className="w-full bg-red-500"
                  />
                  {/* Success Portion */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{
                      height: `${
                        (day.successes / (day.deployments || 1)) * 100
                      }%`,
                    }}
                    className="w-full bg-black"
                  />
                </div>
                <p className="text-[10px] font-mono text-center font-bold text-gray-400">
                  {new Date(day.date).toLocaleDateString("en-US", {
                    weekday: "narrow",
                  })}
                </p>

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[10px] p-2 font-mono pointer-events-none whitespace-nowrap z-20">
                  {day.deployments} Deploys ({day.failures} Failed)
                </div>
              </div>
            ))}
            {(!deployMetrics?.time_series ||
              deployMetrics.time_series.length === 0) && (
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-400">
                NO RECENT ACTIVITY
              </div>
            )}
          </div>

          {/* Background Pattern */}
          <div
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
              backgroundSize: "10px 10px",
            }}
          />
        </div>

        {/* Notebook Health Breakdown */}
        <div className="border-2 border-black bg-[#1a1a1a] text-white p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-lg uppercase flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-yellow-400" /> Quality Score
            </h3>
            <span className="bg-white text-black px-2 py-1 text-xs font-bold">
              AI ANALYSIS
            </span>
          </div>

          <div className="space-y-4 font-mono text-sm">
            <div className="flex items-center gap-4">
              <span className="w-20 font-bold text-green-400">EXCELLENT</span>
              <div className="flex-1 h-4 bg-white/10 rounded-none overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${
                      ((healthMetrics?.distribution.excellent || 0) /
                        (healthMetrics?.total_notebooks || 1)) *
                      100
                    }%`,
                  }}
                  className="h-full bg-green-500"
                />
              </div>
              <span className="w-8 text-right">
                {healthMetrics?.distribution.excellent}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="w-20 font-bold text-blue-400">GOOD</span>
              <div className="flex-1 h-4 bg-white/10 rounded-none overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${
                      ((healthMetrics?.distribution.good || 0) /
                        (healthMetrics?.total_notebooks || 1)) *
                      100
                    }%`,
                  }}
                  className="h-full bg-blue-500"
                />
              </div>
              <span className="w-8 text-right">
                {healthMetrics?.distribution.good}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="w-20 font-bold text-yellow-400">FAIR</span>
              <div className="flex-1 h-4 bg-white/10 rounded-none overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${
                      ((healthMetrics?.distribution.fair || 0) /
                        (healthMetrics?.total_notebooks || 1)) *
                      100
                    }%`,
                  }}
                  className="h-full bg-yellow-500"
                />
              </div>
              <span className="w-8 text-right">
                {healthMetrics?.distribution.fair}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="w-20 font-bold text-red-400">POOR</span>
              <div className="flex-1 h-4 bg-white/10 rounded-none overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${
                      ((healthMetrics?.distribution.poor || 0) /
                        (healthMetrics?.total_notebooks || 1)) *
                      100
                    }%`,
                  }}
                  className="h-full bg-red-500"
                />
              </div>
              <span className="w-8 text-right">
                {healthMetrics?.distribution.poor}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
