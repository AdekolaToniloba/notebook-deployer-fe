"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/hooks/use-auth";
import { User, Settings, HelpCircle, LogOut, ChevronDown } from "lucide-react";

export function UserDropdown() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const avatarLetter = user?.username?.[0]?.toUpperCase() || "U";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 border-2 border-black px-3 py-1.5 bg-white transition-all
          ${
            isOpen
              ? "shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]"
              : "hover:bg-gray-50"
          }
        `}
      >
        <div className="flex h-8 w-8 items-center justify-center border-2 border-black bg-[#FFDE59] font-mono font-bold">
          {avatarLetter}
        </div>
        <span className="hidden md:inline-block font-mono font-bold text-sm">
          {user.username}
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-64 border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] z-50"
          >
            <div className="border-b-2 border-black p-4 bg-gray-50">
              <p className="font-mono font-bold text-sm truncate">
                {user.username}
              </p>
              <p className="font-mono text-xs text-gray-500 truncate">
                {user.email}
              </p>
            </div>

            <div className="p-2 space-y-1">
              {[
                {
                  label: "Profile",
                  icon: User,
                  action: () => router.push("/profile"),
                },
                {
                  label: "Settings",
                  icon: Settings,
                  action: () => router.push("/settings"),
                },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    setIsOpen(false);
                    item.action();
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2 font-mono text-sm font-bold hover:bg-[#B6DFF] border border-transparent hover:border-black transition-colors"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </div>

            <div className="border-t-2 border-black p-2">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-3 py-2 font-mono text-sm font-bold text-red-600 hover:bg-red-50 border border-transparent hover:border-red-600 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                SIGN OUT
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
