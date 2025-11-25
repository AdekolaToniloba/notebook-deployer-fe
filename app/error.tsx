"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FF4D4D] font-mono p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative max-w-xl w-full border-4 border-black bg-white p-8 text-center shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
      >
        <div className="absolute -top-6 -left-6 bg-yellow-400 border-4 border-black p-3 animate-pulse">
          <AlertTriangle className="h-8 w-8 text-black" />
        </div>

        <h1 className="text-5xl font-black uppercase tracking-tighter text-black mt-8">
          System Malfunction
        </h1>
        <p className="text-lg font-bold text-red-600 mt-2 mb-6">
          An unexpected error occurred in the Aether Core.
        </p>

        <div className="bg-gray-100 border-2 border-black p-4 text-left text-xs text-red-700 font-bold overflow-auto max-h-32">
          <p>Error: {error.message}</p>
          {error.digest && <p>Digest: {error.digest}</p>}
        </div>

        <Button
          onClick={() => reset()}
          className="mt-8 h-14 w-full md:w-auto px-10 rounded-none border-4 border-black bg-black text-white font-bold text-lg uppercase hover:bg-white hover:text-black transition-colors"
        >
          <RefreshCw className="mr-3 h-5 w-5" />
          Attempt Reboot
        </Button>
      </motion.div>
    </div>
  );
}
