"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FileCode, Trash2, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notebookService } from "@/lib/api/services/notebooks.service";
import { handleError } from "@/lib/error-utils";
import type { NotebookListItem } from "@/lib/validations/notebook.schemas";

export default function NotebooksPage() {
  const [notebooks, setNotebooks] = useState<NotebookListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotebooks = async () => {
    try {
      const res = await notebookService.listNotebooks();
      // Cast here is safe because Zod validated the structure,
      // but TypeScript's static analysis of the Zod schema might be too strict or slightly off
      // if we used .or(z.string())
      setNotebooks(res as unknown as NotebookListItem[]);
    } catch (err) {
      handleError(err, "Failed to load notebooks");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotebooks();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure? This action cannot be undone.")) return;
    try {
      await notebookService.deleteNotebook(id);
      setNotebooks((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      handleError(err, "Failed to delete notebook");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end border-b-2 border-black pb-6 mb-8">
        <div>
          <h1 className="font-mono text-4xl font-black uppercase">Notebooks</h1>
          <p className="font-mono text-gray-500 mt-2">
            Manage and deploy your code.
          </p>
        </div>
        <Link href="/deploy">
          <Button className="bg-[#FFDE59] text-black border-2 border-black hover:bg-[#ffe580] font-mono font-bold rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all">
            <Plus className="mr-2 h-5 w-5" /> NEW UPLOAD
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin h-10 w-10" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {notebooks.map((nb) => (
              <motion.div
                key={nb.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                layout
                className="border-2 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-[#B6DFF] border-2 border-black">
                    <FileCode className="h-6 w-6" />
                  </div>
                  <button
                    onClick={() => handleDelete(nb.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>

                <h3
                  className="font-mono font-bold text-lg truncate mb-1"
                  title={nb.name}
                >
                  {nb.name}
                </h3>
                <p className="font-mono text-xs text-gray-500 mb-6">
                  Created {new Date(nb.created_at).toLocaleDateString()}
                </p>

                <div className="flex gap-2">
                  <Link href={`/notebooks/${nb.id}`} className="flex-1">
                    <Button className="w-full border-2 border-black bg-black text-white hover:bg-gray-800 rounded-none font-mono font-bold text-xs">
                      DETAILS
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {!isLoading && notebooks.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed border-black bg-gray-50">
          <p className="font-mono font-bold text-gray-500">
            No notebooks found. Upload one to get started.
          </p>
        </div>
      )}
    </div>
  );
}
