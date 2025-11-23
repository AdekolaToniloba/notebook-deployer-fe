/**
 * Deployment Config Form Component
 *
 * Form for configuring deployment resources (CPU, memory, scaling).
 * Used in both one-click deploy and manual deploy flows.
 *
 * Features:
 * - Zod validation
 * - React Hook Form integration
 * - Pre-configured options with good defaults
 * - Clear descriptions for each option
 */

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type ControllerRenderProps } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DeploymentConfig } from "@/types/models/deployment.types";

/**
 * Form validation schema
 *
 * Validates deployment configuration with sensible constraints.
 */
const deploymentConfigFormSchema = z
  .object({
    cpu: z.enum(["0.5", "1", "2", "4", "8"]),
    memory: z.enum(["128Mi", "256Mi", "512Mi", "1Gi", "2Gi", "4Gi", "8Gi"]),
    minInstances: z.number().int().min(0).max(10, {
      message: "Min instances must be between 0 and 10",
    }),
    maxInstances: z.number().int().min(1).max(100, {
      message: "Max instances must be between 1 and 100",
    }),
  })
  .refine((data) => data.maxInstances >= data.minInstances, {
    message: "Max instances must be greater than or equal to min instances",
    path: ["maxInstances"],
  });

type DeploymentConfigFormValues = z.infer<typeof deploymentConfigFormSchema>;

/**
 * Deployment Config Form Props
 */
interface DeploymentConfigFormProps {
  defaultValues?: Partial<DeploymentConfig>;
  onSubmit: (config: DeploymentConfig) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

/**
 * CPU options with descriptions
 */
const cpuOptions = [
  { value: "0.5", label: "0.5 CPU", description: "Minimal (testing)" },
  { value: "1", label: "1 CPU", description: "Light workloads" },
  { value: "2", label: "2 CPUs", description: "Moderate workloads" },
  { value: "4", label: "4 CPUs", description: "Heavy workloads" },
  { value: "8", label: "8 CPUs", description: "Intensive workloads" },
] as const;

/**
 * Memory options with descriptions
 */
const memoryOptions = [
  { value: "128Mi", label: "128 MB", description: "Minimal" },
  { value: "256Mi", label: "256 MB", description: "Very light" },
  { value: "512Mi", label: "512 MB", description: "Light" },
  { value: "1Gi", label: "1 GB", description: "Moderate" },
  { value: "2Gi", label: "2 GB", description: "Standard" },
  { value: "4Gi", label: "4 GB", description: "Heavy" },
  { value: "8Gi", label: "8 GB", description: "Very heavy" },
] as const;

/**
 * Deployment Config Form Component
 *
 * @example
 * ```tsx
 * <DeploymentConfigForm
 *   defaultValues={{ cpu: '1', memory: '512Mi' }}
 *   onSubmit={(config) => handleDeploy(config)}
 *   onCancel={() => setShowForm(false)}
 * />
 * ```
 */
export function DeploymentConfigForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = "Deploy",
}: DeploymentConfigFormProps) {
  // Initialize form with defaults
  const form = useForm<DeploymentConfigFormValues>({
    resolver: zodResolver(deploymentConfigFormSchema),
    defaultValues: {
      cpu: (defaultValues?.cpu || "1") as DeploymentConfigFormValues["cpu"],
      memory: (defaultValues?.memory ||
        "512Mi") as DeploymentConfigFormValues["memory"],
      minInstances: defaultValues?.minInstances ?? 0,
      maxInstances: defaultValues?.maxInstances ?? 10,
    },
  });

  // Handle form submission
  const handleSubmit = (values: DeploymentConfigFormValues) => {
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* CPU Selection */}
        <FormField
          control={form.control}
          name="cpu"
          render={({
            field,
          }: {
            field: ControllerRenderProps<DeploymentConfigFormValues, "cpu">;
          }) => (
            <FormItem>
              <FormLabel>CPU Allocation</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select CPU" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {cpuOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center justify-between gap-4 w-full">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                CPU cores allocated to each instance. More CPUs = faster
                processing, higher cost.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Memory Selection */}
        <FormField
          control={form.control}
          name="memory"
          render={({
            field,
          }: {
            field: ControllerRenderProps<DeploymentConfigFormValues, "memory">;
          }) => (
            <FormItem>
              <FormLabel>Memory Allocation</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select memory" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {memoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center justify-between gap-4 w-full">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                RAM allocated to each instance. More memory = handle larger
                datasets, higher cost.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Scaling Configuration */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Min Instances */}
          <FormField
            control={form.control}
            name="minInstances"
            render={({
              field,
            }: {
              field: ControllerRenderProps<
                DeploymentConfigFormValues,
                "minInstances"
              >;
            }) => (
              <FormItem>
                <FormLabel>Minimum Instances</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value, 10))
                    }
                  />
                </FormControl>
                <FormDescription>
                  Instances always running. 0 = scale to zero when idle.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Max Instances */}
          <FormField
            control={form.control}
            name="maxInstances"
            render={({
              field,
            }: {
              field: ControllerRenderProps<
                DeploymentConfigFormValues,
                "maxInstances"
              >;
            }) => (
              <FormItem>
                <FormLabel>Maximum Instances</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value, 10))
                    }
                  />
                </FormControl>
                <FormDescription>
                  Max instances during high traffic.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Cost Estimate */}
        <div className="rounded-lg border bg-muted/50 p-4">
          <p className="text-sm font-medium mb-2">Estimated Cost</p>
          <p className="text-xs text-muted-foreground">
            Based on selected configuration:
          </p>
          <ul className="text-xs text-muted-foreground mt-2 space-y-1">
            <li>• CPU: {form.watch("cpu")} cores per instance</li>
            <li>• Memory: {form.watch("memory")} per instance</li>
            <li>
              • Scaling: {form.watch("minInstances")} -{" "}
              {form.watch("maxInstances")} instances
            </li>
          </ul>
          <p className="text-xs text-muted-foreground mt-2">
            Cloud Run pricing is based on usage. You only pay for CPU/memory
            when serving requests.
          </p>
        </div>

        {/* Form Actions */}
        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? "Deploying..." : submitLabel}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}

/**
 * Compact Config Summary
 *
 * Shows current deployment config in a compact format.
 * Useful for displaying existing config before updates.
 *
 * @example
 * ```tsx
 * <DeploymentConfigSummary config={deployment.config} />
 * ```
 */
interface DeploymentConfigSummaryProps {
  config: DeploymentConfig;
  className?: string;
}

export function DeploymentConfigSummary({
  config,
  className,
}: DeploymentConfigSummaryProps) {
  return (
    <div className={className}>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground">CPU</dt>
          <dd className="font-medium">{config.cpu} cores</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Memory</dt>
          <dd className="font-medium">{config.memory}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Min Instances</dt>
          <dd className="font-medium">{config.minInstances}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Max Instances</dt>
          <dd className="font-medium">{config.maxInstances}</dd>
        </div>
      </dl>
    </div>
  );
}
