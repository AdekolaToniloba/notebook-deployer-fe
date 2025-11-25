// types/api/logs.types.ts

export interface LogEntryApi {
  timestamp: string;
  severity: string;
  message: string;
}

export interface DeploymentLogsResponseApi {
  deployment_id: number;
  build_id: string;
  status: string;
  build_status: string;
  log_entries: LogEntryApi[];
  total_entries: number;
}

export interface DeploymentLogsTextResponseApi {
  deployment_id: number;
  build_id: string;
  status: string;
  logs: string;
}

export type LogSeverity = "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL";
