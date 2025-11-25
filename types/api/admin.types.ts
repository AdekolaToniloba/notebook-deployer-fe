export interface AdminSystemMetrics {
  total_users: number;
  total_notebooks: number;
  total_deployments: number;
  total_models: number;
  active_users_last_30_days: number;
  total_storage_mb: number;
  avg_health_score: number;
}

export interface AdminUserActivityItem {
  user_id: number;
  username: string;
  email: string;
  total_notebooks: number;
  total_deployments: number;
  total_models: number;
  last_activity: string | null;
  created_at: string;
}

export interface AdminUserActivityResponse {
  users: AdminUserActivityItem[];
  total_users: number;
  active_users: number;
  inactive_users: number;
}

export interface AdminDeploymentOverview {
  total_deployments: number;
  successful_deployments: number;
  failed_deployments: number;
  active_deployments: number;
  success_rate: number;
  total_build_time_hours: number;
  avg_build_time_seconds: number;
  deployments_last_24h: number;
  deployments_last_7d: number;
  deployments_last_30d: number;
}

export interface AdminUser {
  id: number;
  email: string;
  username: string;
  is_active: boolean;
  is_superuser: boolean;
  organization_id: number;
  roles: string[];
}

export interface AdminUserUpdate {
  is_active?: boolean;
  is_superuser?: boolean;
  organization_id?: number;
}
