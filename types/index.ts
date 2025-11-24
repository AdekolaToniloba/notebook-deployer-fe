// types/index.ts - Core API types

/**
 * User entity
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

/**
 * Authentication response
 */
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

/**
 * Notebook entity
 */
export interface Notebook {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  status: "draft" | "processing" | "ready" | "error";
}

/**
 * Build entity
 */
export interface Build {
  id: string;
  notebook_id: string;
  status: "pending" | "building" | "success" | "failed";
  created_at: string;
  updated_at: string;
  logs?: string;
  duration?: string;
}

/**
 * Deployment entity
 */
export interface Deployment {
  id: string;
  notebook_id: string;
  build_id: string;
  name: string;
  url: string;
  status: "active" | "inactive" | "error";
  created_at: string;
  deployed_at?: string;
  traffic_percentage?: number;
}

/**
 * API Error
 */
export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, unknown>;
}

/**
 * Activity item for feed
 */
export interface Activity {
  id: string;
  type: "success" | "error" | "pending" | "info";
  title: string;
  description: string;
  timestamp: string;
}

/**
 * Form data types
 */
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Stats data for dashboard
 */
export interface StatData {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    positive: boolean;
  };
}

/**
 * Sidebar item
 */
export interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

/**
 * Toast notification
 */
export interface ToastData {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactElement;
  variant?: "default" | "destructive";
}
