"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  registerSchema,
  type RegisterInput,
} from "@/lib/validations/auth.schemas";
import {
  calculatePasswordStrength,
  getPasswordStrengthLabel, // <--- Used now!
  getPasswordStrengthColor,
} from "@/lib/utils/password";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { ZodError } from "zod";

// ... (Keep variants)
const containerVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.05, duration: 0.4 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
};

export function RegisterForm() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuth();

  const [formData, setFormData] = useState<RegisterInput>({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof RegisterInput, string>>
  >({});

  const [showPassword, setShowPassword] = useState(false); // <--- NEW STATE

  const strength = calculatePasswordStrength(formData.password);

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
      const validated = registerSchema.parse(formData);
      await register(validated);
      router.push("/dashboard");
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const errors: Partial<Record<keyof RegisterInput, string>> = {};
        error.issues.forEach((issue) => {
          const field = issue.path[0] as keyof RegisterInput;
          errors[field] = issue.message;
        });
        setFieldErrors(errors);
      }
    }
  };

  const inputClasses = (hasError: boolean) => `
    w-full bg-gray-50 border-2 px-4 py-3 text-gray-900 outline-none transition-all
    focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
    disabled:opacity-50 pr-12
    ${hasError ? "border-red-500" : "border-black focus:border-black"}
  `;

  return (
    <motion.form
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      onSubmit={handleSubmit}
      className="space-y-5 w-full max-w-sm"
    >
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

      {/* Email Field */}
      <motion.div variants={itemVariants} className="space-y-1">
        <label className="text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
          Email Address
        </label>
        <div className="relative">
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            disabled={isLoading}
            className={inputClasses(!!fieldErrors.email)}
            placeholder="you@example.com"
          />
        </div>
        {fieldErrors.email && (
          <p className="text-xs text-red-500 font-medium mt-1">
            {fieldErrors.email}
          </p>
        )}
      </motion.div>

      {/* Username Field */}
      <motion.div variants={itemVariants} className="space-y-1">
        <label className="text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
          Username
        </label>
        <div className="relative">
          <input
            name="username"
            type="text"
            value={formData.username}
            onChange={handleChange}
            disabled={isLoading}
            className={inputClasses(!!fieldErrors.username)}
            placeholder="jdoe"
          />
        </div>
        {fieldErrors.username && (
          <p className="text-xs text-red-500 font-medium mt-1">
            {fieldErrors.username}
          </p>
        )}
      </motion.div>

      {/* Password Field */}
      <motion.div variants={itemVariants} className="space-y-1">
        <label className="text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
          Password
        </label>
        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"} // <--- Toggle
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
            className={inputClasses(!!fieldErrors.password)}
            placeholder="••••••••"
          />
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

        {/* Password Strength Bar */}
        {formData.password && (
          <div className="mt-2">
            <div className="flex gap-1 h-1 mb-1">
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  className={`flex-1 ${
                    i < strength
                      ? getPasswordStrengthColor(strength)
                      : "bg-gray-200"
                  }`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: i * 0.05 }}
                />
              ))}
            </div>
            {/* Used Label Here */}
            <p className="text-xs font-mono text-gray-500 text-right">
              STRENGTH: {getPasswordStrengthLabel(strength).toUpperCase()}
            </p>
          </div>
        )}
        {fieldErrors.password && (
          <p className="text-xs text-red-500 font-medium mt-1">
            {fieldErrors.password}
          </p>
        )}
      </motion.div>

      {/* Confirm Password Field */}
      <motion.div variants={itemVariants} className="space-y-1">
        <label className="text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
          Confirm Password
        </label>
        <div className="relative">
          <input
            name="confirmPassword"
            type={showPassword ? "text" : "password"} // <--- Toggle
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={isLoading}
            className={inputClasses(!!fieldErrors.confirmPassword)}
            placeholder="••••••••"
          />
        </div>

        {formData.confirmPassword && !fieldErrors.confirmPassword && (
          <div className="flex items-center gap-2 mt-1">
            {formData.password === formData.confirmPassword ? (
              <span className="text-xs text-green-600 flex items-center gap-1 font-bold">
                <CheckCircle2 className="h-3 w-3" /> MATCH
              </span>
            ) : (
              <span className="text-xs text-red-500 flex items-center gap-1 font-bold">
                <AlertTriangle className="h-3 w-3" /> MISMATCH
              </span>
            )}
          </div>
        )}

        {fieldErrors.confirmPassword && (
          <p className="text-xs text-red-500 font-medium mt-1">
            {fieldErrors.confirmPassword}
          </p>
        )}
      </motion.div>

      <motion.div variants={itemVariants} className="pt-4">
        <Button
          type="submit"
          disabled={isLoading || strength < 2}
          className="w-full h-12 bg-black text-white hover:bg-gray-800 rounded-none font-mono font-bold text-base border-2 border-transparent active:scale-[0.98] transition-all relative overflow-hidden group"
        >
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>CREATING ACCOUNT...</span>
            </motion.div>
          ) : (
            <span className="flex items-center justify-center gap-2">
              CREATE ACCOUNT{" "}
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </span>
          )}
        </Button>
      </motion.div>
    </motion.form>
  );
}
