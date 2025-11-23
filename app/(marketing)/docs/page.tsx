"use client";

import { useState } from "react";
import { Search, Terminal, BookOpen } from "lucide-react";

interface DocItem {
  id: string;
  title: string;
  content: string;
}

interface DocSection {
  id: string;
  title: string;
  items: DocItem[];
}

const sections: DocSection[] = [
  {
    id: "intro",
    title: "Introduction",
    items: [
      {
        id: "quick-start",
        title: "Quick Start",
        content: "Get up and running in 5 minutes.",
      },
      {
        id: "architecture",
        title: "Architecture",
        content: "How NotebookDeploy works under the hood.",
      },
    ],
  },
  {
    id: "guides",
    title: "Guides",
    items: [
      {
        id: "first-deploy",
        title: "Your First Deploy",
        content: "Deploying your first .ipynb file.",
      },
      {
        id: "env-vars",
        title: "Environment Variables",
        content: "Managing secrets and config.",
      },
    ],
  },
  {
    id: "api",
    title: "API Reference",
    items: [
      {
        id: "rest-api",
        title: "REST API",
        content: "Programmatic access to deployment.",
      },
      {
        id: "cli",
        title: "CLI Tool",
        content: "Command line interface documentation.",
      },
    ],
  },
];

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDoc, setActiveDoc] = useState("quick-start");

  return (
    <div className="min-h-screen bg-white font-mono">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12 border-b-2 border-black pb-8">
          <h1 className="text-6xl font-black uppercase mb-4">Documentation</h1>
          <div className="relative max-w-xl">
            <input
              type="text"
              placeholder="SEARCH DOCS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 border-2 border-black px-4 pl-12 font-bold focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow bg-gray-50"
            />
            <Search className="absolute left-4 top-3.5 h-5 w-5" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
              {sections.map((section) => (
                <div key={section.id} className="mb-6 last:mb-0">
                  <h3 className="font-black uppercase mb-3 text-sm bg-black text-white inline-block px-2 py-1">
                    {section.title}
                  </h3>
                  <ul className="space-y-2">
                    {section.items.map((item) => (
                      <li key={item.id}>
                        <button
                          onClick={() => setActiveDoc(item.id)}
                          className={`text-sm font-bold hover:underline decoration-2 underline-offset-2 text-left w-full ${
                            activeDoc === item.id
                              ? "text-blue-600"
                              : "text-gray-600"
                          }`}
                        >
                          {item.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="border-2 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white min-h-[600px]">
              <div className="flex items-center gap-3 mb-6">
                <Terminal className="h-8 w-8" />
                <h2 className="text-3xl font-black uppercase">Quick Start</h2>
              </div>

              <div className="prose prose-neutral max-w-none font-mono">
                <p className="font-bold mb-4">
                  Welcome to the NotebookDeploy documentation.
                </p>

                <div className="bg-gray-100 p-4 border-2 border-black mb-6">
                  <code className="text-sm font-bold">
                    $ npm install -g notebookdeploy-cli
                    <br />
                    $ notebookdeploy login
                    <br />$ notebookdeploy deploy my-notebook.ipynb
                  </code>
                </div>

                <h3 className="text-xl font-bold uppercase mb-4 border-b-2 border-black inline-block">
                  Prerequisites
                </h3>
                <ul className="list-disc pl-5 space-y-2 mb-6">
                  <li>Node.js 18+ installed</li>
                  <li>A Google Cloud Platform account</li>
                  <li>Docker installed (optional, for local testing)</li>
                </ul>

                <div className="bg-[#B6DFF] p-4 border-2 border-black flex gap-4 items-start">
                  <BookOpen className="h-6 w-6 shrink-0" />
                  <div>
                    <p className="font-bold">Pro Tip:</p>
                    <p className="text-sm">
                      Use our VS Code extension for direct deployment from your
                      editor.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
