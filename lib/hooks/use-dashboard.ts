import { useState, useEffect, useCallback } from "react";
import { dashboardService } from "@/lib/api/services/dashboard.service";
import type { DashboardData } from "@/types/models/dashboard.types";
// FIX: Import from 'lib/toast-utils', not 'components/ui/toaster'
import { generalToasts } from "@/lib/toast-utils";

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      // Only set loading true on initial load if data doesn't exist
      if (!data) setIsLoading(true);

      const dashboardData = await dashboardService.getDashboard();
      setData(dashboardData);
      setError(null);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to fetch dashboard");
      setError(error);
      console.error("Dashboard fetch error:", error);

      // Use the correct utility
      generalToasts.error(
        "Sync Failed",
        "Could not retrieve dashboard telemetry."
      );
    } finally {
      setIsLoading(false);
    }
  }, [data]);

  // Initial fetch
  useEffect(() => {
    fetchDashboard();

    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  return {
    data,
    isLoading,
    error,
    refresh: fetchDashboard,
  };
}
