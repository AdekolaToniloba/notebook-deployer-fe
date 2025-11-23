/**
 * Build Logs Viewer Component
 *
 * Displays build logs with syntax highlighting and useful features.
 *
 * Features:
 * - Syntax highlighting for better readability
 * - Auto-scroll to bottom option
 * - Download logs
 * - Copy to clipboard
 * - Search/filter
 * - Line numbers
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { Download, Copy, Search, ChevronsDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Build Logs Viewer Props
 */
interface BuildLogsViewerProps {
  logs: string;
  buildId: number;
  isLoading?: boolean;
  showLineNumbers?: boolean;
  maxHeight?: string;
  className?: string;
}

/**
 * Build Logs Viewer Component
 *
 * @example
 * ```tsx
 * const { logs, loading } = useBuildLogs(buildId);
 *
 * <BuildLogsViewer
 *   logs={logs}
 *   buildId={buildId}
 *   isLoading={loading}
 *   showLineNumbers
 * />
 * ```
 */
export function BuildLogsViewer({
  logs,
  buildId,
  isLoading = false,
  showLineNumbers = true,
  maxHeight = "600px",
  className,
}: BuildLogsViewerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Split logs into lines
  const lines = logs.split("\n");

  // Filter lines based on search
  const filteredLines = searchTerm
    ? lines.filter((line) =>
        line.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : lines;

  // Auto-scroll to bottom when logs update
  useEffect(() => {
    if (autoScroll && logsContainerRef.current) {
      logsContainerRef.current.scrollTop =
        logsContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(logs);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy logs:", error);
    }
  };

  // Download logs
  const handleDownload = () => {
    const blob = new Blob([logs], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `build-${buildId}-logs.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop =
        logsContainerRef.current.scrollHeight;
    }
  };

  return (
    <div className={cn("rounded-lg border bg-card", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b bg-muted/30">
        {/* Search */}
        <div className="flex-1 max-w-xs relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>

        {/* Auto-scroll toggle */}
        <Button
          size="sm"
          variant={autoScroll ? "default" : "outline"}
          onClick={() => setAutoScroll(!autoScroll)}
          className="h-8 text-xs"
        >
          <ChevronsDown className="h-3 w-3 mr-2" />
          Auto-scroll
        </Button>

        {/* Copy */}
        <Button
          size="sm"
          variant="outline"
          onClick={handleCopy}
          className="h-8 text-xs"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 mr-2" />
              Copy
            </>
          )}
        </Button>

        {/* Download */}
        <Button
          size="sm"
          variant="outline"
          onClick={handleDownload}
          className="h-8 text-xs"
        >
          <Download className="h-3 w-3 mr-2" />
          Download
        </Button>
      </div>

      {/* Logs content */}
      <div
        ref={logsContainerRef}
        className="overflow-auto bg-slate-950 text-slate-50 font-mono text-xs"
        style={{ maxHeight }}
      >
        {isLoading ? (
          <div className="p-4 text-muted-foreground">Loading logs...</div>
        ) : logs ? (
          <div className="p-4">
            {filteredLines.map((line, index) => (
              <LogLine
                key={index}
                line={line}
                lineNumber={showLineNumbers ? index + 1 : undefined}
                searchTerm={searchTerm}
              />
            ))}
          </div>
        ) : (
          <div className="p-4 text-muted-foreground">No logs available</div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-2 border-t bg-muted/30 text-xs text-muted-foreground">
        <span>
          {filteredLines.length} {filteredLines.length === 1 ? "line" : "lines"}
          {searchTerm && ` (filtered from ${lines.length})`}
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={scrollToBottom}
          className="h-6 text-xs"
        >
          Scroll to bottom
        </Button>
      </div>
    </div>
  );
}

/**
 * Log Line Component
 *
 * Individual log line with syntax highlighting.
 */
interface LogLineProps {
  line: string;
  lineNumber?: number;
  searchTerm?: string;
}

function LogLine({ line, lineNumber, searchTerm }: LogLineProps) {
  // Determine line color based on content
  const getLineColor = (text: string): string => {
    const lower = text.toLowerCase();

    // Error lines
    if (
      lower.includes("error") ||
      lower.includes("fail") ||
      lower.includes("fatal")
    ) {
      return "text-red-400";
    }

    // Warning lines
    if (lower.includes("warn") || lower.includes("warning")) {
      return "text-yellow-400";
    }

    // Success lines
    if (
      lower.includes("success") ||
      lower.includes("complete") ||
      lower.includes("done")
    ) {
      return "text-green-400";
    }

    // Info lines
    if (lower.includes("info") || lower.includes("step")) {
      return "text-blue-400";
    }

    // Default
    return "text-slate-300";
  };

  // Highlight search term
  const highlightText = (
    text: string,
    highlight: string
  ): React.ReactElement => {
    if (!highlight) return <>{text}</>;

    const parts = text.split(new RegExp(`(${highlight})`, "gi"));

    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="bg-yellow-500/50 text-yellow-100">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  return (
    <div className="flex hover:bg-slate-900/50">
      {/* Line number */}
      {lineNumber !== undefined && (
        <span className="select-none w-12 text-right pr-4 text-slate-600 flex-shrink-0">
          {lineNumber}
        </span>
      )}

      {/* Line content */}
      <span className={cn("break-all", getLineColor(line))}>
        {searchTerm ? highlightText(line, searchTerm) : line}
      </span>
    </div>
  );
}

/**
 * Compact Logs Viewer
 *
 * Minimal version without toolbar.
 * Good for embedding in other components.
 *
 * @example
 * ```tsx
 * <CompactLogsViewer logs={logs} maxLines={20} />
 * ```
 */
interface CompactLogsViewerProps {
  logs: string;
  maxLines?: number;
  maxHeight?: string;
  className?: string;
}

export function CompactLogsViewer({
  logs,
  maxLines = 50,
  maxHeight = "300px",
  className,
}: CompactLogsViewerProps) {
  const lines = logs.split("\n").slice(0, maxLines);
  const truncated = logs.split("\n").length > maxLines;

  return (
    <div className={cn("rounded-md border overflow-hidden", className)}>
      <div
        className="overflow-auto bg-slate-950 text-slate-50 font-mono text-xs p-3"
        style={{ maxHeight }}
      >
        {lines.map((line, index) => (
          <LogLine key={index} line={line} />
        ))}
        {truncated && (
          <div className="text-slate-500 mt-2">
            ... {logs.split("\n").length - maxLines} more lines
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Logs Error Display
 *
 * Specialized component for displaying error logs.
 * Automatically filters for error/warning lines.
 *
 * @example
 * ```tsx
 * <LogsErrorDisplay logs={logs} />
 * ```
 */
interface LogsErrorDisplayProps {
  logs: string;
  className?: string;
}

export function LogsErrorDisplay({ logs, className }: LogsErrorDisplayProps) {
  // Extract error and warning lines
  const errorLines = logs.split("\n").filter((line) => {
    const lower = line.toLowerCase();
    return (
      lower.includes("error") ||
      lower.includes("fail") ||
      lower.includes("fatal") ||
      lower.includes("warn")
    );
  });

  if (errorLines.length === 0) {
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        No errors or warnings found in logs.
      </div>
    );
  }

  return (
    <div className={cn("rounded-md border overflow-hidden", className)}>
      <div className="bg-red-50 border-b border-red-200 p-2">
        <p className="text-xs font-medium text-red-800">
          {errorLines.length} {errorLines.length === 1 ? "issue" : "issues"}{" "}
          found
        </p>
      </div>
      <div className="bg-slate-950 text-slate-50 font-mono text-xs p-3 max-h-[300px] overflow-auto">
        {errorLines.map((line, index) => (
          <LogLine key={index} line={line} />
        ))}
      </div>
    </div>
  );
}
