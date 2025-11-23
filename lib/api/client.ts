// lib/api/client.ts
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { tokenManager } from "@/lib/auth/token-manager";
import { tokenResponseSchema } from "@/lib/validations/auth.schemas";

/**
 * Lazy API Client
 * - no eager `new ApiClient()` at module load
 * - use getApiClient() to obtain the singleton instance
 * - tokenType always string (defaults to "Bearer")
 * - no `any` used
 */

export class ApiError extends Error {
  constructor(message: string, public status?: number, public data?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

type FailedQueueItem = {
  resolve: () => void;
  reject: (reason?: unknown) => void;
};

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: string; // required
  expiresIn?: number;
}

export class ApiClient {
  private client!: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: FailedQueueItem[] = [];

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL,
      timeout: 30_000,
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        try {
          const token = tokenManager?.getAccessToken?.() ?? null;
          if (token) {
            config.headers = config.headers ?? {};
            (
              config.headers as Record<string, unknown>
            ).Authorization = `Bearer ${token}`;
          }

          const csrf = this.getCSRFToken();
          if (csrf) {
            config.headers = config.headers ?? {};
            (config.headers as Record<string, unknown>)["X-CSRF-Token"] = csrf;
          }
        } catch {
          // defensive — do not throw during request setup
        }

        return config;
      },
      (err) => Promise.reject(err)
    );

    this.client.interceptors.response.use(
      (res) => res,
      async (error: AxiosError<unknown>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        if (!originalRequest) return Promise.reject(this.transformError(error));

        const status = error.response?.status;
        if (status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return this.queueRequest(originalRequest);
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            await this.refreshToken();
            this.processQueue(null);
            return this.client(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError);
            try {
              tokenManager?.clearTokens?.();
            } catch {}
            if (typeof window !== "undefined") window.location.href = "/login";
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(this.transformError(error));
      }
    );
  }

  private queueRequest(request: InternalAxiosRequestConfig) {
    return new Promise<AxiosResponse<unknown>>((resolve, reject) => {
      this.failedQueue.push({
        resolve: () => resolve(undefined as unknown as AxiosResponse<unknown>),
        reject: (reason?: unknown) => reject(reason),
      });
    }).then(() => this.client(request));
  }

  private processQueue(error: unknown | null) {
    this.failedQueue.forEach((entry) => {
      if (error) entry.reject(error);
      else entry.resolve();
    });
    this.failedQueue = [];
  }

  /**
   * Refresh access token using refresh token
   *
   * IMPORTANT: The backend returns BOTH a new access token AND a new refresh token.
   * We must store BOTH new tokens, not reuse the old refresh token.
   *
   * Flow:
   * 1. Get current refresh token from storage
   * 2. Send to /refresh endpoint
   * 3. Backend responds with NEW access token AND NEW refresh token
   * 4. Store both new tokens
   * 5. Next refresh uses the NEW refresh token
   */
  private async refreshToken(): Promise<TokenPair> {
    // Get the current refresh token from storage
    const currentRefreshToken = tokenManager.getRefreshToken();

    if (!currentRefreshToken) {
      throw new ApiError("No refresh token available", 401);
    }

    // Send refresh token to backend to get new tokens
    const response = await this.client.post("/api/v1/auth/refresh", {
      refresh_token: currentRefreshToken,
    });

    const parsed = tokenResponseSchema.parse(response.data) as Record<
      string,
      unknown
    >;

    // Extract new access token from response
    const accessToken = String(
      parsed["access_token"] ?? parsed["accessToken"] ?? ""
    );

    // Extract NEW refresh token from response (CRITICAL!)
    // The backend gives us a new refresh token - we must use it
    const newRefreshToken = String(
      parsed["refresh_token"] ?? parsed["refreshToken"] ?? ""
    );

    const tokenType =
      (typeof parsed["token_type"] === "string" &&
        String(parsed["token_type"])) ||
      (typeof parsed["tokenType"] === "string" &&
        String(parsed["tokenType"])) ||
      "Bearer";
    const expiresIn =
      typeof parsed["expires_in"] === "number"
        ? parsed["expires_in"]
        : typeof parsed["expiresIn"] === "number"
        ? parsed["expiresIn"]
        : undefined;

    const tokens: TokenPair = {
      accessToken,
      refreshToken: newRefreshToken, // ✅ Use the NEW refresh token from response
      tokenType,
      expiresIn,
    };

    // Persist tokens via tokenManager (strict shape)
    try {
      tokenManager.setTokens(tokens);
    } catch {
      // swallow to avoid breaking refresh flow if tokenManager does something unexpected
      if (typeof window !== "undefined") {
        // last-resort fallback (won't be used if tokenManager works)
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", newRefreshToken); // ✅ Store new refresh token
        localStorage.setItem("tokenType", tokenType);
      }
    }

    return tokens;
  }

  private getCSRFToken(): string | null {
    if (typeof document !== "undefined") {
      const el = document.querySelector('meta[name="csrf-token"]');
      return el?.getAttribute("content") ?? null;
    }
    return null;
  }

  private transformError(error: AxiosError<unknown>): ApiError {
    const data = (error.response?.data ?? undefined) as
      | Record<string, unknown>
      | undefined;
    let message = error.message;
    if (data) {
      if (typeof data["detail"] === "string") message = String(data["detail"]);
      else if (typeof data["message"] === "string")
        message = String(data["message"]);
    }
    return new ApiError(message, error.response?.status, data);
  }

  // typed wrapper methods
  public get<T = unknown>(url: string, config?: InternalAxiosRequestConfig) {
    return this.client.get<T>(url, config);
  }
  public post<T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: InternalAxiosRequestConfig
  ) {
    return this.client.post<T>(url, data, config);
  }
  public put<T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: InternalAxiosRequestConfig
  ) {
    return this.client.put<T>(url, data, config);
  }
  public patch<T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: InternalAxiosRequestConfig
  ) {
    return this.client.patch<T>(url, data, config);
  }
  public delete<T = unknown>(url: string, config?: InternalAxiosRequestConfig) {
    return this.client.delete<T>(url, config);
  }
}

// Lazy singleton factory: use this instead of importing a created instance
let apiClientInstance: ApiClient | null = null;
export function getApiClient(): ApiClient {
  if (!apiClientInstance) apiClientInstance = new ApiClient();
  return apiClientInstance;
}
export default getApiClient;
