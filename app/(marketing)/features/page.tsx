"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  GitBranch,
  BarChart3,
  Lock,
  Zap,
  Globe,
} from "lucide-react";

const featuresList = [
  {
    icon: Zap,
    title: "One-Click Deployment",
    description: "Push to Google Cloud Run instantly. No config required.",
    color: "bg-[#FFDE59]",
  },
  {
    icon: GitBranch,
    title: "Git Integration",
    description: "Auto-sync with GitHub. Push to main = Deploy to prod.",
    color: "bg-[#B6DFF]",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description:
      "Live build logs and request metrics directly in the dashboard.",
    color: "bg-[#FF914D]",
  },
  {
    icon: Lock,
    title: "Enterprise Security",
    description:
      "Role-based access, audit logs, and secure environment variables.",
    color: "bg-white",
  },
  {
    icon: Globe,
    title: "Global Edge",
    description: "Deploy to 25+ regions for low-latency inference worldwide.",
    color: "bg-[#B6DFF]",
  },
  {
    icon: CheckCircle2,
    title: "Automated CI/CD",
    description: "Built-in pipelines for testing and containerization.",
    color: "bg-[#FFDE59]",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-5xl font-black uppercase tracking-tighter mb-6">
            Built for <span className="bg-[#B6DFF] px-2">Speed</span>
          </h1>
          <p className="text-xl font-bold text-gray-600 max-w-2xl mx-auto font-mono">
            The only platform that treats Jupyter Notebooks as first-class
            production citizens.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {featuresList.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={idx}
                variants={itemVariants}
                whileHover={{
                  y: -8,
                  boxShadow: "8px 8px 0px 0px rgba(0,0,0,1)",
                }}
                className={`border-2 border-black p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col ${feature.color}`}
              >
                <div className="mb-6 border-2 border-black bg-black text-white w-12 h-12 flex items-center justify-center">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-black uppercase mb-4">
                  {feature.title}
                </h3>
                <p className="font-mono text-sm font-bold leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
