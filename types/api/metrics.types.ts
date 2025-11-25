export interface TimeSeriesPoint {
  date: string;
  deployments: number;
  successes: number;
  failures: number;
}

export interface DeploymentMetricsResponse {
  aggregates: {
    total_deployments: number;
    successful: number;
    failed: number;
    success_rate: number;
    avg_build_duration: number;
  };
  time_series: TimeSeriesPoint[];
}

export interface NotebookHealthItem {
  notebook_id: number;
  name: string;
  health_score: number;
  status: string;
}

export interface NotebookHealthResponse {
  notebooks: NotebookHealthItem[];
  distribution: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  average_health_score: number;
  total_notebooks: number;
}

export interface ModelMetricsResponse {
  aggregates: {
    total_models: number;
    active_models: number;
    avg_accuracy: number;
    total_size_mb: number;
  };
  format_breakdown: Record<string, number>;
}
