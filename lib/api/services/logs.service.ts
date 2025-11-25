// lib/api/services/logs.service.ts

import apiClient from "@/lib/api/client";
import type {
  DeploymentLogsResponseApi,
  DeploymentLogsTextResponseApi,
} from "@/types/api/logs.types";
import { APP_CONFIG } from "@/lib/config";
import type { DeploymentLogs, LogEntry } from "@/types/models/logs.types";

class LogsService {
  private static BASE_PATH = "/api/v1/deployments";

  /**
   * Map API severity to UI severity
   */
  private mapSeverity(apiSeverity: string): LogEntry["severity"] {
    const severity = apiSeverity.toLowerCase();
    if (severity === "debug") return "debug";
    if (severity === "info") return "info";
    if (severity === "warning") return "warning";
    if (severity === "error") return "error";
    if (severity === "critical") return "critical";
    return "info"; // Default
  }

  /**
   * Get deployment logs (structured)
   */
  async getDeploymentLogs(deploymentId: number): Promise<DeploymentLogs> {
    const client = apiClient();
    const { data } = await client.get<DeploymentLogsResponseApi>(
      `${LogsService.BASE_PATH}/${deploymentId}/logs`
    );

    return {
      deploymentId: data.deployment_id,
      buildId: data.build_id,
      status: data.status,
      buildStatus: data.build_status,
      entries: data.log_entries.map((entry) => ({
        timestamp: new Date(entry.timestamp),
        severity: this.mapSeverity(entry.severity),
        message: entry.message,
      })),
      totalEntries: data.total_entries,
    };
  }

  /**
   * Get deployment logs as plain text (for download)
   */
  async getDeploymentLogsText(deploymentId: number): Promise<string> {
    const client = apiClient();
    const { data } = await client.get<DeploymentLogsTextResponseApi>(
      `${LogsService.BASE_PATH}/${deploymentId}/logs/text`
    );

    return data.logs;
  }

  /**
   * Create WebSocket connection for real-time logs
   */
  createLogStream(deploymentId: number): WebSocket {
    const wsUrl = `${APP_CONFIG.WS_URL}/api/v1/deployments/${deploymentId}/logs/stream`;

    console.log("Connecting to Log Stream:", wsUrl);
    return new WebSocket(wsUrl);
  }

  /**
   * Download logs as text file
   */
  async downloadLogs(deploymentId: number): Promise<void> {
    const logsText = await this.getDeploymentLogsText(deploymentId);

    const blob = new Blob([logsText], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deployment-${deploymentId}-logs.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}

export const logsService = new LogsService();
