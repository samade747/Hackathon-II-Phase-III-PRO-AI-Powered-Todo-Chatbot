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

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface Task {
    id: string;
    title: string;
    description?: string;
    due_date?: string;
    status: "pending" | "completed";
}

export default function ChatPage() {
    const [user, setUser] = useState<any>(null);
    const [isPending, setIsPending] = useState(true);
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "Welcome to AI Agentixz USA! I'm your elite AI operative. I can help you manage your objectives in English or Urdu. What's our first mission? 🇺🇸",
            timestamp: new Date(2025, 0, 1), // Static date for initial message to avoid hydration mismatch
            id: "1"
        }
    ]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [viewMode, setViewMode] = useState<"active" | "history">("active");
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const handleAddTask = async () => {
        if (!newTaskTitle.trim()) return;
        const { data: { session } } = await supabase.auth.getSession(); // Fetch session locally
        if (!session) {
            router.push("/auth/login"); // Redirect if no session
            return;
        }
        const { error } = await supabase
            .from('tasks')
            .insert([{ title: newTaskTitle, status: "pending", user_id: session.user.id }]); // Use session.user.id

        if (!error) {
            setNewTaskTitle("");
            setIsAddingTask(false);
            fetchTasks();
        }
    };

    const updateTaskDetails = async (id: string, updates: Partial<Task>) => {
        const { error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', id);

        if (!error) {
            fetchTasks();
            if (selectedTask) setSelectedTask({ ...selectedTask, ...updates });
        }
    };

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push("/auth/login");
            } else {
                setUser(session.user);
                // Fetch tasks from Supabase
                fetchTasks();
            }
            setIsPending(false);
        };

        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                router.push("/auth/login");
            } else {
                setUser(session.user);
            }
        });

        return () => subscription.unsubscribe();
    }, [router]);

    const fetchTasks = async () => {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setTasks(data);
    };

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
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch("http://localhost:8000/api/agent/dispatch", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.access_token || ""}`
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

                // Sync tasks if action is create
                if (data.action === "create" && data.result?.task) {
                    const { error } = await supabase
                        .from('tasks')
                        .insert([{ title: data.result.task, status: "pending", user_id: user?.id }]);

                    if (!error) fetchTasks();
                }
            } else {
                setMessages((prev) => [...prev, {
                    role: "assistant",
                    content: "Wait, something's not right. Are you logged in? AI Agentixz USA needs a secure link to help you! 😅",
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

    const toggleTask = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === "pending" ? "completed" : "pending";
        const { error } = await supabase
            .from('tasks')
            .update({ status: newStatus })
            .eq('id', id);

        if (!error) fetchTasks();
    };

    const deleteTask = async (id: string) => {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id);

        if (!error) fetchTasks();
    };

    const handleTranscript = (transcript: string) => {
        sendMessage(transcript);
    };

    if (isPending) {
        return (
            <div className="h-screen bg-[#0F172A] flex items-center justify-center text-white">
                <motion.div
                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="flex flex-col items-center gap-4"
                >
                    <Bot size={48} className="text-indigo-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">Initializing AI Agentixz USA...</span>
                </motion.div>
            </div>
        );
    }

    if (!user) return null;

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

            {/* Main Container - Split Screen */}
            <div className="flex-1 flex overflow-hidden relative z-10">

                {/* Left Side: Chat Interface */}
                <section className="flex-1 flex flex-col border-r border-white/5 bg-[#0F172A]/40 backdrop-blur-md">
                    {/* Header */}
                    <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-white/[0.02]">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2 hover:bg-white/10 rounded-xl transition-colors text-white/80"
                            >
                                <Menu size={24} />
                            </button>
                            <h1 className="text-2xl font-black tracking-tighter text-white">
                                AI AGENTIXZ <span className="text-indigo-500">USA</span>
                            </h1>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 hidden sm:block">Neural Active</span>
                            </div>
                            {/* User Profile */}
                            <div className="flex items-center gap-3 p-2 pr-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group">
                                <div className="relative">
                                    <div className="w-9 h-9 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 ring-1 ring-white/30 font-bold text-sm">
                                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#0F172A] rounded-full" />
                                </div>
                                <div className="hidden md:block">
                                    <div className="text-xs font-bold text-white/90">{user?.email?.split('@')[0] || 'User'}</div>
                                    <div className="text-[9px] font-bold text-indigo-400/80 uppercase tracking-wider">Online</div>
                                </div>
                                <button
                                    onClick={() => supabase.auth.signOut()}
                                    className="hidden group-hover:flex items-center gap-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-[10px] font-bold text-red-400 uppercase tracking-wider transition-all"
                                >
                                    <LogOut size={12} />
                                    Exit
                                </button>
                            </div>
                        </div>
                    </header>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                        <AnimatePresence mode="popLayout">
                            {messages.map((m) => (
                                <motion.div
                                    key={m.id}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className={cn(
                                        "flex flex-col max-w-[85%]",
                                        m.role === "user" ? "ml-auto items-end" : "items-start"
                                    )}
                                >
                                    <div className="group relative">
                                        <div className={cn(
                                            "px-6 py-4 rounded-[2rem] text-sm font-medium shadow-2xl ring-1 ring-white/5",
                                            m.role === "user"
                                                ? "bg-indigo-600 text-white rounded-br-none"
                                                : "bg-white/5 backdrop-blur-xl text-slate-200 rounded-bl-none border border-white/5"
                                        )}>
                                            <p>{m.content}</p>
                                        </div>
                                        <div className="absolute -bottom-6 left-0 text-[10px] text-slate-500 opacity-60">
                                            {new Date(m.timestamp).toISOString().slice(11, 16)}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {isLoading && (
                            <div className="flex gap-2 p-4 bg-white/5 rounded-2xl w-fit animate-pulse">
                                <div className="w-2 h-2 bg-indigo-400 rounded-full" />
                                <div className="w-2 h-2 bg-indigo-400 rounded-full" />
                                <div className="w-2 h-2 bg-indigo-400 rounded-full" />
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-8">
                        <div className="relative group max-w-3xl mx-auto">
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2rem] blur opacity-10 group-focus-within:opacity-25 transition duration-500" />
                            <div className="relative flex items-center gap-4 bg-[#1E293B]/80 backdrop-blur-3xl p-2 rounded-[2rem] border border-white/10">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === "Enter" && sendMessage(input)}
                                    placeholder="Ask me something..."
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-white px-6 py-3"
                                />
                                <VoiceControl onTranscript={handleTranscript} />
                                <button
                                    onClick={() => sendMessage(input)}
                                    className="p-4 bg-indigo-500 text-white rounded-2xl hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/20"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Right Side: Task Board (Side-by-side Layout as requested) */}
                <section className="w-[450px] flex flex-col bg-[#1E293B]/40 backdrop-blur-3xl relative">
                    <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-white/[0.02]">
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => setViewMode("active")}
                                className={cn("text-sm font-black tracking-tight transition-colors", viewMode === "active" ? "text-white" : "text-slate-500 hover:text-slate-300")}
                            >
                                ACTIVE
                            </button>
                            <button
                                onClick={() => setViewMode("history")}
                                className={cn("text-sm font-black tracking-tight transition-colors", viewMode === "history" ? "text-white" : "text-slate-500 hover:text-slate-300")}
                            >
                                HISTORY
                            </button>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setIsAddingTask(!isAddingTask)}
                            className={cn("p-2 rounded-xl transition-colors", isAddingTask ? "bg-indigo-500 text-white" : "bg-white/5 hover:bg-white/10")}
                        >
                            <Plus size={20} />
                        </motion.button>
                    </header>

                    <div className="flex-1 overflow-y-auto p-8 space-y-4">
                        {isAddingTask && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl"
                            >
                                <input
                                    autoFocus
                                    type="text"
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    onKeyPress={(e) => e.key === "Enter" && handleAddTask()}
                                    placeholder="Enter new objective..."
                                    className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-white placeholder:text-indigo-300/40"
                                />
                            </motion.div>
                        )}

                        <div className="flex items-center justify-between px-2 mb-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                {viewMode === "active" ? "Current Objectives" : "Archived Progress"}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">
                                {tasks.filter(t => viewMode === "active" ? t.status === "pending" : t.status === "completed").length} Total
                            </span>
                        </div>

                        <AnimatePresence mode="popLayout">
                            {tasks
                                .filter(t => viewMode === "active" ? t.status === "pending" : t.status === "completed")
                                .map((task) => (
                                    <motion.div
                                        key={task.id}
                                        layout
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        onClick={() => setSelectedTask(task)}
                                        className={cn(
                                            "group flex items-center gap-4 p-5 rounded-[1.5rem] border transition-all duration-300 cursor-pointer",
                                            task.status === "completed"
                                                ? "bg-emerald-500/5 border-emerald-500/10 text-slate-500"
                                                : "bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/[0.07]"
                                        )}
                                    >
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleTask(task.id, task.status);
                                            }}
                                            className={cn(
                                                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                                                task.status === "completed"
                                                    ? "bg-emerald-500 border-emerald-500 text-white"
                                                    : "border-slate-600 group-hover:border-indigo-500"
                                            )}
                                        >
                                            {task.status === "completed" && <CheckCircle2 size={14} />}
                                        </button>
                                        <span className={cn("flex-1 font-bold text-sm tracking-wide", task.status === "completed" && "line-through")}>
                                            {task.title}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteTask(task.id);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </motion.div>
                                ))}
                        </AnimatePresence>
                    </div>

                    {/* Task Details Info (Footer style or Sidebar) */}
                    <div className="p-8 border-t border-white/5 bg-black/20">
                        <div className="flex items-center gap-4">
                            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(tasks.filter(t => t.status === "completed").length / (tasks.length || 1)) * 100}%` }}
                                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500"
                                />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === "completed").length / tasks.length) * 100) : 0}% Complete
                            </span>
                        </div>
                    </div>

                    {/* Task Details Overlay */}
                    <AnimatePresence>
                        {selectedTask && (
                            <motion.div
                                initial={{ x: "100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="absolute inset-0 bg-[#0F172A] z-30 flex flex-col border-l border-white/10 shadow-[-20px_0_50px_rgba(0,0,0,0.5)]"
                            >
                                <header className="h-20 border-b border-white/5 flex items-center justify-between px-8">
                                    <button onClick={() => setSelectedTask(null)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                                        <X size={20} className="text-slate-400" />
                                    </button>
                                    <span className="text-xs font-black uppercase tracking-widest text-indigo-400">AI Agentixz USA Intelligence</span>
                                </header>
                                <div className="p-8 space-y-8 flex-1 overflow-y-auto">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Objective Name</label>
                                            <input
                                                type="text"
                                                value={selectedTask.title}
                                                onChange={(e) => updateTaskDetails(selectedTask.id, { title: e.target.value })}
                                                className="w-full bg-transparent border-none focus:ring-0 text-2xl font-black p-0"
                                            />
                                        </div>
                                        <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5 group">
                                            <Bell size={18} className="text-indigo-400" />
                                            <div className="flex-1">
                                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Due Date</div>
                                                <input
                                                    type="date"
                                                    value={selectedTask.due_date || ""}
                                                    onChange={(e) => updateTaskDetails(selectedTask.id, { due_date: e.target.value })}
                                                    className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-300 p-0"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 p-4 bg-white/5 rounded-2xl border border-white/5 min-h-[150px]">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Deep Briefing</div>
                                            <textarea
                                                value={selectedTask.description || ""}
                                                onChange={(e) => updateTaskDetails(selectedTask.id, { description: e.target.value })}
                                                placeholder="Provide tactical context..."
                                                className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-slate-400 leading-relaxed italic resize-none p-0"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8 border-t border-white/5 bg-white/[0.02]">
                                    <button
                                        onClick={() => {
                                            toggleTask(selectedTask.id, selectedTask.status);
                                            setSelectedTask(null);
                                        }}
                                        className={cn(
                                            "w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[.2em] transition-all",
                                            selectedTask.status === "completed"
                                                ? "bg-slate-700 text-slate-400"
                                                : "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                                        )}
                                    >
                                        {selectedTask.status === "completed" ? "RE-ACTIVATE MISSION" : "COMPLETE OBJECTIVE"}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>

            </div>

        </div>
    );
}
