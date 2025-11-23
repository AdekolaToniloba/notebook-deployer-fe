"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Download, Github, Terminal, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notebookService } from "@/lib/api/services/notebooks.service";
import Link from "next/link";
import type { NotebookDetailResponse } from "@/lib/validations/notebook.schemas";
import { ModelManager } from "@/components/features/notebooks/ModelManager";
import { PushToGithubModal } from "@/components/features/github/PushToGithubModal";
import { useAuthStore } from "@/store/auth-store";

export default function NotebookDetailPage() {
  const { id } = useParams();
  const notebookId = Number(id);

  const isGithubConnected = useAuthStore((state) => state.isGithubConnected);

  const deploymentId = 123;
  // Strict type
  const [notebook, setNotebook] = useState<NotebookDetailResponse | null>(null);

  useEffect(() => {
    if (notebookId) {
      notebookService.getNotebook(notebookId).then(setNotebook);
    }
  }, [notebookId]);

  const handleDownload = async () => {
    // The service returns a FileContentResponse (string) directly if using validation,
    // or we can adjust the service to return Blob.
    // Assuming it returns the string content:
    const response = await notebookService.downloadMainPy(notebookId);

    // Fixed: 'content' property error. The Zod schema 'fileContentResponseSchema' is just z.string().
    // So 'response' IS the string content.
    const fileContent = response;

    const blob = new Blob([fileContent], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "main.py";
    a.click();
  };

  if (!notebook) return <div className="p-8 font-mono">Loading...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link
        href="/notebooks"
        className="inline-flex items-center font-mono font-bold text-sm mb-6 hover:underline"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> BACK TO LIST
      </Link>

      <div className="border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8">
        {/* ... (Rest of UI code same as previous turn, just removed 'motion' if not used) ... */}
        <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-6">
          <div>
            <h1 className="font-mono text-3xl font-black uppercase">
              {notebook.name}
            </h1>
            <p className="font-mono text-sm text-gray-500 mt-1">
              ID: {notebook.id} • Created{" "}
              {new Date(notebook.created_at).toLocaleDateString()}
            </p>
          </div>
          <div
            className={`px-4 py-2 border-2 border-black font-mono font-bold text-sm uppercase ${
              notebook.status === "ready" ? "bg-green-400" : "bg-yellow-400"
            }`}
          >
            {notebook.status}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <h3 className="font-mono font-bold uppercase border-b-2 border-black inline-block mb-2">
              Actions
            </h3>
            <Button
              onClick={handleDownload}
              className="w-full justify-start border-2 border-black bg-white text-black hover:bg-[#B6DFF] rounded-none font-mono font-bold"
            >
              <Download className="mr-2 h-4 w-4" /> DOWNLOAD CODE
            </Button>
            {/* GITHUB INTEGRATION BUTTON */}
            {isGithubConnected ? (
              <PushToGithubModal
                notebookId={notebookId}
                notebookName={notebook?.name || "notebook"}
              />
            ) : (
              <Link href="/settings">
                <Button className="w-full justify-start border-2 border-black bg-white text-black hover:bg-gray-100 rounded-none font-mono font-bold">
                  <Github className="mr-2 h-4 w-4" /> CONNECT GITHUB FIRST
                </Button>
              </Link>
            )}
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="bg-[#1a1a1a] p-4 border-2 border-black text-green-400 font-mono text-sm h-64 overflow-y-auto shadow-inner">
              <div className="flex items-center gap-2 border-b border-gray-700 pb-2 mb-2">
                <Terminal className="h-4 w-4" />
                <span className="font-bold">LATEST LOGS</span>
              </div>
              <p>{">"} System initialized</p>
              <p>{">"} Dependencies checked: OK</p>
              <p>{">"} Ready for deployment...</p>
            </div>
          </div>
        </div>
      </div>

      {/* New Model Management Section */}
      <ModelManager notebookId={notebookId} deploymentId={deploymentId} />
    </div>
  );
}
