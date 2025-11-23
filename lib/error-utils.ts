import { toast } from "sonner"; // Or your toast library

export function handleError(
  error: unknown,
  context: string = "An error occurred"
) {
  console.error(context, error);
  const message = error instanceof Error ? error.message : "Unknown error";
  // Replace with your actual toast/notification trigger
  // toast.error(`${context}: ${message}`);
  alert(`${context}: ${message}`); // Fallback if no toast provider
}
