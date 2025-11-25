"use client";

import Link from "next/link";
import { motion, useTime, useTransform } from "framer-motion";
import { AetherLogo } from "@/components/branding/aether-logo";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  const time = useTime();
  const rotate = useTransform(time, [0, 4000], [0, 360], { clamp: false });

  return (
    <main className="min-h-screen flex items-center justify-center bg-black font-mono relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-20"
        style={{ backgroundImage: "url('/noise.svg')" }}
      />

      <motion.div
        className="relative z-10 text-center flex flex-col items-center p-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative mb-8">
          <motion.div
            style={{ rotate }}
            className="absolute -inset-4 border-4 border-dashed border-red-500 rounded-full"
          />
          <AetherLogo variant="wild" size="lg" />
        </div>

        <h1
          className="text-8xl font-black uppercase text-white"
          style={{ textShadow: "-4px 4px 0px #FF0000" }}
        >
          404
        </h1>
        <p className="text-xl font-bold text-gray-300 mt-2 mb-8 uppercase tracking-widest">
          Signal Lost In The Void
        </p>

        <Link href="/dashboard">
          <motion.button
            className="h-14 px-8 rounded-none border-4 border-white bg-white text-black font-mono font-bold text-lg hover:shadow-[8px_8px_0px_0px_#FFDE59] transition-all flex items-center gap-3"
            whileHover={{ y: -2 }}
          >
            <ArrowLeft className="h-5 w-5" /> GO HOME
          </motion.button>
        </Link>
      </motion.div>
    </main>
  );
}
