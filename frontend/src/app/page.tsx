"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Cpu, Activity, LayoutTemplate, ShieldAlert, ArrowRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/Logo";

const features = [
  {
    title: "AI-Powered VLSI Design",
    description: "Design VLSI circuits using state-of-the-art LLMs. Generate precise Verilog code automatically.",
    icon: <Cpu className="w-8 h-8 text-cyan-400" />,
  },
  {
    title: "Semiconductor Analytics",
    description: "Deep learning models for critical defect detection and root-cause analytics using PyTorch & LightGBM.",
    icon: <ShieldAlert className="w-8 h-8 text-fuchsia-400" />,
  },
  {
    title: "Layout & Power Optimization",
    description: "Predict power and timing optimization metrics prior to physical synthesis runs.",
    icon: <LayoutTemplate className="w-8 h-8 text-cyan-400" />,
  },
  {
    title: "Seamless Simulation",
    description: "Run advanced simulations integrated directly with open-source tools like Yosys and Verilator.",
    icon: <Activity className="w-8 h-8 text-fuchsia-400" />,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-slate-950/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo className="w-48 h-16 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
          </div>
          <div className="flex gap-4 items-center">
            <Link href="/login" className={buttonVariants({ variant: "ghost", className: "text-slate-300 hover:text-white" })}>
              Login
            </Link>
            <Link href="/dashboard" className={buttonVariants({ className: "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_10px_rgba(34,211,238,0.5)] border-0" })}>
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <div className="inline-block px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-sm font-medium mb-4 backdrop-blur-md">
              Enterprise AI SaaS for VLSI Engineers
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6">
              The Future of <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 bg-clip-text text-transparent">
                Semiconductor Design
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">
              Automate Verilog generation, run intelligent simulations, optimize layouts, and detect defects in milliseconds using state-of-the-art AI.
            </p>
            <div className="flex items-center justify-center gap-4 pt-8">
              <Link 
                href="/dashboard" 
                className={buttonVariants({ size: "lg", className: "bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-0 shadow-[0_0_20px_rgba(34,211,238,0.4)] h-12 px-8 text-lg hover:opacity-90 transition-opacity" })}
              >
                  Start Designing
                  <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-32"
          >
            {features.map((feature, idx) => (
              <Card key={idx} className="bg-slate-900/40 border-slate-800 backdrop-blur-xl hover:border-cyan-500/50 transition-colors">
                <CardContent className="p-6 text-left">
                  <div className="mb-4 bg-slate-950/50 p-3 rounded-xl inline-block border border-slate-800">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed text-sm">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
