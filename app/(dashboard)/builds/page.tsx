"use client";

import { motion, type Variants } from "framer-motion";
import { Construction, ArrowRight, Mail } from "lucide-react";
import Link from "next/link";

// FIX: Added explicit type annotation
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

// FIX: Added explicit type annotation
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function BuildsPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden relative">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          className="absolute -top-20 -right-20 w-64 h-64 md:w-96 md:h-96 border-4 border-dashed border-gray-200 rounded-full opacity-50"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-20 -left-20 w-48 h-48 md:w-80 md:h-80 border-4 border-black rounded-full opacity-5"
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-2xl w-full text-center"
      >
        {/* Icon Animation */}
        <motion.div
          variants={itemVariants}
          className="mb-8 flex justify-center"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-[#FFDE59] translate-x-2 translate-y-2 border-2 border-black" />
            <div className="relative bg-white border-2 border-black p-6 md:p-8">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                  ease: "easeInOut",
                }}
              >
                <Construction className="w-16 h-16 md:w-20 md:h-20 text-black" />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Main Text */}
        <motion.h1
          variants={itemVariants}
          className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4"
        >
          Builds System
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-black to-gray-500">
            Under Construction
          </span>
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="text-sm md:text-lg font-mono font-bold text-gray-500 mb-8 md:mb-12 max-w-lg mx-auto leading-relaxed"
        >
          {/* FIX: Escaped single quote */}
          We&apos;re hammering out the final details for our advanced build
          pipeline visualization. Expect real-time logs, detailed metrics, and
          more.
        </motion.p>

        {/* Progress Bar Visual */}
        <motion.div
          variants={itemVariants}
          className="w-full max-w-md mx-auto h-4 border-2 border-black bg-white mb-12 relative overflow-hidden"
        >
          <motion.div
            className="absolute top-0 left-0 h-full bg-[#FFDE59]"
            initial={{ width: "0%" }}
            animate={{ width: "75%" }}
            transition={{ duration: 1.5, ease: "easeInOut", delay: 0.5 }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-[1px] bg-transparent" /> {/* Spacer */}
          </div>
          {/* Striped overlay */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(45deg, #000 25%, transparent 25%, transparent 50%, #000 50%, #000 75%, transparent 75%, transparent)",
              backgroundSize: "20px 20px",
            }}
          />
        </motion.div>

        {/* Actions */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/dashboard" className="w-full sm:w-auto">
            <div className="group relative w-full sm:w-auto">
              <div className="absolute inset-0 translate-x-1 translate-y-1 bg-black transition-transform group-hover:translate-x-2 group-hover:translate-y-2" />
              <div className="relative border-2 border-black bg-white px-8 py-3 font-mono font-bold text-sm uppercase hover:-translate-y-1 transition-transform flex items-center justify-center gap-2">
                <ArrowRight className="w-4 h-4 rotate-180" /> Back to Dashboard
              </div>
            </div>
          </Link>

          <a href="mailto:support@codematics.ai" className="w-full sm:w-auto">
            <div className="group relative w-full sm:w-auto">
              <div className="absolute inset-0 translate-x-1 translate-y-1 bg-[#B6DFFF] transition-transform group-hover:translate-x-2 group-hover:translate-y-2" />
              <div className="relative border-2 border-black bg-white px-8 py-3 font-mono font-bold text-sm uppercase hover:-translate-y-1 transition-transform flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" /> Notify Me
              </div>
            </div>
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
}
