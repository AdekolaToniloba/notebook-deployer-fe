/**
 * Progress Stepper Component
 *
 * Step-by-step progress indicator for pipeline execution.
 * Shows which steps are completed, current, and upcoming.
 *
 * Design: Clean, minimal stepper with clear visual hierarchy.
 * Uses connecting lines and status indicators.
 */

import { Check, Circle, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  PipelineStep,
  PipelineStatus,
} from "@/types/models/pipeline.types";

/**
 * Step Status
 *
 * Derived from pipeline state.
 */
type StepStatus = "completed" | "current" | "upcoming" | "failed";

/**
 * Progress Stepper Props
 */
interface ProgressStepperProps {
  steps: readonly PipelineStep[] | PipelineStep[];
  currentStep: PipelineStep;
  completedSteps: readonly PipelineStep[] | PipelineStep[];
  status: PipelineStatus;
  orientation?: "horizontal" | "vertical";
  className?: string;
}

/**
 * Step labels mapping
 */
const stepLabels: Record<PipelineStep, string> = {
  parse: "Parse Notebook",
  dependencies: "Analyze Dependencies",
  upload: "Upload to Cloud",
  build: "Build Container",
  deploy: "Deploy to Cloud Run",
};

/**
 * Step descriptions
 */
const stepDescriptions: Record<PipelineStep, string> = {
  parse: "Extracting code from notebook",
  dependencies: "Detecting required packages",
  upload: "Uploading source to cloud storage",
  build: "Building Docker container image",
  deploy: "Deploying to Google Cloud Run",
};

/**
 * Get step status
 *
 * Determines if step is completed, current, upcoming, or failed.
 */
function getStepStatus(
  step: PipelineStep,
  currentStep: PipelineStep,
  completedSteps: readonly PipelineStep[] | PipelineStep[],
  pipelineStatus: PipelineStatus
): StepStatus {
  // If pipeline failed and this is current step, mark as failed
  if (pipelineStatus === "failed" && step === currentStep) {
    return "failed";
  }

  // If step is in completed list, it's completed
  if (completedSteps.includes(step)) {
    return "completed";
  }

  // If step is current step, it's current
  if (step === currentStep) {
    return "current";
  }

  // Otherwise, it's upcoming
  return "upcoming";
}

/**
 * Step Icon Component
 *
 * Shows appropriate icon based on step status.
 */
function StepIcon({ status }: { status: StepStatus }) {
  const iconMap = {
    completed: (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white">
        <Check className="h-5 w-5" />
      </div>
    ),
    current: (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    ),
    upcoming: (
      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-muted-foreground/30 bg-background text-muted-foreground">
        <Circle className="h-4 w-4" />
      </div>
    ),
    failed: (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white">
        <XCircle className="h-5 w-5" />
      </div>
    ),
  };

  return iconMap[status];
}

/**
 * Horizontal Stepper
 */
function HorizontalStepper({
  steps,
  currentStep,
  completedSteps,
  status,
  className,
}: ProgressStepperProps) {
  return (
    <div className={cn("w-full", className)}>
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepStatus = getStepStatus(
            step,
            currentStep,
            completedSteps,
            status
          );
          const isLastStep = index === steps.length - 1;

          return (
            <li key={step} className="flex flex-1 items-center">
              {/* Step content */}
              <div className="flex flex-col items-center gap-2">
                {/* Icon */}
                <StepIcon status={stepStatus} />

                {/* Label */}
                <div className="text-center">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      stepStatus === "completed" && "text-green-700",
                      stepStatus === "current" && "text-blue-700",
                      stepStatus === "upcoming" && "text-muted-foreground",
                      stepStatus === "failed" && "text-red-700"
                    )}
                  >
                    {stepLabels[step]}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[120px]">
                    {stepDescriptions[step]}
                  </p>
                </div>
              </div>

              {/* Connector line */}
              {!isLastStep && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-4",
                    stepStatus === "completed"
                      ? "bg-green-600"
                      : "bg-muted-foreground/20"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/**
 * Vertical Stepper
 */
function VerticalStepper({
  steps,
  currentStep,
  completedSteps,
  status,
  className,
}: ProgressStepperProps) {
  return (
    <div className={cn("w-full", className)}>
      <ol className="space-y-4">
        {steps.map((step, index) => {
          const stepStatus = getStepStatus(
            step,
            currentStep,
            completedSteps,
            status
          );
          const isLastStep = index === steps.length - 1;

          return (
            <li key={step} className="flex gap-4">
              {/* Icon and connector column */}
              <div className="flex flex-col items-center">
                <StepIcon status={stepStatus} />

                {/* Connector line */}
                {!isLastStep && (
                  <div
                    className={cn(
                      "w-0.5 h-full min-h-[48px] mt-2",
                      stepStatus === "completed"
                        ? "bg-green-600"
                        : "bg-muted-foreground/20"
                    )}
                  />
                )}
              </div>

              {/* Content column */}
              <div className="flex-1 pb-6">
                <p
                  className={cn(
                    "text-sm font-medium",
                    stepStatus === "completed" && "text-green-700",
                    stepStatus === "current" && "text-blue-700",
                    stepStatus === "upcoming" && "text-muted-foreground",
                    stepStatus === "failed" && "text-red-700"
                  )}
                >
                  {stepLabels[step]}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stepDescriptions[step]}
                </p>

                {/* Show status text for current/failed */}
                {stepStatus === "current" && (
                  <p className="text-xs text-blue-600 mt-2 font-medium">
                    In progress...
                  </p>
                )}
                {stepStatus === "failed" && (
                  <p className="text-xs text-red-600 mt-2 font-medium">
                    Failed
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/**
 * Progress Stepper Component
 *
 * @example
 * ```tsx
 * // Horizontal stepper
 * <ProgressStepper
 *   steps={['parse', 'dependencies', 'upload', 'build', 'deploy']}
 *   currentStep="build"
 *   completedSteps={['parse', 'dependencies', 'upload']}
 *   status="processing"
 *   orientation="horizontal"
 * />
 *
 * // Vertical stepper
 * <ProgressStepper
 *   steps={['parse', 'dependencies', 'upload', 'build', 'deploy']}
 *   currentStep="deploy"
 *   completedSteps={['parse', 'dependencies', 'upload', 'build']}
 *   status="processing"
 *   orientation="vertical"
 * />
 * ```
 */
export function ProgressStepper({
  steps,
  currentStep,
  completedSteps,
  status,
  orientation = "horizontal",
  className,
}: ProgressStepperProps) {
  if (orientation === "vertical") {
    return (
      <VerticalStepper
        steps={steps}
        currentStep={currentStep}
        completedSteps={completedSteps}
        status={status}
        className={className}
      />
    );
  }

  return (
    <HorizontalStepper
      steps={steps}
      currentStep={currentStep}
      completedSteps={completedSteps}
      status={status}
      className={className}
    />
  );
}

/**
 * Compact Stepper
 *
 * Minimal version showing just icons and connecting lines.
 * Good for space-constrained UIs.
 *
 * @example
 * ```tsx
 * <CompactStepper
 *   steps={['parse', 'dependencies', 'upload', 'build', 'deploy']}
 *   currentStep="build"
 *   completedSteps={['parse', 'dependencies', 'upload']}
 *   status="processing"
 * />
 * ```
 */
interface CompactStepperProps {
  steps: readonly PipelineStep[] | PipelineStep[];
  currentStep: PipelineStep;
  completedSteps: readonly PipelineStep[] | PipelineStep[];
  status: PipelineStatus;
  className?: string;
}

export function CompactStepper({
  steps,
  currentStep,
  completedSteps,
  status,
  className,
}: CompactStepperProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {steps.map((step, index) => {
        const stepStatus = getStepStatus(
          step,
          currentStep,
          completedSteps,
          status
        );
        const isLastStep = index === steps.length - 1;

        return (
          <div key={step} className="flex items-center gap-2">
            {/* Mini icon */}
            <div
              className={cn(
                "h-3 w-3 rounded-full border-2",
                stepStatus === "completed" && "bg-green-600 border-green-600",
                stepStatus === "current" &&
                  "bg-blue-600 border-blue-600 animate-pulse",
                stepStatus === "upcoming" && "border-muted-foreground/30",
                stepStatus === "failed" && "bg-red-600 border-red-600"
              )}
              title={stepLabels[step]}
            />

            {/* Connector */}
            {!isLastStep && (
              <div
                className={cn(
                  "h-0.5 w-6",
                  stepStatus === "completed"
                    ? "bg-green-600"
                    : "bg-muted-foreground/20"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
