"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Bot, ArrowRight, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center relative bg-[#0F172A] text-white overflow-hidden selection:bg-indigo-500/30">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-150 contrast-150 mix-blend-overlay" />
        <div className="absolute inset-x-0 inset-y-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:32px_32px] opacity-20" />
      </div>

      {/* Content Container */}
      <div className="z-10 flex flex-col items-center justify-center px-6 text-center max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 ring-1 ring-white/10"
        >
          <Sparkles size={16} className="text-indigo-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Phase III: AI-Powered Operations</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative mb-12"
        >
          <h1 className="text-6xl font-black tracking-tighter sm:text-8xl lg:text-9xl leading-[0.9] flex flex-col">
            <span className="text-white">AI Agentixz</span>
            <span className="text-indigo-500">Next-Gen</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600">
              Todo Chatbot
            </span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="max-w-2xl text-lg sm:text-xl font-medium text-slate-400 mb-12 leading-relaxed"
        >
          The ultimate AI operative for elite task management. Orchestrate your objectives with natural language, voice commands, and multi-lingual intelligence.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto"
        >
          <Link
            href="/chat"
            className="group px-8 py-5 bg-gradient-to-r from-indigo-500 to-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all active:scale-95 ring-1 ring-white/20"
          >
            Start Mission
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/auth/login"
            className="px-8 py-5 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95"
          >
            Access Terminal
          </Link>
        </motion.div>
      </div>

      {/* Footer Decorative Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-12 z-10 flex items-center gap-4 text-slate-500"
      >
        <Bot size={24} className="opacity-50 animate-pulse text-indigo-400" />
        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Advanced AI Orchestration Engine</span>
      </motion.div>
    </main>
  );
}
