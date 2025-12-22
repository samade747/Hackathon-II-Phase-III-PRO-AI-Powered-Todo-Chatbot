"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Bot, ArrowRight, Sparkles, Zap, Shield, Globe, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <main className="flex min-h-screen flex-col relative bg-[#0F172A] text-white overflow-x-hidden selection:bg-indigo-500/30">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/20 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-25 brightness-150 contrast-150 mix-blend-overlay" />
        <div className="absolute inset-x-0 inset-y-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:48px_48px] opacity-10" />
      </div>

      {/* Premium Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-4 bg-white/[0.03] backdrop-blur-2xl rounded-[2rem] border border-white/10 ring-1 ring-white/5 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Bot size={24} className="text-white animate-pulse" />
            </div>
            <span className="font-black text-xl tracking-tighter">AGENTIXZ<span className="text-indigo-500">.</span></span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {["Technology", "Directives", "Pricing", "About"].map((item) => (
              <Link key={item} href="#" className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
                {item}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="hidden sm:block text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white px-6">
              Terminal Access
            </Link>
            <Link href="/chat" className="px-6 py-2.5 bg-white text-black rounded-full font-bold text-xs uppercase tracking-tighter hover:bg-slate-200 transition-all shadow-xl">
              Launch Agent
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 z-10 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-12 ring-2 ring-indigo-500/20"
        >
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Neural Engine v3.0 Active</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative mb-12 max-w-6xl"
        >
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.85] flex flex-col items-center">
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 drop-shadow-2xl">AI Agentixz</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-600 drop-shadow-[0_0_30px_rgba(79,70,229,0.4)]">Next-Gen</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-slate-200 to-white">
              Todo Chatbot
            </span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="max-w-2xl text-lg sm:text-2xl font-medium text-slate-300 mb-16 leading-relaxed px-4"
        >
          The world's most advanced AI operative for elite task orchestration. Deploy specialized agent skills via natural language and voice.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="flex flex-col sm:flex-row gap-8 w-full sm:w-auto px-6"
        >
          <Link
            href="/chat"
            className="group relative px-10 py-6 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-4 shadow-[0_20px_50px_rgba(79,70,229,0.3)] hover:shadow-indigo-500/50 transition-all active:scale-95 ring-2 ring-white/20"
          >
            Initiate Deployment
            <ArrowRight size={22} className="group-hover:translate-x-2 transition-transform duration-300" />
          </Link>

          <Link
            href="/auth/login"
            className="px-10 py-6 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-2xl text-white rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center transition-all active:scale-95"
          >
            Access Secure Terminal
          </Link>
        </motion.div>
      </section>

      {/* Feature Grid */}
      <section className="relative z-10 py-32 px-6 max-w-7xl mx-auto w-full">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Zap,
              title: "Neural Speed",
              desc: "Instant intent extraction with sub-millisecond latency for real-time tasking.",
              color: "text-blue-400"
            },
            {
              icon: Shield,
              title: "Encrypted Core",
              desc: "Your data is isolated in secure neural containers with zero-knowledge architecture.",
              color: "text-purple-400"
            },
            {
              icon: Globe,
              title: "Multi-Lingual",
              desc: "Seamlessly switch between English, Urdu, and other protocols natively.",
              color: "text-indigo-400"
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10 }}
              className="p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5 backdrop-blur-md group hover:bg-white/[0.05] transition-all"
            >
              <div className={`w-14 h-14 ${feature.color} bg-current/10 rounded-2xl flex items-center justify-center mb-8 border border-current/20`}>
                <feature.icon size={28} />
              </div>
              <h3 className="text-2xl font-black mb-4 tracking-tight">{feature.title}</h3>
              <p className="text-slate-400 font-medium leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer Branding */}
      <footer className="relative z-10 py-20 px-8 border-t border-white/5 flex flex-col items-center gap-12 bg-black/20">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <Bot size={32} className="text-indigo-500 animate-pulse" />
            <span className="font-black text-2xl tracking-tighter">AGENTIXZ<span className="text-indigo-500">.</span></span>
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.5em]">Advanced Artificial Intelligence Systems</p>
        </div>

        <div className="flex gap-12 text-[10px] font-black uppercase tracking-widest text-slate-600">
          <span>United States</span>
          <span>Intelligence Layer</span>
          <span>V3.8.0</span>
        </div>
      </footer>
    </main>
  );
}
