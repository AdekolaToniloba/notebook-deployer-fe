/**
 * API Error Types
 */

/**
 * Base API error structure
 */
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * Validation error from API (FastAPI format)
 */
export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

/**
 * Type guard to check if error is an API error
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as Record<string, unknown>).message === "string"
  );
}

/**
 * Type guard to check if error has a response (axios error)
 */
export function hasErrorResponse(
  error: unknown
): error is { response: { data: { detail?: string } } } {
  return (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as Record<string, unknown>).response === "object"
  );
}

/**
 * Extract error message from various error types
 */
export function extractErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message;
  }

  if (hasErrorResponse(error) && error.response?.data?.detail) {
    return error.response.data.detail;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred";
}
