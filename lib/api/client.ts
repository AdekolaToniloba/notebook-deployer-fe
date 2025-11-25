import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosRequestConfig,
} from "axios";
import { tokenManager } from "@/lib/auth/token-manager";
import {
  tokenResponseSchema,
  type TokenResponse,
} from "@/lib/validations/auth.schemas";
import { APP_CONFIG } from "@/lib/config";

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
  tokenType: string;
  expiresIn?: number;
}

export class ApiClient {
  private client!: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: FailedQueueItem[] = [];

  constructor() {
    this.client = axios.create({
      baseURL: APP_CONFIG.API_URL,
      timeout: 30_000,
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = tokenManager.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (err) => Promise.reject(err)
    );

    this.client.interceptors.response.use(
      (res) => res,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        if (!originalRequest) return Promise.reject(this.transformError(error));

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (originalRequest.url?.includes("/auth/refresh")) {
            return Promise.reject(this.transformError(error));
          }

          if (this.isRefreshing) {
            return this.queueRequest(originalRequest);
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const { accessToken } = await this.refreshToken();
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            this.processQueue(null);
            return this.client(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError);
            tokenManager.clearTokens();
            if (typeof window !== "undefined") {
              window.location.href = "/login";
            }
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
    return new Promise<AxiosResponse>((resolve, reject) => {
      this.failedQueue.push({
        resolve: () => {
          const token = tokenManager.getAccessToken();
          if (token) {
            request.headers.Authorization = `Bearer ${token}`;
          }
          resolve(this.client(request));
        },
        reject: (err) => reject(err),
      });
    });
  }

  private processQueue(error: unknown | null) {
    this.failedQueue.forEach((prom) => {
      if (error) prom.reject(error);
      else prom.resolve();
    });
    this.failedQueue = [];
  }

  private async refreshToken(): Promise<TokenPair> {
    const currentRefreshToken = tokenManager.getRefreshToken();

    if (!currentRefreshToken) {
      throw new ApiError("No refresh token available", 401);
    }

    const response = await axios.post(
      `${APP_CONFIG.API_URL}/api/v1/auth/refresh`,
      { refresh_token: currentRefreshToken },
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );

    const parsed: TokenResponse = tokenResponseSchema.parse(response.data);

    const tokens: TokenPair = {
      accessToken: parsed.access_token,
      refreshToken: parsed.refresh_token,
      tokenType: parsed.token_type,
    };

    tokenManager.setTokens(tokens);
    return tokens;
  }

  private transformError(error: AxiosError<unknown>): ApiError {
    const data = error.response?.data as Record<string, unknown> | undefined;
    let message = error.message;

    if (data) {
      if (typeof data.detail === "string") message = data.detail;
      else if (Array.isArray(data.detail) && data.detail.length > 0) {
        const firstError = data.detail[0] as { msg?: string } | undefined;
        message = firstError?.msg || "Validation error";
      }
    }

    return new ApiError(message, error.response?.status, data);
  }

  // Wrapper methods...
  public get<T = unknown>(url: string, config?: AxiosRequestConfig) {
    return this.client.get<T>(url, config);
  }
  public post<T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ) {
    return this.client.post<T>(url, data, config);
  }
  public put<T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ) {
    return this.client.put<T>(url, data, config);
  }
  public delete<T = unknown>(url: string, config?: AxiosRequestConfig) {
    return this.client.delete<T>(url, config);
  }
}

let apiClientInstance: ApiClient | null = null;
export function getApiClient(): ApiClient {
  if (!apiClientInstance) apiClientInstance = new ApiClient();
  return apiClientInstance;
}
export default getApiClient;
