export function handleError(
  error: unknown,
  context: string = "An error occurred"
) {
  console.error(context, error);
  const message = error instanceof Error ? error.message : "Unknown error";
  alert(`${context}: ${message}`);
}
