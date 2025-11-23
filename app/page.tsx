"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Cloud, Zap, Shield, Code2 } from "lucide-react";
import { Navbar } from "@/components/navigation/navbar";
import { Footer } from "@/components/marketing/footer";

const features = [
  {
    icon: Cloud,
    title: "One-Click Deploy",
    description: "Push to Google Cloud Run instantly.",
    color: "bg-[#B6DFF]",
  },
  {
    icon: Zap,
    title: "Automated CI/CD",
    description: "Auto-builds on every git push.",
    color: "bg-[#FFDE59]",
  },
  {
    icon: Shield,
    title: "Secure & Scalable",
    description: "Enterprise-grade security built-in.",
    color: "bg-[#FF914D]",
  },
  {
    icon: Code2,
    title: "Git Integration",
    description: "Seamless GitHub & GitLab sync.",
    color: "bg-[#B6DFF]",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-mono">
      <Navbar />

      <main className="relative pt-20 pb-20">
        {/* Hero Section */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-block border-2 border-black bg-[#FFDE59] px-4 py-1 mb-6 font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              v4.0 Now Live
            </div>
            <h1 className="text-5xl sm:text-7xl font-black uppercase tracking-tighter leading-none mb-8">
              Deploy Notebooks <br />
              <span className="bg-[#B6DFF] px-2">In Seconds</span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto font-bold">
              Turn your Jupyter notebooks into production-ready APIs. No
              Dockerfiles. No YAML hell. Just code.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/register">
                <Button className="h-14 px-8 text-lg border-2 border-black bg-black text-white hover:bg-white hover:text-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all rounded-none uppercase font-bold">
                  Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/docs">
                <Button
                  variant="outline"
                  className="h-14 px-8 text-lg border-2 border-black bg-white text-black hover:bg-[#B6DFF] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all rounded-none uppercase font-bold"
                >
                  Read Docs
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Features Grid */}
          <div className="mt-32 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{
                    y: -8,
                    boxShadow: "8px 8px 0px 0px rgba(0,0,0,1)",
                  }}
                  className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  <div
                    className={`w-12 h-12 border-2 border-black ${feature.color} flex items-center justify-center mb-4`}
                  >
                    <Icon className="h-6 w-6 text-black" />
                  </div>
                  <h3 className="font-bold text-xl uppercase mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
