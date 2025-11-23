/**
 * Toaster Component
 *
 * Wrapper around sonner's Toaster with custom styling.
 * Add this to your root layout for toast notifications throughout the app.
 *
 * Installation:
 * npm install sonner
 *
 * Usage in app/layout.tsx:
 * import { Toaster } from '@/components/ui/toaster';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         {children}
 *         <Toaster />
 *       </body>
 *     </html>
 *   );
 * }
 */

"use client";

import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "next-themes";

/**
 * Toaster Props
 */
interface ToasterProps {
  position?:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "top-center"
    | "bottom-center";
  expand?: boolean;
  richColors?: boolean;
  closeButton?: boolean;
}

/**
 * Toaster Component
 *
 * @example
 * ```tsx
 * // In app/layout.tsx
 * <Toaster position="top-right" />
 * ```
 */
export function Toaster({
  position = "top-right",
  expand = false,
  richColors = false,
  closeButton = true,
}: ToasterProps = {}) {
  const { theme } = useTheme();

  return (
    <SonnerToaster
      position={position}
      expand={expand}
      richColors={richColors}
      closeButton={closeButton}
      theme={theme as "light" | "dark" | "system" | undefined}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
    />
  );
}
