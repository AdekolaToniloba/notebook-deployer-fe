"use client";

import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
}

export function StatCard({ label, value, icon: Icon, trend }: StatCardProps) {
  return (
    <motion.div
      className="rounded-lg border border-border bg-background-secondary/50 p-6 backdrop-blur-sm hover:bg-background-secondary/80 transition-colors"
      whileHover={{ y: -2 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground-muted mb-2">
            {label}
          </p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {trend && (
            <p
              className={`text-xs mt-2 ${
                trend.positive ? "text-success" : "text-error"
              }`}
            >
              {trend.positive ? "+" : ""}
              {trend.value}% from last month
            </p>
          )}
        </div>
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </motion.div>
  );
}
