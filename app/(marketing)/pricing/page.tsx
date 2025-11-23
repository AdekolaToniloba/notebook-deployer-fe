"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Starter",
    price: "Free",
    features: [
      "5 notebooks",
      "1 concurrent build",
      "10GB storage",
      "Basic monitoring",
    ],
    cta: "Get Started",
    color: "bg-white",
  },
  {
    name: "Pro",
    price: "$29",
    features: [
      "Unlimited notebooks",
      "5 concurrent builds",
      "500GB storage",
      "Priority support",
    ],
    cta: "Start Trial",
    color: "bg-[#B6DFF]", // Highlight color
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    features: [
      "Unlimited builds",
      "SLA guarantee",
      "Dedicated support",
      "On-premise option",
    ],
    cta: "Contact Sales",
    color: "bg-white",
  },
];

export default function PricingPage() {
  return (
    <div className="px-4 py-20 max-w-7xl mx-auto">
      <div className="text-center mb-20">
        <h1 className="text-5xl font-black uppercase mb-4">
          Transparent Pricing
        </h1>
        <p className="text-xl text-gray-600 font-bold">
          No hidden fees. No credit card required.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`border-2 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col ${plan.color}`}
          >
            <h3 className="text-2xl font-black uppercase mb-2">{plan.name}</h3>
            <div className="text-4xl font-bold mb-8">{plan.price}</div>

            <ul className="space-y-4 mb-8 flex-1">
              {plan.features.map((feat, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 font-bold text-sm"
                >
                  <div className="h-5 w-5 border-2 border-black bg-black text-white flex items-center justify-center">
                    <Check className="h-3 w-3" />
                  </div>
                  {feat}
                </li>
              ))}
            </ul>

            <Link href="/register" className="w-full">
              <Button className="w-full h-12 rounded-none border-2 border-black bg-black text-white hover:bg-white hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase font-bold transition-all">
                {plan.cta}
              </Button>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
