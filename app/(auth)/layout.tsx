// app/(auth)/layout.tsx

"use client";

import Link from "next/link";
import { AetherLogo } from "@/components/branding/aether-logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute -top-20 -left-20 w-80 h-80 border-4 border-dashed border-gray-200 rounded-full" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 border-4 border-black/5 rounded-full" />

      {/* Simple header with logo */}
      <div className="absolute top-0 left-0 p-6">
        <Link href="/">
          <AetherLogo variant="minimal" size="sm" />
        </Link>
      </div>

      {/* Centered content */}
      <div className="flex items-center justify-center min-h-screen p-4 z-10">
        {children}
      </div>
    </div>
  );
}
