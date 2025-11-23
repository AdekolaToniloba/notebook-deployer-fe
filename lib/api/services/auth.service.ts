// src/lib/api/services/auth.service.ts
import getApiClient from "@/lib/api/client";
import { tokenManager } from "@/lib/auth/token-manager";
import {
  LoginInput,
  RegisterInput,
  UserResponse,
  TokenResponse,
  loginSchema,
  registerSchema,
  userResponseSchema,
  tokenResponseSchema,
} from "@/lib/validations/auth.schemas";

/**
 * Auth Service
 * - uses lazy API client (getApiClient) to avoid circular init
 * - normalizes token response shape before storing in tokenManager
 */

class AuthService {
  async register(data: RegisterInput): Promise<UserResponse> {
    // Validate input before sending
    const validated = registerSchema.parse(data);

    // Remove confirmPassword before sending to API
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...payload } = validated as RegisterInput & {
      confirmPassword?: string;
    };

    const api = getApiClient();
    const response = await api.post("/api/v1/auth/register", payload);
    return userResponseSchema.parse(response.data);
  }

  async login(data: LoginInput): Promise<TokenResponse> {
    // Validate input
    const validated = loginSchema.parse(data);

    const api = getApiClient();
    const response = await api.post("/api/v1/auth/login", validated);
    const parsed = tokenResponseSchema.parse(response.data) as Record<
      string,
      unknown
    >;

    // Normalize token fields (support snake_case and camelCase)
    const accessToken = String(
      parsed["access_token"] ?? parsed["accessToken"] ?? ""
    );
    const refreshToken = String(
      parsed["refresh_token"] ?? parsed["refreshToken"] ?? ""
    );
    const tokenType =
      (typeof parsed["token_type"] === "string" &&
        String(parsed["token_type"])) ||
      (typeof parsed["tokenType"] === "string" &&
        String(parsed["tokenType"])) ||
      "Bearer";

    // Store tokens securely (tokenManager expects { accessToken, refreshToken, tokenType })
    tokenManager.setTokens({
      accessToken,
      refreshToken,
      tokenType,
    });

    // Return validated TokenResponse (use original zod-validated shape if you want)
    // if tokenResponseSchema defines a richer type, return that instead
    return tokenResponseSchema.parse(response.data) as TokenResponse;
  }

  async getCurrentUser(): Promise<UserResponse> {
    const api = getApiClient();
    const response = await api.get("/api/v1/auth/me");
    return userResponseSchema.parse(response.data);
  }

  async logout(): Promise<void> {
    const api = getApiClient();
    try {
      await api.post("/api/v1/auth/logout");
    } finally {
      // Clear tokens regardless of API response
      tokenManager.clearTokens();
      // Clear any other stored data
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("auth-storage");
      }
    }
  }

  async refreshToken(): Promise<TokenResponse> {
    const api = getApiClient();
    const response = await api.post("/api/v1/auth/refresh");
    const parsed = tokenResponseSchema.parse(response.data) as Record<
      string,
      unknown
    >;

    const accessToken = String(
      parsed["access_token"] ?? parsed["accessToken"] ?? ""
    );
    const refreshToken = String(
      parsed["refresh_token"] ?? parsed["refreshToken"] ?? ""
    );
    const tokenType =
      (typeof parsed["token_type"] === "string" &&
        String(parsed["token_type"])) ||
      (typeof parsed["tokenType"] === "string" &&
        String(parsed["tokenType"])) ||
      "Bearer";

    tokenManager.setTokens({
      accessToken,
      refreshToken,
      tokenType,
    });

    return tokenResponseSchema.parse(response.data) as TokenResponse;
  }
}

export const authService = new AuthService();
