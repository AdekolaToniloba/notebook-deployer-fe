// types/models/logs.types.ts

export interface LogEntry {
  timestamp: Date;
  severity: "debug" | "info" | "warning" | "error" | "critical";
  message: string;
}

export interface DeploymentLogs {
  deploymentId: number;
  buildId: string;
  status: string;
  buildStatus: string;
  entries: LogEntry[];
  totalEntries: number;
}

export interface LogStreamMessage {
  type: "log" | "status" | "complete" | "error";
  timestamp?: string;
  severity?: string;
  message?: string;
  deploymentStatus?: string;
  buildStatus?: string;
}
