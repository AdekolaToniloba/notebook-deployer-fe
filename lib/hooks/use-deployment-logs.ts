import { useState, useEffect, useCallback, useRef } from "react";
import { logsService } from "@/lib/api/services/logs.service";
import type { LogEntry, LogStreamMessage } from "@/types/models/logs.types";
import { toasts } from "@/lib/toast-utils";

interface UseDeploymentLogsOptions {
  deploymentId: number;
  autoStream?: boolean;
}

interface ApiErrorShape {
  response?: {
    status?: number;
    data?: {
      detail?: string;
    };
  };
  message?: string;
  status?: number;
}

export function useDeploymentLogs({
  deploymentId,
  autoStream = false,
}: UseDeploymentLogsOptions) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamStatus, setStreamStatus] = useState<string>("disconnected");
  const [error, setError] = useState<Error | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch historical logs (REST)
  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await logsService.getDeploymentLogs(deploymentId);
      setLogs(data.entries);
      setError(null);
    } catch (err: unknown) {
      // FIX: Use 'unknown' and cast/check type safely
      const errorObj = err as ApiErrorShape;

      const status = errorObj.response?.status || errorObj.status;
      const msg = errorObj.response?.data?.detail || errorObj.message || "";

      if (status === 400 && msg.includes("No build associated")) {
        console.log("Build not ready yet. Retrying logs in 3s...");
        setLogs([
          {
            timestamp: new Date(),
            severity: "info",
            message: "Waiting for build initialization...",
          },
        ]);
        return;
      }

      const finalError =
        err instanceof Error ? err : new Error("Failed to fetch logs");
      setError(finalError);
      console.error("Logs fetch error:", finalError);
    } finally {
      setIsLoading(false);
    }
  }, [deploymentId]);

  // Start WebSocket streaming
  const startStream = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    if (wsRef.current?.readyState === WebSocket.CONNECTING) return;

    setIsStreaming(true);
    setStreamStatus("connecting");

    const ws = logsService.createLogStream(deploymentId);
    wsRef.current = ws;

    ws.onopen = () => {
      setStreamStatus("connected");
      console.log("Log stream connected");
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };

    ws.onmessage = (event) => {
      try {
        const data: LogStreamMessage = JSON.parse(event.data);

        if (data.type === "log" && data.timestamp && data.message) {
          const newLog: LogEntry = {
            timestamp: new Date(data.timestamp),
            severity:
              (data.severity?.toLowerCase() as LogEntry["severity"]) || "info",
            message: data.message,
          };
          setLogs((prev) => [...prev, newLog]);
        } else if (data.type === "status") {
          setStreamStatus(`${data.deploymentStatus} - ${data.buildStatus}`);
        } else if (data.type === "complete") {
          setStreamStatus(`Complete: ${data.buildStatus}`);
          ws.close();
        } else if (data.type === "error") {
          console.error("Stream error:", data.message);

          if (data.message && data.message.includes("No build associated")) {
            setStreamStatus("waiting for build...");
            ws.close();
            return;
          }

          toasts.general.error("Stream Error", data.message);
        }
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = (event) => {
      setStreamStatus("disconnected");
      setIsStreaming(false);
      wsRef.current = null;

      if (event.code !== 1000 && autoStream) {
        console.log("Stream closed unexpectedly. Retrying in 3s...");
        retryTimeoutRef.current = setTimeout(() => {
          startStream();
        }, 3000);
      }
    };
  }, [deploymentId, autoStream]);

  // Stop WebSocket streaming
  const stopStream = useCallback(() => {
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsStreaming(false);
    setStreamStatus("disconnected");
  }, []);

  // Download logs
  const downloadLogs = useCallback(async () => {
    try {
      await logsService.downloadLogs(deploymentId);
      toasts.general.success(
        "Logs Downloaded",
        "Build logs saved to your device"
      );
    } catch (err) {
      console.error("Download error:", err);
      toasts.general.error("Download Failed", "Could not download logs");
    }
  }, [deploymentId]);

  // Initial fetch
  useEffect(() => {
    fetchLogs();

    if (autoStream) {
      startStream();
    }

    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [fetchLogs, autoStream, startStream]);

  return {
    logs,
    isLoading,
    isStreaming,
    streamStatus,
    error,
    refresh: fetchLogs,
    startStream,
    stopStream,
    downloadLogs,
  };
}
