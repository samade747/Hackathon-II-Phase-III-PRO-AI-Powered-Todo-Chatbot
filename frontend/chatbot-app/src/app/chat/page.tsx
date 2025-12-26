"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, User, Bot, Plus, Trash2, CheckCircle2, MoreVertical, Menu, X } from "lucide-react";
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
}

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "Hi there! I'm your AI Task Assistant. I can help you manage your todos in English or Urdu. What's on your mind?",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [tasks, setTasks] = useState<any[]>([]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchTasks = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const response = await fetch(`${apiUrl}/api/agent/tasks`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    setTasks(data);
                } else {
                    console.error("Tasks API returned non-array:", data);
                    setTasks([]);
                }
            }
        } catch (error) {
            console.error("Failed to fetch tasks", error);
            setTasks([]);
        }
    };

    const fetchHistory = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const response = await fetch(`${apiUrl}/api/agent/history`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    // Map backend history to frontend Message format
                    // Backend: { utterance, agent_response, timestamp, ... }
                    // We need to interleave them or just show them. 
                    // Actually, the current history structure in backend/agent.py save_interaction is one row per turn.
                    const historyMessages: Message[] = [];
                    // Reverse to get chronological order if API returns newest first
                    // The API currently orders by created_at DESC (newest first).
                    const sortedData = [...data].reverse();

                    sortedData.forEach((item: any) => {
                        if (item.utterance) {
                            historyMessages.push({
                                role: "user",
                                content: item.utterance,
                                timestamp: new Date(item.timestamp || item.created_at)
                            });
                        }
                        if (item.agent_response) {
                            historyMessages.push({
                                role: "assistant",
                                content: item.agent_response,
                                timestamp: new Date(item.timestamp || item.created_at) // Approximate timestamp
                            });
                        }
                    });

                    if (historyMessages.length > 0) {
                        setMessages(historyMessages);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch history", error);
        }
    };

    useEffect(() => {
        fetchHistory();
        fetchTasks();

        // Request Notification Permission
        if ("Notification" in window) {
            Notification.requestPermission();
        }

        // Alarm Check Interval
        const interval = setInterval(() => {
            const now = new Date();
            tasks.forEach(task => {
                if (task.due_date && task.status === 'pending') {
                    const due = new Date(task.due_date);
                    // Check if due time is within the last minute (to avoid spamming)
                    const diff = now.getTime() - due.getTime();
                    if (diff >= 0 && diff < 60000) { // If due within last 60s
                        if (Notification.permission === "granted") {
                            new Notification(`Task Due: ${task.title}`, {
                                body: `It's time for: ${task.title}`,
                                icon: "/icon.png" // Optional
                            });
                        }
                    }
                }
            });
        }, 30000); // Check every 30s

        return () => clearInterval(interval);
    }, [tasks]);

    const toggleTask = async (taskId: string) => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            // Optimistic update
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } : t));

            await fetch(`${apiUrl}/api/agent/tool`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
                },
                body: JSON.stringify({
                    name: "toggle_todo",
                    arguments: { task_id: taskId }
                })
            });
            // Re-fetch to ensure sync
            fetchTasks();
        } catch (error) {
            console.error("Failed to toggle task", error);
            fetchTasks(); // Revert on error
        }
    };

    const sendMessage = async (text: string) => {
        if (!text.trim()) return;

        const userMessage: Message = { role: "user", content: text, timestamp: new Date() };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const response = await fetch(`${apiUrl}/api/agent/dispatch`, {
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
                    timestamp: new Date()
                }]);
                // Refresh tasks after an action
                fetchTasks();
            } else {
                setMessages((prev) => [...prev, {
                    role: "assistant",
                    content: "Oops! I encountered an issue. Please make sure you're logged in.",
                    timestamp: new Date()
                }]);
            }
        } catch (error) {
            setMessages((prev) => [...prev, {
                role: "assistant",
                content: "I couldn't reach my brain (the server). Please check your connection.",
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTranscript = (transcript: string) => {
        sendMessage(transcript);
    };

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{ x: sidebarOpen ? 0 : -300 }}
                className={cn(
                    "fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-200 z-50 lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none",
                    !sidebarOpen && "translate-x-[-100%] lg:translate-x-0"
                )}
            >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">A</div>
                        <span className="font-bold text-slate-800 text-lg">Agentixz</span>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 flex-1 overflow-y-auto space-y-2">
                    <button
                        onClick={() => setMessages([])}
                        className="w-full flex items-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 mb-6"
                    >
                        <Plus size={18} />
                        <span>New Chat</span>
                    </button>

                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 mb-2">Recent Tasks</div>
                    {tasks.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-slate-400 text-center italic">No pending tasks found</div>
                    ) : (
                        tasks.map((task, i) => (
                            <button
                                key={task.id || i}
                                onClick={() => toggleTask(task.id)}
                                className="w-full text-left px-4 py-4 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all text-sm truncate flex items-center gap-3 border border-transparent hover:border-slate-100"
                            >
                                <CheckCircle2 size={18} className={cn("flex-shrink-0 transition-colors", task.status === 'completed' ? "text-green-500" : "text-slate-300 group-hover:text-slate-400")} />
                                <div className="flex-1 min-w-0">
                                    <div className={cn("font-medium truncate transition-all", task.status === 'completed' && "line-through opacity-50")}>{task.title}</div>
                                    <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                                        <span className={cn("capitalize", task.priority === 'urgent' ? "text-rose-500 font-bold" : task.priority === 'high' ? "text-orange-500" : "")}>{task.priority}</span>
                                        {task.recurrence !== 'none' && <span>• {task.recurrence}</span>}
                                        {task.due_date && (
                                            <span className="text-indigo-500 font-medium">
                                                • {new Date(task.due_date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>

                <div className="p-4 border-t border-slate-100">
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                        <div className="w-10 h-10 bg-gradient-to-tr from-slate-200 to-slate-300 rounded-full flex items-center justify-center text-slate-600 shadow-inner">
                            <User size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-800 truncate">John Doe</div>
                            <div className="text-xs text-slate-500 truncate">Premium Plan</div>
                        </div>
                        <MoreVertical size={16} className="text-slate-400" />
                    </div>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative bg-white">
                {/* Header */}
                <header className="h-20 border-b border-slate-100 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-10 bg-white/80 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                        >
                            <Menu size={24} />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Focus Chat</h1>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                <span className="text-xs font-medium text-slate-500 tracking-wide">Ready to assist</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Message Area */}
                <div className="flex-1 overflow-y-auto px-6 lg:px-10 py-8 space-y-8 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                    <AnimatePresence mode="popLayout">
                        {messages.map((m, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className={cn(
                                    "flex items-end gap-3",
                                    m.role === "user" ? "flex-row-reverse" : "flex-row"
                                )}
                            >
                                <div className={cn(
                                    "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform active:scale-90",
                                    m.role === "user"
                                        ? "bg-indigo-600 text-white"
                                        : "bg-slate-100 text-slate-600"
                                )}>
                                    {m.role === "user" ? <User size={18} /> : <Bot size={18} />}
                                </div>
                                <div className={cn(
                                    "group relative max-w-[85%] lg:max-w-[70%] px-5 py-4 rounded-3xl shadow-sm transition-all",
                                    m.role === "user"
                                        ? "bg-indigo-600 text-white rounded-br-none"
                                        : "bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/50"
                                )}>
                                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{m.content}</p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3"
                        >
                            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center animate-pulse">
                                <Bot size={18} className="text-slate-300" />
                            </div>
                            <div className="flex gap-1.5 p-4 rounded-3xl bg-slate-50 border border-slate-100">
                                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" />
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 lg:p-10 bg-white border-t border-slate-100">
                    <div className="max-w-4xl mx-auto flex items-center gap-2 lg:gap-4 bg-slate-50 p-2 rounded-[24px] border border-slate-200/50 shadow-inner focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-100/50 focus-within:border-indigo-200 transition-all">
                        <div className="flex-1 flex items-center px-2 lg:px-4">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && sendMessage(input)}
                                placeholder="What can I help you with today?"
                                className="w-full bg-transparent border-none focus:ring-0 text-slate-700 placeholder-slate-400 py-3 text-[15px]"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="flex items-center gap-1.5 lg:gap-2 pr-1.5 lg:pr-2">
                            <VoiceControl onTranscript={handleTranscript} />

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => sendMessage(input)}
                                disabled={isLoading || !input.trim()}
                                className="w-11 h-11 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:grayscale transition-all shadow-lg shadow-indigo-100"
                            >
                                <Send size={18} />
                            </motion.button>
                        </div>
                    </div>
                    <div className="mt-4 text-center">
                        <p className="text-[11px] text-slate-400 font-medium">Press Enter to send • Built with Agentixz Intelligence</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
