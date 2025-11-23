"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  items: SidebarItem[];
}

export function Sidebar({ items }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r-2 border-black bg-gray-50 hidden lg:block h-[calc(100vh-64px)] sticky top-16 overflow-y-auto">
      <nav className="space-y-3 p-6">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="block relative group"
            >
              {/* ACTIVE STATE: bg-black, text-white */}
              {/* INACTIVE STATE: bg-transparent, text-gray-500 */}
              <motion.div
                className={`relative z-10 flex items-center gap-3 border-2 px-4 py-3 font-mono text-sm font-bold uppercase tracking-wide transition-all
                  ${
                    isActive
                      ? "border-black bg-black text-white shadow-[4px_4px_0px_0px_#B6DFF] translate-x-[-2px] translate-y-[-2px]"
                      : "border-transparent hover:border-black hover:bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-gray-500 hover:text-black"
                  }
                `}
              >
                {/* Icon Color Logic: If active, white. If inactive, gray (hover black) */}
                <span
                  className={`${
                    isActive
                      ? "text-white"
                      : "text-gray-400 group-hover:text-black"
                  }`}
                >
                  {item.icon}
                </span>
                {item.label}
              </motion.div>

              {/* Background Shadow Block (Only needed for visual depth if using transparency, but here we use solid colors) */}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
