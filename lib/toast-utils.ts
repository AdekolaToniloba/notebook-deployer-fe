import { toast } from "sonner";
import type { ExternalToast } from "sonner";

/**
 * Base toast configurations
 */
const toastConfig: ExternalToast = {
  duration: 5000,
  closeButton: true,
};

/**
 * Build Toast Notifications
 */
export const buildToasts = {
  /**
   * Build started successfully
   */
  triggered: (buildId: number, notebookId: number) => {
    toast.success("Build Started", {
      ...toastConfig,
      description: `Building notebook #${notebookId}`,
      action: {
        label: "View Build",
        onClick: () => {
          window.location.href = `/dashboard/builds/${buildId}`;
        },
      },
    });
  },

  /**
   * Build completed successfully
   */
  success: (buildId: number, duration?: number) => {
    const description = duration
      ? `Build completed in ${Math.round(duration / 1000)}s`
      : "Build completed successfully";

    toast.success("Build Complete", {
      ...toastConfig,
      description,
      action: {
        label: "View Build",
        onClick: () => {
          window.location.href = `/dashboard/builds/${buildId}`;
        },
      },
    });
  },

  /**
   * Build failed
   */
  failed: (buildId: number, errorMessage?: string) => {
    toast.error("Build Failed", {
      ...toastConfig,
      duration: 8000, // Longer for errors
      description: errorMessage || "Check build logs for details",
      action: {
        label: "View Logs",
        onClick: () => {
          window.location.href = `/dashboard/builds/${buildId}`;
        },
      },
    });
  },

  /**
   * Build refresh success
   */
  refreshed: (buildId: number) => {
    toast.info("Build Status Updated", {
      ...toastConfig,
      duration: 3000,
      description: `Build #${buildId} status refreshed`,
    });
  },

  /**
   * Build logs copied
   */
  logsCopied: () => {
    toast.success("Logs Copied", {
      ...toastConfig,
      duration: 2000,
      description: "Build logs copied to clipboard",
    });
  },
};

/**
 * Deployment Toast Notifications
 */
export const deploymentToasts = {
  /**
   * Deployment started
   */
  started: (deploymentId: number, notebookId: number) => {
    toast.info("Deployment Started", {
      ...toastConfig,
      description: `Deploying notebook #${notebookId} to Cloud Run`,
      action: {
        label: "View",
        onClick: () => {
          window.location.href = `/dashboard/deployments/${deploymentId}`;
        },
      },
    });
  },

  /**
   * Deployment completed successfully
   */
  success: (deploymentId: number, serviceUrl?: string) => {
    toast.success("Deployment Complete!", {
      ...toastConfig,
      description: "Your notebook is now live",
      action: serviceUrl
        ? {
            label: "Visit App",
            onClick: () => {
              window.open(serviceUrl, "_blank");
            },
          }
        : {
            label: "View Details",
            onClick: () => {
              window.location.href = `/dashboard/deployments/${deploymentId}`;
            },
          },
    });
  },

  /**
   * Deployment failed
   */
  failed: (deploymentId: number, errorMessage?: string) => {
    toast.error("Deployment Failed", {
      ...toastConfig,
      duration: 8000,
      description: errorMessage || "Check deployment details for more info",
      action: {
        label: "View Details",
        onClick: () => {
          window.location.href = `/dashboard/deployments/${deploymentId}`;
        },
      },
    });
  },

  /**
   * Traffic updated
   */
  trafficUpdated: (deploymentId: number, trafficPercent: number) => {
    toast.success("Traffic Updated", {
      ...toastConfig,
      description: `Traffic split updated to ${trafficPercent}%`,
    });
  },

  /**
   * Rollback completed
   */
  rolledBack: (deploymentId: number, revisionName: string) => {
    toast.success("Rollback Complete", {
      ...toastConfig,
      description: `Rolled back to ${revisionName}`,
      action: {
        label: "View",
        onClick: () => {
          window.location.href = `/dashboard/deployments/${deploymentId}`;
        },
      },
    });
  },
};

/**
 * Pipeline Toast Notifications (One-Click Deploy)
 */
export const pipelineToasts = {
  /**
   * Pipeline started
   */
  started: (pipelineId: string, notebookId: number) => {
    toast.info("Deployment Pipeline Started", {
      ...toastConfig,
      description: "Building and deploying your notebook",
    });
  },

  /**
   * Pipeline completed successfully
   */
  success: (pipelineId: string, serviceUrl?: string) => {
    toast.success("Deployment Complete! 🎉", {
      ...toastConfig,
      duration: 10000, // Longer for success
      description: "Your notebook is now live and ready to use",
      action: serviceUrl
        ? {
            label: "Visit App",
            onClick: () => {
              window.open(serviceUrl, "_blank");
            },
          }
        : undefined,
    });
  },

  /**
   * Pipeline failed
   */
  failed: (pipelineId: string, errorMessage?: string, failedStep?: string) => {
    const description = failedStep
      ? `Failed at step: ${failedStep}`
      : errorMessage || "Check pipeline status for details";

    toast.error("Deployment Failed", {
      ...toastConfig,
      duration: 10000,
      description,
    });
  },

  /**
   * Pipeline step completed
   */
  stepCompleted: (step: string) => {
    const stepMessages: Record<string, string> = {
      parse: "Notebook parsed successfully",
      dependencies: "Dependencies analyzed",
      upload: "Source uploaded to cloud",
      build: "Container built successfully",
      deploy: "Deploying to Cloud Run",
    };

    toast.info(stepMessages[step] || `${step} completed`, {
      ...toastConfig,
      duration: 3000,
    });
  },
};

/**
 * General Toast Notifications
 */
export const generalToasts = {
  /**
   * Generic success
   */
  success: (message: string, description?: string) => {
    toast.success(message, {
      ...toastConfig,
      description,
    });
  },

  /**
   * Generic error
   */
  error: (message: string, description?: string) => {
    toast.error(message, {
      ...toastConfig,
      duration: 8000,
      description,
    });
  },

  /**
   * Generic info
   */
  info: (message: string, description?: string) => {
    toast.info(message, {
      ...toastConfig,
      description,
    });
  },

  /**
   * Generic warning
   */
  warning: (message: string, description?: string) => {
    toast.warning(message, {
      ...toastConfig,
      description,
    });
  },

  /**
   * Loading toast with promise
   */
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ) => {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
      ...toastConfig,
    });
  },

  /**
   * Copied to clipboard
   */
  copied: (itemName = "Text") => {
    toast.success(`${itemName} Copied`, {
      ...toastConfig,
      duration: 2000,
      description: "Copied to clipboard",
    });
  },

  /**
   * Network error
   */
  networkError: () => {
    toast.error("Network Error", {
      ...toastConfig,
      duration: 6000,
      description: "Please check your connection and try again",
    });
  },

  /**
   * Authentication error
   */
  authError: () => {
    toast.error("Session Expired", {
      ...toastConfig,
      duration: 8000,
      description: "Please log in again to continue",
      action: {
        label: "Log In",
        onClick: () => {
          window.location.href = "/auth/login";
        },
      },
    });
  },

  /**
   * Permission error
   */
  permissionError: () => {
    toast.error("Permission Denied", {
      ...toastConfig,
      duration: 6000,
      description: "You don't have permission to perform this action",
    });
  },
};

/**
 * File Upload Toast Notifications
 */
export const fileToasts = {
  /**
   * File upload started
   */
  uploading: (filename: string) => {
    return toast.loading("Uploading", {
      description: filename,
    });
  },

  /**
   * File upload success
   */
  uploaded: (toastId: string | number, filename: string) => {
    toast.success("Upload Complete", {
      id: toastId,
      description: filename,
      duration: 3000,
    });
  },

  /**
   * File upload error
   */
  uploadError: (toastId: string | number, error: string) => {
    toast.error("Upload Failed", {
      id: toastId,
      description: error,
      duration: 6000,
    });
  },

  /**
   * File too large
   */
  tooLarge: (maxSize: string) => {
    toast.error("File Too Large", {
      ...toastConfig,
      description: `Maximum file size is ${maxSize}`,
    });
  },

  /**
   * Invalid file type
   */
  invalidType: (allowedTypes: string[]) => {
    toast.error("Invalid File Type", {
      ...toastConfig,
      description: `Allowed types: ${allowedTypes.join(", ")}`,
    });
  },
};

/**
 * Export all toast utilities
 */
export const toasts = {
  build: buildToasts,
  deployment: deploymentToasts,
  pipeline: pipelineToasts,
  general: generalToasts,
  file: fileToasts,
};
