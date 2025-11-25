// types/models/dashboard.types.ts

export interface DashboardSummary {
  totalNotebooks: number;
  totalDeployments: number;
  activeDeployments: number;
  failedDeployments: number;
  totalModels: number;
  totalAnalyses: number;
}

export interface DashboardActivity {
  type: "success" | "error" | "info" | "warning"; // Normalized UI type
  action: string;
  resourceId: number;
  resourceName: string;
  status: string;
  timestamp: Date;
}

export interface DashboardHealth {
  averageHealthScore: number;
  notebooksWithIssues: number;
  notebooksAnalyzed: number;
}

export interface DashboardStats {
  successRate: number; // 0-1 percentage
  averageBuildTime: number;
  totalBuildTime: number;
  fastestDeployment: number | null;
  slowestDeployment: number | null;
}

export interface DashboardData {
  summary: DashboardSummary;
  recentActivity: DashboardActivity[];
  healthOverview: DashboardHealth;
  deploymentStats: DashboardStats;
}
