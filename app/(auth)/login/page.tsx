"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { LoginForm } from "@/components/auth/login-form";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 -right-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-1/4 -left-1/4 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="rounded-lg border border-border bg-background-secondary/50 p-8 backdrop-blur-sm">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground mb-8 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>

            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome Back
            </h1>
            <p className="text-foreground-muted mb-8">
              Sign in to your account to continue deploying notebooks.
            </p>

            <LoginForm />

            <div className="mt-8 border-t border-border pt-8 text-center">
              <p className="text-foreground-muted mb-4">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="text-primary hover:text-primary-dark transition-colors font-medium"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
