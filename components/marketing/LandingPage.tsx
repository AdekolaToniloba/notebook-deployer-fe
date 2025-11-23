// components/marketing/LandingPage.tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Upload,
  Settings,
  Rocket,
  CheckCircle2,
  Github,
  FileCode,
  Cloud,
  Zap,
  Shield,
  BarChart3,
} from "lucide-react";

/**
 * DESIGN PHILOSOPHY:
 * - Clean and minimal (like Kubeflow/Mercury)
 * - White backgrounds, simple borders
 * - Focus on functionality, not flashy marketing
 * - Technical audience (data scientists, developers)
 * - Let the product speak for itself
 */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* HERO SECTION - Clean and simple */}
      <section className="border-b bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Simple badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-sm border border-blue-200 rounded-full bg-blue-50 text-blue-700">
                <Zap className="h-3 w-3" />
                <span>Deploy to Google Cloud Run in minutes</span>
              </div>

              {/* Clean headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                Deploy Jupyter Notebooks
                <span className="block text-blue-600 mt-1">to the Cloud</span>
              </h1>

              {/* Simple description */}
              <p className="text-lg sm:text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
                Transform your notebooks into scalable cloud applications. No
                DevOps required.
              </p>

              {/* Simple CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="https://github.com/yourusername/notebookcloud">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto px-6 py-3 border-2"
                  >
                    <Github className="mr-2 h-4 w-4" />
                    View on GitHub
                  </Button>
                </Link>
              </div>

              {/* Trust line */}
              <div className="mt-8 text-sm text-slate-500">
                Free 14-day trial • No credit card required
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS - Clean numbered steps like Mercury */}
      <section className="border-b bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
                How it works
              </h2>
              <p className="text-lg text-slate-600">
                Deploy your notebooks in three simple steps
              </p>
            </div>

            {/* Steps grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white border border-slate-200 rounded-lg p-6"
                >
                  {/* Step number */}
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-lg flex items-center justify-center mb-4">
                    {index + 1}
                  </div>

                  {/* Icon */}
                  <div className="mb-4">
                    <step.icon className="h-8 w-8 text-blue-600" />
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-slate-600">{step.description}</p>

                  {/* Code example if available */}
                  {step.code && (
                    <pre className="mt-4 p-3 bg-slate-50 rounded border border-slate-200 text-sm overflow-x-auto">
                      <code className="text-slate-800">{step.code}</code>
                    </pre>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES - Clean grid like Kubeflow */}
      <section className="border-b bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
                Key Features
              </h2>
              <p className="text-lg text-slate-600">
                Everything you need to deploy and manage your notebooks
              </p>
            </div>

            {/* Features grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="border border-slate-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <feature.icon className="h-8 w-8 text-blue-600 mb-4" />
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* INTEGRATIONS - Show compatibility like Mercury */}
      <section className="border-b bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
              Works with your stack
            </h2>
            <p className="text-lg text-slate-600 mb-12">
              Compatible with all major Python data science libraries
            </p>

            {/* Integration logos/badges */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {integrations.map((integration) => (
                <div
                  key={integration}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700"
                >
                  {integration}
                </div>
              ))}
            </div>

            <p className="text-sm text-slate-500">
              + Basically every Python package
            </p>
          </div>
        </div>
      </section>

      {/* CTA SECTION - Simple and clear */}
      <section className="bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Ready to deploy your first notebook?
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              Get started with a free 14-day trial. No credit card required.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link href="/register">
                <Button
                  size="lg"
                  className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/docs">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto px-8 py-3 border-2"
                >
                  Read Documentation
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Steps data
const steps = [
  {
    icon: Upload,
    title: "Upload Notebook",
    description:
      "Upload your .ipynb file or connect your GitHub repository. We support all standard Jupyter notebooks.",
    code: null,
  },
  {
    icon: Settings,
    title: "Configure",
    description:
      "Set CPU, memory, and environment variables. Choose scaling options with sensible defaults.",
    code: null,
  },
  {
    icon: Rocket,
    title: "Deploy",
    description:
      "One-click deployment to Google Cloud Run. Monitor with real-time logs and metrics.",
    code: null,
  },
];

// Features data
const features = [
  {
    icon: Cloud,
    title: "Cloud Native",
    description:
      "Deploy to Google Cloud Run with automatic scaling and zero infrastructure management.",
  },
  {
    icon: Zap,
    title: "Fast Deployment",
    description:
      "From upload to production in under 2 minutes. No waiting, no complexity.",
  },
  {
    icon: FileCode,
    title: "No Code Changes",
    description:
      "Deploy your notebooks as-is. No need to refactor or rewrite your code.",
  },
  {
    icon: Shield,
    title: "Secure by Default",
    description:
      "Built-in authentication, encrypted storage, and role-based access control.",
  },
  {
    icon: BarChart3,
    title: "Real-time Metrics",
    description:
      "Monitor performance, track resource usage, and debug with comprehensive dashboards.",
  },
  {
    icon: Github,
    title: "Git Integration",
    description:
      "Connect to GitHub, GitLab, or Bitbucket for automatic deployments on push.",
  },
];

// Integrations
const integrations = [
  "Pandas",
  "NumPy",
  "Matplotlib",
  "Plotly",
  "Scikit-learn",
  "TensorFlow",
  "PyTorch",
  "Seaborn",
  "SciPy",
  "Keras",
];
