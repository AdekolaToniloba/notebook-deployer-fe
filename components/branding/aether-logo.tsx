"use client";

import { motion, useAnimation } from "framer-motion";
import { useState, useEffect } from "react";

interface AetherLogoProps {
  variant?: "wild" | "static" | "minimal";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function AetherLogo({
  variant = "wild",
  size = "md",
  className = "",
}: AetherLogoProps) {
  const controls = useAnimation();
  const [isHovered, setIsHovered] = useState(false);

  // Size mapping
  const sizeClasses = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-5xl",
    xl: "text-7xl md:text-9xl",
  };

  // Wild animation loop
  useEffect(() => {
    if (variant === "wild") {
      const interval = setInterval(() => {
        controls.start({
          textShadow: [
            "2px 2px 0px #000",
            "-2px -2px 0px #FF0000",
            "2px -2px 0px #00FF00",
            "-2px 2px 0px #0000FF",
            "4px 4px 0px #000",
          ],
          transition: { duration: 0.2, times: [0, 0.25, 0.5, 0.75, 1] },
        });
      }, 3000); // Glitch every 3 seconds
      return () => clearInterval(interval);
    }
  }, [controls, variant]);

  const letterVariants = {
    hover: {
      y: [0, -5, 0],
      rotate: [0, 5, -5, 0],
      scale: [1, 1.2, 1],
      transition: { duration: 0.4 },
    },
  };

  const containerVariants = {
    hover: {
      scale: 1.05,
      transition: { staggerChildren: 0.05 },
    },
  };

  if (variant === "minimal") {
    return (
      <div
        className={`font-black uppercase tracking-tighter ${sizeClasses[size]} ${className}`}
      >
        Aether
      </div>
    );
  }

  return (
    <motion.div
      className={`relative inline-block font-black uppercase tracking-tighter cursor-pointer select-none ${sizeClasses[size]} ${className}`}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      animate={controls}
      variants={containerVariants}
      whileHover="hover"
    >
      {/* Background Block for Brutalist Depth */}
      <motion.div
        className="absolute inset-0 bg-[#B6DFFF] -z-10"
        initial={{ x: 4, y: 4 }}
        animate={isHovered ? { x: 8, y: 8 } : { x: 4, y: 4 }}
        transition={{ type: "spring", stiffness: 300 }}
      />

      {/* Border Frame */}
      <motion.div
        className="absolute inset-0 border-2 border-black -z-10"
        initial={{ x: 0, y: 0 }}
      />

      {/* Letters */}
      <div className="relative z-10 flex px-2 bg-white border-2 border-black">
        {["A", "E", "T", "H", "E", "R"].map((char, i) => (
          <motion.span
            key={i}
            variants={letterVariants}
            className={`inline-block ${
              i === 0 ? "text-[#FF4D4D]" : "text-black"
            }`}
            style={{
              display: "inline-block",
              textShadow: isHovered ? "none" : "2px 2px 0px rgba(0,0,0,0.1)",
            }}
          >
            {char}
          </motion.span>
        ))}
      </div>

      {/* Decorative Glitch Elements (Only Wild) */}
      {variant === "wild" && (
        <>
          <motion.div
            className="absolute -top-2 -right-2 w-2 h-2 bg-black"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 4 }}
          />
          <motion.div
            className="absolute bottom-0 left-0 w-full h-[2px] bg-black"
            animate={{ scaleX: [1, 0, 1] }}
            transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 2.5 }}
          />
        </>
      )}
    </motion.div>
  );
}
