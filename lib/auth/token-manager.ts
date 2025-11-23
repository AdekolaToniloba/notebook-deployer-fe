/**
 * Token Manager - Production Ready
 * Handles storage and retrieval of JWT tokens.
 */

interface TokenData {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

class TokenManager {
  private readonly ACCESS_TOKEN_KEY = "auth_access_token";
  private readonly REFRESH_TOKEN_KEY = "auth_refresh_token";
  private readonly TOKEN_TYPE_KEY = "auth_token_type";

  /**
   * Store tokens in localStorage (Persistent)
   */
  setTokens(data: TokenData): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, data.accessToken);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, data.refreshToken);
      localStorage.setItem(this.TOKEN_TYPE_KEY, data.tokenType);
    } catch (e) {
      console.warn("Token storage failed", e);
    }
  }

  getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  getTokenType(): string {
    if (typeof window === "undefined") return "Bearer";
    return localStorage.getItem(this.TOKEN_TYPE_KEY) || "Bearer";
  }

  /**
   * Returns the full value for the Authorization header
   * Example: "Bearer eyJhbGci..."
   */
  getAuthHeader(): string | null {
    const token = this.getAccessToken();
    if (!token) return null;
    return `${this.getTokenType()} ${token}`;
  }

  clearTokens(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_TYPE_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

export const tokenManager = new TokenManager();
