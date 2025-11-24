"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { UserDropdown } from "@/components/navigation/user-dropdown";
import {
  Bell,
  Menu,
  X,
  LayoutDashboard,
  FileCode,
  Rocket,
  Server,
  Settings,
  LogOut,
} from "lucide-react";

const marketingNavItems = [
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Docs", href: "/docs" },
];

const appNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Notebooks", href: "/notebooks", icon: FileCode },
  { label: "Deploy", href: "/deploy", icon: Rocket },
  { label: "Deployments", href: "/deployments", icon: Server },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = useCallback((href: string) => pathname === href, [pathname]);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    router.push("/");
  };

  // Helper to get user initial
  const avatarLetter = user?.username?.[0]?.toUpperCase() || "U";

  return (
    <nav className="sticky top-0 z-50 border-b-2 border-black bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href={isAuthenticated ? "/dashboard" : "/"}
          className="flex items-center gap-2 group"
        >
          <motion.div
            className="flex h-10 w-10 items-center justify-center border-2 border-black bg-[#B6DFF] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
            whileHover={{
              translate: "2px 2px",
              boxShadow: "0px 0px 0px 0px rgba(0,0,0,1)",
            }}
          >
            <span className="font-mono text-lg font-bold text-black">ND</span>
          </motion.div>
          <span className="font-mono text-xl font-bold uppercase tracking-tighter text-black group-hover:underline decoration-2 underline-offset-4">
            NotebookDeploy
          </span>
        </Link>

        {/* Desktop Nav - Marketing */}
        {!isAuthenticated && (
          <div className="hidden md:flex items-center gap-8">
            {marketingNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative font-mono text-sm font-bold uppercase tracking-wide transition-colors hover:text-black ${
                  isActive(item.href) ? "text-black" : "text-gray-500"
                }`}
              >
                {item.label}
                {isActive(item.href) && (
                  <span className="absolute -bottom-1 left-0 right-0 h-1 bg-[#B6DFF] border border-black" />
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              {/* Notification Bell */}
              <motion.button
                className="relative hidden md:flex h-10 w-10 items-center justify-center border-2 border-black bg-white hover:bg-gray-50"
                whileHover={{
                  y: -2,
                  boxShadow: "3px 3px 0px 0px rgba(0,0,0,1)",
                }}
                whileTap={{ y: 0, boxShadow: "0px 0px 0px 0px rgba(0,0,0,1)" }}
              >
                <Bell className="h-5 w-5 text-black" />
                <span className="absolute right-1 top-1 h-2.5 w-2.5 border border-black bg-[#B6DFF]" />
              </motion.button>

              <div className="hidden md:block">
                <UserDropdown />
              </div>

              {/* Mobile Toggle */}
              <button
                className="md:hidden border-2 border-black p-2 active:bg-gray-100"
                onClick={toggleMobileMenu}
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden md:inline-block">
                <Button
                  variant="ghost"
                  className="font-mono font-bold hover:bg-[#B6DFF] hover:border-2 hover:border-black rounded-none h-10"
                >
                  SIGN IN
                </Button>
              </Link>
              <Link href="/register" className="hidden md:inline-block">
                <Button className="rounded-none border-2 border-black bg-black text-white hover:bg-white hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all font-mono font-bold h-10">
                  GET STARTED
                </Button>
              </Link>

              {/* Mobile Toggle for Non-Auth */}
              <button
                className="md:hidden border-2 border-black p-2 active:bg-gray-100"
                onClick={toggleMobileMenu}
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="border-t-2 border-black bg-white md:hidden overflow-hidden absolute w-full z-50 shadow-[0px_8px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="p-6 space-y-6">
              {isAuthenticated ? (
                // App Navigation for Mobile
                <div className="grid gap-4">
                  {/* User Info Section */}
                  <div className="flex items-center gap-4 pb-4 border-b-2 border-black border-dashed">
                    <div className="h-12 w-12 bg-[#FFDE59] border-2 border-black flex items-center justify-center font-mono font-bold text-xl">
                      {avatarLetter}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-mono font-bold text-sm uppercase truncate">
                        {user?.username}
                      </p>
                      <p className="font-mono text-xs text-gray-500 truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>

                  {appNavItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 p-3 border-2 border-black transition-all ${
                          active
                            ? "bg-[#FFDE59] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]"
                            : "bg-white hover:bg-gray-50"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-mono font-bold uppercase">
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}

                  {/* Sign Out Button */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 p-3 border-2 border-red-600 text-red-600 hover:bg-red-50 transition-all font-mono font-bold uppercase mt-2"
                  >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </button>
                </div>
              ) : (
                // Marketing Navigation for Mobile
                <div className="space-y-4">
                  {marketingNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block p-3 border-2 border-black bg-white hover:bg-[#B6DFF] font-mono font-bold uppercase text-center transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t-2 border-black border-dashed">
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button
                        variant="ghost"
                        className="w-full font-mono font-bold border-2 border-black h-12 rounded-none"
                      >
                        SIGN IN
                      </Button>
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button className="w-full font-mono font-bold border-2 border-black bg-black text-white h-12 rounded-none hover:bg-gray-800">
                        JOIN
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
