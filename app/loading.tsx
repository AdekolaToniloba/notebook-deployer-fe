"use client";

import { motion, type Variants } from "framer-motion";
import { AetherLogo } from "@/components/branding/aether-logo";

export default function Loading() {
  const containerVariants: Variants = {
    start: {
      transition: {
        staggerChildren: 0.1,
      },
    },
    end: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const textVariants: Variants = {
    start: { y: "100%", opacity: 0 },
    end: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut", // FIX: use a valid easing preset
      },
    },
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#FFDE59] font-mono">
      <AetherLogo variant="minimal" size="lg" className="mb-8" />

      <motion.div
        variants={containerVariants}
        initial="start"
        animate="end"
        className="flex items-center gap-2 text-xl font-bold uppercase overflow-hidden"
      >
        <motion.span variants={textVariants}>INITIALIZING</motion.span>
        <motion.span variants={textVariants}>AETHER</motion.span>
        <motion.span variants={textVariants}>CORE</motion.span>
      </motion.div>

      <div className="absolute bottom-8 w-1/2 md:w-1/4 h-2 border-2 border-black bg-white overflow-hidden">
        <motion.div
          className="h-full bg-black"
          initial={{ scaleX: 0, originX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
      </div>
    </div>
  );
}
