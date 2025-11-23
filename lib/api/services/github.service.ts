// lib/api/services/github.service.ts

import { getApiClient } from "@/lib/api/client";

export interface GithubStatusResponse {
  github_username: string | null;
  connected: boolean;
}

export interface GithubAuthorizeResponse {
  url: string;
}

export interface GithubScopesResponse {
  scopes: string[];
  has_repo_access: boolean;
  required_scopes: string[];
  needs_reauth: boolean;
}

export interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  private: boolean;
}

export interface CreateRepoRequest {
  notebook_id: number;
  repo_name: string;
  description?: string;
  private?: boolean;
}

export interface CreateRepoResponse {
  repo_url: string;
  repo_name: string;
  owner: string;
}

class GithubService {
  /**
   * Get GitHub connection status
   */
  async getStatus(): Promise<GithubStatusResponse> {
    const api = getApiClient();
    const response = await api.get<GithubStatusResponse>(
      "/api/v1/github/status"
    );
    return response.data;
  }

  /**
   * Get OAuth Authorization URL
   */
  async getAuthorizeUrl(): Promise<string> {
    const api = getApiClient();
    const response = await api.get<GithubAuthorizeResponse>(
      "/api/v1/github/oauth/authorize"
    );
    return response.data.url;
  }

  /**
   * Create a GitHub repository for a notebook and push code
   */
  async createRepo(data: CreateRepoRequest): Promise<CreateRepoResponse> {
    const api = getApiClient();
    const response = await api.post<CreateRepoResponse>(
      "/api/v1/github/create-repo",
      data
    );
    return response.data;
  }

  /**
   * List user's repositories
   */
  async listRepos(): Promise<GithubRepo[]> {
    const api = getApiClient();
    const response = await api.get<GithubRepo[]>("/api/v1/github/repos");
    return response.data;
  }

  /**
   * Get current GitHub scopes
   */
  async getScopes(): Promise<GithubScopesResponse> {
    const api = getApiClient();
    const response = await api.get<GithubScopesResponse>(
      "/api/v1/github/scopes"
    );
    return response.data;
  }

  /**
   * Disconnect GitHub account
   */
  async disconnect(): Promise<void> {
    const api = getApiClient();
    await api.post("/api/v1/github/disconnect");
  }
}

export const githubService = new GithubService();
