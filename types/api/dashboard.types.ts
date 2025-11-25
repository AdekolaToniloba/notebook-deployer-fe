// types/api/dashboard.types.ts

export interface DashboardUserApi {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export interface DashboardSummaryApi {
  total_notebooks: number;
  total_deployments: number;
  active_deployments: number;
  failed_deployments: number;
  total_models: number;
  total_analyses: number;
}

export interface DashboardActivityApi {
  type: string;
  action: string;
  resource_id: number;
  resource_name: string;
  status: string | null;
  timestamp: string;
}

export interface DashboardHealthApi {
  average_health_score: number;
  notebooks_with_issues: number;
  notebooks_analyzed: number;
}

export interface DashboardStatsApi {
  success_rate: number;
  average_build_time: number;
  total_build_time: number;
  fastest_deployment: number | null;
  slowest_deployment: number | null;
}

export interface DashboardResponseApi {
  user: DashboardUserApi;
  summary: DashboardSummaryApi;
  recent_activity: DashboardActivityApi[];
  health_overview: DashboardHealthApi;
  deployment_stats: DashboardStatsApi;
}
