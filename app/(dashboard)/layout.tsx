// notebook-deployer-fe/app/(dashboard)/layout.tsx
"use client";

import { useMemo } from "react";
import { Sidebar } from "@/components/navigation/sidebar";
import { Navbar } from "@/components/navigation/navbar";
import {
  LayoutDashboard,
  BookMarked,
  Cloud,
  Zap,
  Settings,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sidebarItems = useMemo(
    () => [
      {
        label: "Overview",
        href: "/dashboard",
        icon: <LayoutDashboard className="h-4 w-4" />,
      },
      {
        label: "Notebooks",
        href: "/notebooks",
        icon: <BookMarked className="h-4 w-4" />,
      },
      {
        label: "Deploy",
        href: "/deploy",
        icon: <Cloud className="h-4 w-4" />,
      },
      {
        label: "Deployments",
        href: "/deployments",
        icon: <Cloud className="h-4 w-4" />,
      },
      {
        label: "Builds",
        href: "/builds",
        icon: <Zap className="h-4 w-4" />,
      },
      {
        label: "Settings",
        href: "/settings",
        icon: <Settings className="h-4 w-4" />,
      },
    ],
    []
  );

  return (
    <>
      <Navbar />
      <div className="flex h-[calc(100vh-64px)]">
        <div className="hidden border-r border-border md:block w-56">
          <Sidebar items={sidebarItems} />
        </div>
        <main className="flex-1 overflow-auto bg-background">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </>
  );
}
