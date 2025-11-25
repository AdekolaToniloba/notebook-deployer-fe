import apiClient from "@/lib/api/client";
import type {
  DeploymentMetricsResponse,
  NotebookHealthResponse,
  ModelMetricsResponse,
} from "@/types/api/metrics.types";

class MetricsService {
  private static BASE_PATH = "/api/v1/metrics";

  async getDeploymentMetrics(): Promise<DeploymentMetricsResponse> {
    const { data } = await apiClient().get<DeploymentMetricsResponse>(
      `${MetricsService.BASE_PATH}/deployments`
    );
    return data;
  }

  async getNotebookHealth(): Promise<NotebookHealthResponse> {
    const { data } = await apiClient().get<NotebookHealthResponse>(
      `${MetricsService.BASE_PATH}/notebooks/health`
    );
    return data;
  }

  async getModelMetrics(): Promise<ModelMetricsResponse> {
    const { data } = await apiClient().get<ModelMetricsResponse>(
      `${MetricsService.BASE_PATH}/models`
    );
    return data;
  }
}

export const metricsService = new MetricsService();
