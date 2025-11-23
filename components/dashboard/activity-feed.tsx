"use client";

import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Clock, Zap } from "lucide-react";
import type { Activity } from "@/types";

interface ActivityFeedProps {
  activities: Activity[];
}

const typeConfig = {
  success: { icon: CheckCircle2, color: "text-success bg-success/10" },
  error: { icon: AlertCircle, color: "text-error bg-error/10" },
  pending: { icon: Clock, color: "text-warning bg-warning/10" },
  info: { icon: Zap, color: "text-primary bg-primary/10" },
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="rounded-lg border border-border bg-background-secondary/50 p-6 backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-foreground mb-6">
        Recent Activity
      </h3>
      <div className="space-y-4">
        {activities.map((activity, idx) => {
          const config = typeConfig[activity.type];
          const Icon = config.icon;
          return (
            <motion.div
              key={activity.id}
              className="flex items-start gap-4"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <div className={`rounded-lg p-2 ${config.color} flex-shrink-0`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {activity.title}
                </p>
                <p className="text-xs text-foreground-muted mt-1">
                  {activity.description}
                </p>
              </div>
              <p className="text-xs text-foreground-muted flex-shrink-0">
                {activity.timestamp}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
