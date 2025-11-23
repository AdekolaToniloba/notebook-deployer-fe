"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/hooks/use-auth";
import { loginSchema, type LoginInput } from "@/lib/validations/auth.schemas";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { ZodError } from "zod";

// ... (Keep animation variants the same)
const containerVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.1, duration: 0.4 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
};

export function LoginForm() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuth();

  const [formData, setFormData] = useState<LoginInput>({
    username: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof LoginInput, string>>
  >({});
  const [showPassword, setShowPassword] = useState(false); // <--- NEW STATE

  // ... (Keep handlers the same)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    if (error) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    try {
      const validated = loginSchema.parse(formData);
      await login(validated);
      router.push("/dashboard");
    } catch (err: unknown) {
      if (err instanceof ZodError) {
        const errors: Record<string, string> = {};
        err.issues.forEach((issue) => {
          errors[issue.path[0] as string] = issue.message;
        });
        setFieldErrors(errors);
      }
    }
  };

  return (
    <motion.form
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      onSubmit={handleSubmit}
      className="space-y-6 w-full max-w-sm"
    >
      {/* ... Global Error Toast ... */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 bg-red-50 border-l-4 border-red-500 p-4 text-sm text-red-700 shadow-sm">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Username Field (Unchanged) */}
      <motion.div variants={itemVariants} className="space-y-2">
        <label className="text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
          Username
        </label>
        <div className="relative group">
          <input
            name="username"
            type="text"
            value={formData.username}
            onChange={handleChange}
            disabled={isLoading}
            className={`
              w-full bg-gray-50 border-2 px-4 py-3 text-gray-900 outline-none transition-all
              focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
              disabled:opacity-50
              ${
                fieldErrors.username
                  ? "border-red-500"
                  : "border-black focus:border-black"
              }
            `}
            placeholder="jdoe"
          />
          {fieldErrors.username && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute right-3 top-3.5 text-red-500 text-xs font-bold"
            >
              REQUIRED
            </motion.span>
          )}
        </div>
      </motion.div>

      {/* Password Field (Updated with Eye Icon) */}
      <motion.div variants={itemVariants} className="space-y-2">
        <div className="flex justify-between items-baseline">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
            Password
          </label>
        </div>
        <div className="relative group">
          <input
            name="password"
            type={showPassword ? "text" : "password"} // <--- TOGGLE TYPE
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
            className={`
              w-full bg-gray-50 border-2 px-4 py-3 text-gray-900 outline-none transition-all
              focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
              disabled:opacity-50 pr-12
              ${
                fieldErrors.password
                  ? "border-red-500"
                  : "border-black focus:border-black"
              }
            `}
            placeholder="••••••••"
          />

          {/* Eye Button */}
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {fieldErrors.password && (
          <p className="text-xs text-red-500 font-medium mt-1">
            {fieldErrors.password}
          </p>
        )}
      </motion.div>

      {/* Submit Button (Unchanged) */}
      <motion.div variants={itemVariants} className="pt-2">
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-black text-white hover:bg-gray-800 rounded-none font-mono font-bold text-base border-2 border-transparent active:scale-[0.98] transition-all relative overflow-hidden group"
        >
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>AUTHENTICATING...</span>
            </motion.div>
          ) : (
            <span className="flex items-center justify-center gap-2">
              SIGN IN{" "}
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </span>
          )}
        </Button>
      </motion.div>
    </motion.form>
  );
}
