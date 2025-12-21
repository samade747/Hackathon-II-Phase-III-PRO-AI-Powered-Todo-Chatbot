"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, User, Bot, Plus, Trash2, CheckCircle2, MoreVertical, Menu, X, Settings, LogOut, Bell, Search } from "lucide-react";
import VoiceControl from "@/components/VoiceControl";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface Message {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    id: string;
}

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "Hey! I'm your AI Task Buddy. I can help you juggle your todos in English or Urdu. What are we tackling today? 😊",
            timestamp: new Date(),
            id: "1"
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async (text: string) => {
        if (!text.trim()) return;

        const userMessage: Message = { role: "user", content: text, timestamp: new Date(), id: Date.now().toString() };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch("http://localhost:8000/api/agent/dispatch", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
                },
                body: JSON.stringify({ utterance: text })
            });

            const data = await response.json();

            if (response.ok) {
                setMessages((prev) => [...prev, {
                    role: "assistant",
                    content: data.message,
                    timestamp: new Date(),
                    id: (Date.now() + 1).toString()
                }]);
            } else {
                setMessages((prev) => [...prev, {
                    role: "assistant",
                    content: "Wait, something's not right. Are you logged in? I needs a token to help you! 😅",
                    timestamp: new Date(),
                    id: (Date.now() + 1).toString()
                }]);
            }
        } catch (error) {
            setMessages((prev) => [...prev, {
                role: "assistant",
                content: "Network glitch! I can't reach the server. Mind checking your connection? 📡",
                timestamp: new Date(),
                id: (Date.now() + 1).toString()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTranscript = (transcript: string) => {
        sendMessage(transcript);
    };

    return (
        <div className="flex h-screen bg-[#0F172A] overflow-hidden font-sans selection:bg-indigo-500/30 text-white relative">
            {/* Cinematic Background Elements */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-purple-600/10 blur-[100px] rounded-full" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-150 contrast-150 mix-blend-overlay" />
                <div className="absolute inset-x-0 inset-y-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:32px_32px] opacity-20" />
            </div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{ x: sidebarOpen ? 0 : -300 }}
                className={cn(
                    "fixed inset-y-0 left-0 w-80 bg-[#1E293B]/80 backdrop-blur-2xl border-r border-white/5 z-50 lg:relative lg:translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col shadow-2xl lg:shadow-none",
                    !sidebarOpen && "translate-x-[-100%] lg:translate-x-0"
                )}
            >
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center gap-3 cursor-pointer"
                    >
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
                            <Bot size={24} className="animate-pulse" />
                        </div>
                        <span className="font-black text-xl tracking-tight text-white/90">Agentixz<span className="text-indigo-400">.</span></span>
                    </motion.div>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 hover:bg-white/10 rounded-full text-white/60 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto space-y-6">
                    <motion.button
                        whileHover={{ scale: 1.01, backgroundColor: "rgba(255,255,255,0.1)" }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-bold hover:bg-white/10 transition-all shadow-xl backdrop-blur-sm group"
                    >
                        <Plus size={20} className="text-indigo-400 group-hover:rotate-90 transition-transform duration-300" />
                        <span>New Task Session</span>
                    </motion.button>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Quick Actions</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: "Settings", icon: Settings },
                                { label: "Search", icon: Search },
                                { label: "Log Out", icon: LogOut },
                                { label: "Support", icon: Bell }
                            ].map((item, i) => (
                                <button key={i} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all group">
                                    <item.icon size={20} className="text-slate-400 group-hover:text-indigo-400 transition-colors" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2 pt-4">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] px-2 mb-4">Task History</div>
                        {["Analyze Market Trends", "Refactor Auth Logic", "Urdu Assistant Set"].map((task, i) => (
                            <motion.button
                                key={i}
                                whileHover={{ x: 5 }}
                                className="w-full text-left px-4 py-4 rounded-2xl text-slate-400 hover:bg-indigo-500/10 hover:text-white transition-all text-sm truncate flex items-center gap-4 bg-white/[0.02] border border-white/5"
                            >
                                <div className="w-2 h-2 rounded-full bg-indigo-500/50 group-hover:bg-indigo-400" />
                                {task}
                            </motion.button>
                        ))}
                    </div>
                </div>

                <div className="p-6 border-t border-white/5 bg-[#1E293B]/40">
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 active:scale-95 transition-all cursor-pointer">
                        <div className="relative">
                            <div className="w-11 h-11 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 ring-1 ring-white/30 font-bold overflow-hidden">
                                JD
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#1E293B] rounded-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-black text-white/90 truncate">John Doe</div>
                            <div className="text-[10px] font-bold text-indigo-400/80 uppercase tracking-widest">Master Engineer</div>
                        </div>
                        <MoreVertical size={16} className="text-slate-500" />
                    </div>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
                {/* Header */}
                <header className="h-24 border-b border-white/5 flex items-center justify-between px-8 lg:px-12 sticky top-0 z-20 bg-[#0F172A]/40 backdrop-blur-2xl">
                    <div className="flex items-center gap-6">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition-all border border-white/10"
                        >
                            <Menu size={24} />
                        </motion.button>
                        <div className="space-y-1">
                            <h1 className="text-2xl font-black text-white/95 tracking-tight flex items-center gap-3">
                                Task Cortex
                                <span className="text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full uppercase tracking-widest">v3.0 PRO</span>
                            </h1>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Neural Link Active</span>
                            </div>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0F172A] bg-slate-700 flex items-center justify-center text-[10px] font-bold">A{i}</div>
                            ))}
                        </div>
                        <span className="text-xs font-bold text-slate-500 border-l border-white/10 pl-4 py-2 uppercase tracking-widest">3 Active Agents</span>
                    </div>
                </header>

                {/* Message Area */}
                <div className="flex-1 overflow-y-auto px-6 lg:px-16 py-12 space-y-10 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
                    <div className="max-w-4xl mx-auto space-y-10">
                        <AnimatePresence mode="popLayout" initial={false}>
                            {messages.map((m, i) => (
                                <motion.div
                                    key={m.id}
                                    layout
                                    initial={{ opacity: 0, y: 30, scale: 0.9, filter: "blur(10px)" }}
                                    animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 260,
                                        damping: 20
                                    }}
                                    className={cn(
                                        "flex flex-col gap-3 group px-2",
                                        m.role === "user" ? "items-end text-right" : "items-start text-left"
                                    )}
                                >
                                    <div className={cn(
                                        "flex items-center gap-3 px-2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                                        m.role === "user" ? "flex-row-reverse" : "flex-row"
                                    )}>
                                        <div className={cn(
                                            "w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold",
                                            m.role === "user" ? "bg-indigo-500" : "bg-slate-700"
                                        )}>
                                            {m.role === "user" ? "ME" : "AI"}
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                            {m.role === "user" ? "Personal Assistant" : "Cortex Intelligence"}
                                        </span>
                                    </div>

                                    <div className={cn(
                                        "group relative max-w-[90%] md:max-w-[75%] px-7 py-5 rounded-[2.5rem] shadow-2xl transition-all duration-300 ring-1 ring-white/5",
                                        m.role === "user"
                                            ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-none hover:shadow-indigo-500/10"
                                            : "bg-[#1E293B]/60 backdrop-blur-xl text-slate-200 rounded-tl-none border border-white/5 hover:bg-[#1E293B]/80"
                                    )}>
                                        <p className="text-[16px] leading-[1.6] font-medium tracking-wide whitespace-pre-wrap">{m.content}</p>

                                        <div className={cn(
                                            "absolute -bottom-6 text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 transition-all group-hover:text-slate-400",
                                            m.role === "user" ? "right-4" : "left-4"
                                        )}>
                                            {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Received
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {isLoading && (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-4 px-2"
                            >
                                <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
                                    <Bot size={20} className="text-indigo-400 animate-pulse" />
                                </div>
                                <div className="flex items-end gap-1.5 p-5 rounded-[2rem] rounded-tl-none bg-white/5 border border-white/5 backdrop-blur-sm">
                                    <motion.span
                                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                                        transition={{ repeat: Infinity, duration: 1.2 }}
                                        className="w-2 h-2 bg-indigo-400 rounded-full"
                                    />
                                    <motion.span
                                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                                        transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }}
                                        className="w-2 h-2 bg-indigo-400 rounded-full"
                                    />
                                    <motion.span
                                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                                        transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }}
                                        className="w-2 h-2 bg-indigo-400 rounded-full"
                                    />
                                </div>
                            </motion.div>
                        )}
                        <div ref={messagesEndRef} className="h-8" />
                    </div>
                </div>

                {/* Input Area */}
                <div className="p-8 lg:p-12 z-20">
                    <div className="max-w-4xl mx-auto relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2.5rem] blur opacity-10 group-focus-within:opacity-25 transition duration-500"></div>

                        <motion.div
                            layout
                            className="relative flex items-center gap-4 bg-[#1E293B]/80 backdrop-blur-3xl p-3 rounded-[2.5rem] border border-white/10 shadow-3xl focus-within:border-indigo-500/50 transition-all duration-300"
                        >
                            <div className="flex-1 flex items-center px-6">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === "Enter" && sendMessage(input)}
                                    placeholder="Drop a task in English or Urdu..."
                                    className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-slate-500 py-4 text-[16px] font-medium tracking-wide"
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="flex items-center gap-3 pr-2">
                                <VoiceControl onTranscript={handleTranscript} />

                                <motion.button
                                    whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(79, 70, 229, 0.4)" }}
                                    whileTap={{ scale: 0.92 }}
                                    onClick={() => sendMessage(input)}
                                    disabled={isLoading || !input.trim()}
                                    className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-[1.5rem] flex items-center justify-center hover:shadow-indigo-500/20 disabled:opacity-20 disabled:grayscale transition-all shadow-xl ring-1 ring-white/20"
                                >
                                    <Send size={22} className={cn(isLoading ? "animate-spin" : "")} />
                                </motion.button>
                            </div>
                        </motion.div>

                        <div className="mt-5 flex justify-center gap-8">
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">AES-256 Encryption active</span>
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Powered by Claude-3.5 Agentic Layer</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
