"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Terminal,
  BookOpen,
  Rocket,
  Github,
  Zap,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

// --- Types ---
interface DocItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface DocSection {
  id: string;
  title: string;
  items: DocItem[];
}

// --- Content Data ---
const sections: DocSection[] = [
  {
    id: "intro",
    title: "Introduction",
    items: [
      {
        id: "quick-start",
        title: "Quick Start",
        content: (
          <div className="space-y-6">
            <p className="text-lg font-medium">
              Welcome to <span className="font-black">NotebookDeploy</span>. We
              turn your Jupyter Notebooks into production-ready APIs in seconds.
              No Dockerfiles, no Kubernetes headaches. Just code.
            </p>
            <div className="bg-black text-white p-6 border-2 border-gray-800 shadow-[4px_4px_0px_0px_rgba(200,200,200,1)]">
              <h4 className="font-bold mb-2 flex items-center gap-2 text-[#FFDE59]">
                <Zap className="h-4 w-4" /> The 3-Step Flow
              </h4>
              <ol className="list-decimal list-inside space-y-2 font-mono text-sm">
                <li>
                  Upload your <span className="text-[#B6DFFF]">.ipynb</span>{" "}
                  file.
                </li>
                <li>Configure resources (CPU/RAM).</li>
                <li>
                  Click <span className="text-[#FFDE59]">DEPLOY</span>.
                </li>
              </ol>
            </div>
          </div>
        ),
      },
      {
        id: "architecture",
        title: "Architecture",
        content: (
          <div className="space-y-4">
            <p>
              NotebookDeploy parses your notebook, extracts imports and logic,
              builds a optimized Docker container, and deploys it to a scalable
              serverless environment.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              {["Parser", "Builder", "Runner"].map((step, i) => (
                <div
                  key={step}
                  className="border-2 border-black p-4 bg-white relative"
                >
                  <div className="absolute -top-3 -left-3 bg-black text-white w-6 h-6 flex items-center justify-center font-mono text-xs font-bold">
                    {i + 1}
                  </div>
                  <h5 className="font-black uppercase">{step}</h5>
                </div>
              ))}
            </div>
          </div>
        ),
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
        content: (
          <div className="space-y-6">
            <p>
              Deploying is simple. Navigate to the <strong>Dashboard</strong>{" "}
              and click &quot;New Deployment&quot;.
            </p>

            <div className="border-l-4 border-[#FFDE59] pl-4 bg-yellow-50 p-4">
              <h5 className="font-bold flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4" /> Pre-flight Check
              </h5>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Ensure your notebook runs locally.</li>
                <li>Put all imports in the first cell.</li>
                <li>
                  Define a{" "}
                  <code className="bg-gray-200 px-1">
                    handler(event, context)
                  </code>{" "}
                  function if creating an API.
                </li>
              </ul>
            </div>
          </div>
        ),
      },
      {
        id: "github-integration",
        title: "GitHub Integration",
        content: (
          <div className="space-y-4">
            <p>
              Enable continuous deployment (CI/CD) by connecting your GitHub
              account.
            </p>
            <div className="bg-gray-900 text-green-400 p-4 font-mono text-sm border-2 border-black">
              <div className="flex items-center gap-2 mb-2 border-b border-gray-700 pb-2">
                <Github className="h-4 w-4" />
                <span>Git Workflow</span>
              </div>
              <p>{">"} Push changes to &apos;main&apos; branch</p>
              <p>{">"} Webhook triggers build</p>
              <p>{">"} Auto-deploy to production</p>
            </div>
            <p className="text-sm text-gray-600">
              Go to <strong>Settings</strong> to link your account.
            </p>
          </div>
        ),
      },
      {
        id: "env-vars",
        title: "Environment Variables",
        content: (
          <div className="space-y-4">
            <p>Manage secrets like API keys securely.</p>
            <div className="bg-[#B6DFFF] p-4 border-2 border-black">
              <p className="font-bold">Usage in Python:</p>
              <code className="block mt-2 bg-white p-2 border border-black text-sm">
                import os
                <br />
                api_key = os.environ.get(&quot;MY_API_KEY&quot;)
              </code>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: "api",
    title: "Reference",
    items: [
      {
        id: "rest-api",
        title: "REST API",
        content: (
          <div className="space-y-4">
            <p>Automate deployments programmatically.</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between border-2 border-black p-2 bg-gray-50">
                <code className="font-bold">POST /api/v1/deployments</code>
                <span className="bg-green-200 px-2 py-0.5 text-xs font-bold border border-black">
                  CREATE
                </span>
              </div>
              <div className="flex items-center justify-between border-2 border-black p-2 bg-gray-50">
                <code className="font-bold">GET /api/v1/deployments</code>
                <span className="bg-blue-200 px-2 py-0.5 text-xs font-bold border border-black">
                  LIST
                </span>
              </div>
            </div>
          </div>
        ),
      },
    ],
  },
];

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDoc, setActiveDoc] = useState("quick-start");

  // Filter items based on search
  const filteredSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.content
            ?.toString()
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((section) => section.items.length > 0);

  const activeItem = sections
    .flatMap((s) => s.items)
    .find((i) => i.id === activeDoc);

  return (
    <div className="min-h-screen bg-white font-mono">
      <div className="max-w-7xl mx-auto px-4 py-12 md:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 border-b-2 border-black pb-8"
        >
          <h1 className="text-4xl md:text-6xl font-black uppercase mb-4 flex items-center gap-4">
            <Terminal className="h-10 w-10 md:h-16 md:w-16" />
            Documentation
          </h1>
          <div className="relative max-w-xl">
            <input
              type="text"
              placeholder="SEARCH DOCS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 border-2 border-black px-4 pl-12 font-bold focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow bg-gray-50 placeholder:text-gray-400"
            />
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-500" />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white max-h-[calc(100vh-8rem)] overflow-y-auto">
              {filteredSections.length === 0 ? (
                <p className="text-gray-500 italic text-sm">
                  No results found.
                </p>
              ) : (
                filteredSections.map((section) => (
                  <div key={section.id} className="mb-6 last:mb-0">
                    <h3 className="font-black uppercase mb-3 text-xs bg-black text-white inline-block px-2 py-1 tracking-wider">
                      {section.title}
                    </h3>
                    <ul className="space-y-1">
                      {section.items.map((item) => (
                        <li key={item.id}>
                          <button
                            onClick={() => setActiveDoc(item.id)}
                            className={`text-sm font-bold hover:underline decoration-2 underline-offset-4 text-left w-full px-2 py-1 transition-colors ${
                              activeDoc === item.id
                                ? "bg-[#FFDE59] border-2 border-black translate-x-1"
                                : "text-gray-600 hover:text-black"
                            }`}
                          >
                            {item.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <motion.div
              key={activeDoc}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="border-2 border-black p-6 md:p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white min-h-[600px]"
            >
              {activeItem ? (
                <>
                  <div className="flex items-center gap-3 mb-8 border-b-2 border-black pb-4">
                    <div className="p-2 bg-[#FFDE59] border-2 border-black">
                      <Rocket className="h-6 w-6" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black uppercase break-words">
                      {activeItem.title}
                    </h2>
                  </div>

                  <div className="prose prose-neutral max-w-none font-mono prose-h3:font-black prose-h3:uppercase prose-code:before:content-none prose-code:after:content-none">
                    {activeItem.content}
                  </div>

                  {/* Navigation Footer (Mock) */}
                  <div className="mt-12 pt-8 border-t-2 border-dashed border-gray-300 flex justify-between">
                    <button
                      className="text-sm font-bold text-gray-400 hover:text-black flex items-center gap-2 group"
                      disabled
                    >
                      <ArrowRight className="h-4 w-4 rotate-180" /> Previous
                    </button>
                    <button className="text-sm font-bold text-black hover:underline flex items-center gap-2">
                      Next Topic <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <AlertTriangle className="h-12 w-12 mb-4" />
                  <p className="font-bold">Document not found.</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
