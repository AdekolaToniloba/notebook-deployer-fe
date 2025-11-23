// app/(auth)/layout.tsx

import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Simple header with logo */}
      <div className="absolute top-0 left-0 p-6">
        <Link href="/" className="text-2xl font-bold text-primary">
          NotebookCloud
        </Link>
      </div>

      {/* Centered content */}
      <div className="flex items-center justify-center min-h-screen p-4">
        {children}
      </div>
    </div>
  );
}
