import apiClient from "@/lib/api/client";
import type {
  DashboardResponseApi,
  DashboardActivityApi,
} from "@/types/api/dashboard.types";
import type {
  DashboardData,
  DashboardActivity,
} from "@/types/models/dashboard.types";

class DashboardService {
  private static BASE_PATH = "/api/v1/dashboard";

  private mapActivityType(
    status: string | null,
    action: string
  ): "success" | "error" | "info" | "warning" {
    const s = (status || "").toLowerCase();
    const a = action.toLowerCase();

    if (s.includes("fail") || s.includes("error") || a.includes("fail"))
      return "error";
    if (s.includes("success") || s.includes("deployed") || s.includes("ready"))
      return "success";
    if (s.includes("building") || s.includes("pending")) return "warning";
    return "info";
  }

  /**
   * Fetches the full dashboard overview
   */
  async getDashboard(): Promise<DashboardData> {
    // Fix: Call apiClient() to get the instance before calling .get()
    const client = apiClient();
    const { data } = await client.get<DashboardResponseApi>(
      DashboardService.BASE_PATH
    );

    return {
      summary: {
        totalNotebooks: data.summary.total_notebooks,
        totalDeployments: data.summary.total_deployments,
        activeDeployments: data.summary.active_deployments,
        failedDeployments: data.summary.failed_deployments,
        totalModels: data.summary.total_models,
        totalAnalyses: data.summary.total_analyses,
      },
      recentActivity: data.recent_activity.map(
        (item: DashboardActivityApi): DashboardActivity => ({
          type: this.mapActivityType(item.status, item.action),
          action: item.action,
          resourceId: item.resource_id,
          resourceName: item.resource_name,
          status: item.status || "Unknown",
          timestamp: new Date(item.timestamp),
        })
      ),
      healthOverview: {
        averageHealthScore: data.health_overview.average_health_score,
        notebooksWithIssues: data.health_overview.notebooks_with_issues,
        notebooksAnalyzed: data.health_overview.notebooks_analyzed,
      },
      deploymentStats: {
        successRate: data.deployment_stats.success_rate,
        averageBuildTime: data.deployment_stats.average_build_time,
        totalBuildTime: data.deployment_stats.total_build_time,
        fastestDeployment: data.deployment_stats.fastest_deployment,
        slowestDeployment: data.deployment_stats.slowest_deployment,
      },
    };
  }
}

export const dashboardService = new DashboardService();
