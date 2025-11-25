import apiClient from "@/lib/api/client";
import type {
  AdminSystemMetrics,
  AdminUserActivityResponse,
  AdminDeploymentOverview,
  AdminUser,
  AdminUserUpdate,
} from "@/types/api/admin.types";

class AdminService {
  private static BASE_PATH = "/api/v1/admin";

  // Metrics
  async getSystemMetrics(): Promise<AdminSystemMetrics> {
    const { data } = await apiClient().get<AdminSystemMetrics>(
      `${AdminService.BASE_PATH}/metrics/system`
    );
    return data;
  }

  async getUserActivity(): Promise<AdminUserActivityResponse> {
    const { data } = await apiClient().get<AdminUserActivityResponse>(
      `${AdminService.BASE_PATH}/metrics/users/activity`
    );
    return data;
  }

  async getDeploymentOverview(): Promise<AdminDeploymentOverview> {
    const { data } = await apiClient().get<AdminDeploymentOverview>(
      `${AdminService.BASE_PATH}/metrics/deployments/overview`
    );
    return data;
  }

  // User Management
  async listUsers(skip = 0, limit = 100): Promise<AdminUser[]> {
    const { data } = await apiClient().get<AdminUser[]>(
      `${AdminService.BASE_PATH}/users`,
      { params: { skip, limit } }
    );
    return data;
  }

  async updateUser(
    userId: number,
    updateData: AdminUserUpdate
  ): Promise<AdminUser> {
    const { data } = await apiClient().put<AdminUser>(
      `${AdminService.BASE_PATH}/users/${userId}`,
      updateData
    );
    return data;
  }

  async deleteUser(userId: number): Promise<void> {
    await apiClient().delete(`${AdminService.BASE_PATH}/users/${userId}`);
  }
}

export const adminService = new AdminService();
