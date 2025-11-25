"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal,
  Download,
  RefreshCw,
  Power,
  PowerOff,
  Copy,
  AlertCircle,
} from "lucide-react";
import { useDeploymentLogs } from "@/lib/hooks/use-deployment-logs";
import type { LogEntry } from "@/types/models/logs.types";
import { generalToasts } from "@/lib/toast-utils";

interface LogTerminalProps {
  deploymentId: number;
  autoStream?: boolean;
  className?: string;
}

export function LogTerminal({
  deploymentId,
  autoStream = false,
  className = "",
}: LogTerminalProps) {
  const {
    logs,
    isLoading,
    isStreaming,
    streamStatus,
    error,
    refresh,
    startStream,
    stopStream,
    downloadLogs,
  } = useDeploymentLogs({ deploymentId, autoStream });

  const terminalRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const copyAllLogs = () => {
    const logText = logs
      .map(
        (log) =>
          `[${log.timestamp.toISOString()}] [${log.severity.toUpperCase()}] ${
            log.message
          }`
      )
      .join("\n");

    navigator.clipboard.writeText(logText);
    generalToasts.copied("Logs");
  };

  const getSeverityColor = (severity: LogEntry["severity"]) => {
    switch (severity) {
      case "error":
      case "critical":
        return "text-red-400";
      case "warning":
        return "text-yellow-400";
      case "debug":
        return "text-gray-400";
      case "info":
      default:
        return "text-green-400";
    }
  };

  if (error) {
    return (
      <div className={`border-4 border-black bg-red-50 p-6 ${className}`}>
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle className="h-6 w-6" />
          <div>
            <p className="font-mono font-bold uppercase">Failed to Load Logs</p>
            <p className="font-mono text-sm mt-1">{error.message}</p>
          </div>
          <button
            onClick={refresh}
            className="ml-auto bg-black text-white px-4 py-2 font-mono font-bold uppercase hover:bg-gray-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`border-4 border-black bg-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${className}`}
    >
      {/* Terminal Header */}
      <div className="bg-[#1a1a1a] border-b-4 border-black p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Terminal className="h-5 w-5 text-green-400" />
          <span className="font-mono text-white font-bold uppercase text-sm">
            Build Logs
          </span>
          <div className="flex gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500 border border-white/20" />
            <div className="h-3 w-3 rounded-full bg-yellow-500 border border-white/20" />
            <div
              className={`h-3 w-3 rounded-full border border-white/20 ${
                isStreaming ? "bg-green-500 animate-pulse" : "bg-gray-500"
              }`}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-white/60 uppercase mr-2">
            {streamStatus}
          </span>

          {isStreaming ? (
            <button
              onClick={stopStream}
              className="p-2 bg-red-600 hover:bg-red-700 text-white border-2 border-white/20 transition-colors"
              title="Stop Stream"
            >
              <PowerOff className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={startStream}
              className="p-2 bg-green-600 hover:bg-green-700 text-white border-2 border-white/20 transition-colors"
              title="Start Stream"
            >
              <Power className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={refresh}
            disabled={isLoading}
            className="p-2 bg-white/10 hover:bg-white/20 text-white border-2 border-white/20 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>

          <button
            onClick={copyAllLogs}
            className="p-2 bg-white/10 hover:bg-white/20 text-white border-2 border-white/20 transition-colors"
            title="Copy Logs"
          >
            <Copy className="h-4 w-4" />
          </button>

          <button
            onClick={downloadLogs}
            className="p-2 bg-white/10 hover:bg-white/20 text-white border-2 border-white/20 transition-colors"
            title="Download Logs"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div
        ref={terminalRef}
        className="bg-black p-4 font-mono text-sm overflow-y-auto h-96 scrollbar-thin scrollbar-thumb-green-400 scrollbar-track-black"
      >
        {isLoading && logs.length === 0 ? (
          <div className="flex items-center gap-2 text-gray-400">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading build logs...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            <Terminal className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="uppercase font-bold">No Logs Available</p>
            <p className="text-xs mt-2">Build logs will appear here</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {logs.map((log, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="mb-1 hover:bg-white/5 px-2 py-1 rounded border-l-2 border-transparent hover:border-green-400 transition-all"
              >
                <span className="text-gray-500 text-xs">
                  [{log.timestamp.toLocaleTimeString()}]
                </span>
                <span
                  className={`ml-2 font-bold text-xs ${getSeverityColor(
                    log.severity
                  )}`}
                >
                  [{log.severity.toUpperCase()}]
                </span>
                <span className="ml-2 text-white/90">{log.message}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {/* Live Indicator */}
        {isStreaming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 flex items-center gap-2 text-green-400"
          >
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-bold uppercase">
              Streaming Live...
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
