// lib/api/notebooks.service.ts

import getApiClient from "@/lib/api/client";
import {
  notebookUploadResponseSchema,
  notebookParseResponseSchema,
  notebookListResponseSchema,
  notebookDetailResponseSchema,
  fileContentResponseSchema,
  modelVersionSchema,
  modelVersionListSchema,
  ModelVersion,
  ModelVersionList,
} from "@/lib/validations/notebook.schemas";
import type {
  NotebookUploadResponse,
  NotebookParseResponse,
  NotebookListResponse,
  NotebookDetailResponse,
  FileContentResponse,
} from "@/types/api/notebooks.types";
import { APP_CONFIG } from "@/lib/config";

export interface NotebookAnalyzeResponse {
  id: number;
  status: string;
  health_score: number;
  resource_estimates: {
    cpu: string;
    memory: string;
    cold_start: string;
  };
  security_issues: string[];
}

class NotebookService {
  /**
   * Upload a Jupyter notebook file
   */
  async uploadNotebook(
    notebookFile: File,
    modelFile?: File | null
  ): Promise<NotebookUploadResponse> {
    // Remember: Used native fetch for file upload to avoid Axios header interference

    const formData = new FormData();
    formData.append("notebook_file", notebookFile);

    if (modelFile) {
      formData.append("model_file", modelFile);
    }

    const token =
      typeof window !== "undefined"
        ? (
            await import("@/lib/auth/token-manager")
          ).tokenManager.getAccessToken()
        : null;

    const baseURL = APP_CONFIG.API_URL || "";

    const response = await fetch(`${baseURL}/api/v1/notebooks/upload`, {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        //Remeber: DO NOT set Content-Type - let browser set it with boundary
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Upload failed" }));
      throw new Error(
        errorData.message || `Upload failed with status ${response.status}`
      );
    }

    const data = await response.json();

    return notebookUploadResponseSchema.parse(data);
  }

  /**
   * Parse a notebook and extract dependencies
   * Step 3
   */
  async parseNotebook(notebookId: number): Promise<NotebookParseResponse> {
    const api = getApiClient();

    const response = await api.post<NotebookParseResponse>(
      `/api/v1/notebooks/${notebookId}/parse`
    );

    return notebookParseResponseSchema.parse(response.data);
  }

  /**
   * Analyze notebook with Gemini AI
   * Step 4 in System Flow
   */
  async analyzeNotebook(notebookId: number): Promise<NotebookAnalyzeResponse> {
    const api = getApiClient();
    const response = await api.post<NotebookAnalyzeResponse>(
      `/api/v1/notebooks/${notebookId}/analyze`
    );
    return response.data;
  }

  /**
   * List all notebooks for current user
   */
  async listNotebooks(): Promise<NotebookListResponse> {
    const api = getApiClient();

    const response = await api.get<NotebookListResponse>("/api/v1/notebooks");

    return notebookListResponseSchema.parse(response.data);
  }

  /**
   * List all model versions for a notebook
   */
  async listModelVersions(notebookId: number): Promise<ModelVersionList> {
    const api = getApiClient();
    const response = await api.get<ModelVersionList>(
      `/api/v1/notebooks/${notebookId}/models`
    );
    return modelVersionListSchema.parse(response.data);
  }

  /**
   * Upload a new model version (Option A)
   */
  async uploadModelVersion(
    notebookId: number,
    file: File,
    accuracy?: number
  ): Promise<ModelVersion> {
    const formData = new FormData();
    formData.append("file", file);
    if (accuracy) {
      formData.append("accuracy", accuracy.toString());
    }
    const api = getApiClient();
    const response = await api.post<ModelVersion>(
      `/api/v1/notebooks/${notebookId}/models`,
      formData
    );
    return modelVersionSchema.parse(response.data);
  }

  /**
   * Replace the active model (Option B)
   */
  async replaceActiveModel(
    notebookId: number,
    file: File,
    accuracy?: number
  ): Promise<ModelVersion> {
    const formData = new FormData();
    formData.append("file", file);
    if (accuracy) {
      formData.append("accuracy", accuracy.toString());
    }
    const api = getApiClient();
    // Note: The method is PUT for this endpoint
    const response = await api.put<ModelVersion>(
      `/api/v1/notebooks/${notebookId}/models/replace`,
      formData
    );
    return modelVersionSchema.parse(response.data);
  }

  /**
   * Activate a specific model version
   */
  async activateModelVersion(
    notebookId: number,
    version: number
  ): Promise<ModelVersion> {
    const api = getApiClient();
    const response = await api.post<ModelVersion>(
      `/api/v1/notebooks/${notebookId}/models/${version}/activate`
    );
    return modelVersionSchema.parse(response.data);
  }

  /**
   * Delete a model version
   */
  async deleteModelVersion(notebookId: number, version: number): Promise<void> {
    const api = getApiClient();
    await api.delete(`/api/v1/notebooks/${notebookId}/models/${version}`);
  }

  /**
   * Get full notebook details
   */
  async getNotebook(notebookId: number): Promise<NotebookDetailResponse> {
    const api = getApiClient();

    const response = await api.get<NotebookDetailResponse>(
      `/api/v1/notebooks/${notebookId}`
    );

    return notebookDetailResponseSchema.parse(response.data);
  }

  /**
   * Delete a notebook and its files
   */
  async deleteNotebook(notebookId: number): Promise<void> {
    const api = getApiClient();

    await api.delete(`/api/v1/notebooks/${notebookId}`);
  }

  /**
   * Download generated main.py file
   */
  async downloadMainPy(notebookId: number): Promise<FileContentResponse> {
    const api = getApiClient();

    const response = await api.get<FileContentResponse>(
      `/api/v1/notebooks/${notebookId}/files/main.py`
    );

    return fileContentResponseSchema.parse(response.data);
  }

  /**
   * Download generated requirements.txt file
   */
  async downloadRequirementsTxt(
    notebookId: number
  ): Promise<FileContentResponse> {
    const api = getApiClient();

    const response = await api.get<FileContentResponse>(
      `/api/v1/notebooks/${notebookId}/files/requirements.txt`
    );

    return fileContentResponseSchema.parse(response.data);
  }
}

export const notebookService = new NotebookService();
