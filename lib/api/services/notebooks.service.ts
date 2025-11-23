// lib/api/notebooks.service.ts

import getApiClient from "@/lib/api/client";
import {
  notebookUploadResponseSchema,
  notebookParseResponseSchema,
  notebookListResponseSchema,
  notebookDetailResponseSchema,
  fileContentResponseSchema,
} from "@/lib/validations/notebook.schemas";
import type {
  NotebookUploadResponse,
  NotebookParseResponse,
  NotebookListResponse,
  NotebookDetailResponse,
  FileContentResponse,
} from "@/types/api/notebooks.types";

/**
 * Notebook Service
 *
 * This layer handles ALL HTTP communication with the notebook API.
 *
 * Why a separate service?
 * 1. Isolation: All API logic in one place
 * 2. Reusability: Multiple components can use the same service
 * 3. Testing: Easy to mock for unit tests
 * 4. Type Safety: Strongly typed requests and responses
 * 5. Validation: Validates all responses from the API
 *
 * Security considerations:
 * - Uses getApiClient() which handles auth tokens automatically
 * - Validates all responses with Zod to prevent XSS
 * - Proper error handling and transformation
 * - No sensitive data in error messages
 */

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
   *
   * @param file - The .ipynb file to upload
   * @returns Upload response with notebook ID and status
   *
   * Why FormData?
   * - Multipart upload is required for file uploads
   * - Browser handles encoding automatically
   * - Backend expects multipart/form-data
   */
  async uploadNotebook(
    notebookFile: File,
    modelFile?: File | null
  ): Promise<NotebookUploadResponse> {
    // Use native fetch for file upload to avoid Axios header interference
    // FormData + fetch works perfectly without any configuration

    const formData = new FormData();
    formData.append("notebook_file", notebookFile);

    if (modelFile) {
      formData.append("model_file", modelFile);
    }
    // Get auth token
    const token =
      typeof window !== "undefined"
        ? (
            await import("@/lib/auth/token-manager")
          ).tokenManager.getAccessToken()
        : null;

    const baseURL = process.env.NEXT_PUBLIC_API_URL || "";

    // Use fetch instead of Axios for FormData uploads
    const response = await fetch(`${baseURL}/api/v1/notebooks/upload`, {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        // DO NOT set Content-Type - let browser set it with boundary
      },
      body: formData,
    });

    // Handle non-OK responses
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Upload failed" }));
      throw new Error(
        errorData.message || `Upload failed with status ${response.status}`
      );
    }

    const data = await response.json();

    // Validate response with Zod
    return notebookUploadResponseSchema.parse(data);
  }

  /**
   * Parse a notebook and extract dependencies
   *
   * @param notebookId - ID of the notebook to parse
   * @returns Parse result with dependencies and cell count
   *
   * Why a separate parse step?
   * - Upload is fast, parsing can be slow
   * - User gets immediate feedback on upload
   * - Can retry parsing without re-uploading
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
   *
   * @returns Array of notebook list items
   *
   * Why list vs detail?
   * - Lists are fast, only essential data
   * - Details are slow, load on demand
   * - Better UX with faster list loads
   */
  async listNotebooks(): Promise<NotebookListResponse> {
    const api = getApiClient();

    const response = await api.get<NotebookListResponse>("/api/v1/notebooks");

    return notebookListResponseSchema.parse(response.data);
  }

  /**
   * Get full notebook details
   *
   * @param notebookId - ID of the notebook
   * @returns Full notebook details
   *
   * When to use?
   * - Detail views
   * - Before building/deploying
   * - When you need file paths or parsed data
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
   *
   * @param notebookId - ID of the notebook to delete
   *
   * Security note:
   * - Backend validates ownership
   * - Can only delete your own notebooks
   * - 204 response = success (no content)
   */
  async deleteNotebook(notebookId: number): Promise<void> {
    const api = getApiClient();

    await api.delete(`/api/v1/notebooks/${notebookId}`);

    // 204 response has no body, so no validation needed
  }

  /**
   * Download generated main.py file
   *
   * @param notebookId - ID of the notebook
   * @returns Python file content as string
   *
   * Why download instead of inline?
   * - Large files can crash browser if rendered
   * - User might want to save locally
   * - Preview before deploying
   */
  async downloadMainPy(notebookId: number): Promise<FileContentResponse> {
    const api = getApiClient();

    // Axios will handle text responses automatically
    const response = await api.get<FileContentResponse>(
      `/api/v1/notebooks/${notebookId}/files/main.py`
    );

    // Validate it's a non-empty string
    return fileContentResponseSchema.parse(response.data);
  }

  /**
   * Download generated requirements.txt file
   *
   * @param notebookId - ID of the notebook
   * @returns Requirements file content as string
   *
   * Why separate from main.py?
   * - User might want only one file
   * - Smaller payload if you just need deps
   * - Can validate each file type separately
   */
  async downloadRequirementsTxt(
    notebookId: number
  ): Promise<FileContentResponse> {
    const api = getApiClient();

    // Axios will handle text responses automatically
    const response = await api.get<FileContentResponse>(
      `/api/v1/notebooks/${notebookId}/files/requirements.txt`
    );

    return fileContentResponseSchema.parse(response.data);
  }
}

// Export singleton instance
export const notebookService = new NotebookService();
