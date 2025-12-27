"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, CheckCircle2, Menu, X, LogOut, Search, Repeat, Bot, Settings, Bell, Calendar, Clock } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import VoiceControl from "@/components/VoiceControl";

const PriorityChart = ({ tasks }: { tasks: Task[] }) => {
    const activeTasks = tasks.filter(t => t.status === 'pending');
    const counts = {
        urgent: activeTasks.filter(t => t.priority === 'urgent').length,
        high: activeTasks.filter(t => t.priority === 'high').length,
        medium: activeTasks.filter(t => t.priority === 'medium').length,
        low: activeTasks.filter(t => t.priority === 'low').length,
    };
    const max = Math.max(...Object.values(counts), 1);

    return (
        <div className="bg-white/5 border border-white/5 rounded-[2rem] p-6 space-y-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-1 block mb-2">Tactical Distribution</span>
            <div className="flex items-end justify-between gap-2 h-24 px-2">
                {Object.entries(counts).map(([p, count]) => (
                    <div key={p} className="flex-1 flex flex-col items-center gap-2 group">
                        <div className="relative w-full flex flex-col justify-end h-full">
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${(count / max) * 100}%` }}
                                className={cn(
                                    "w-full rounded-t-lg transition-all duration-500",
                                    p === 'urgent' ? "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]" :
                                        p === 'high' ? "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]" :
                                            p === 'low' ? "bg-slate-500" : "bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                                )}
                            />
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-tighter text-slate-500 group-hover:text-white transition-colors">{p}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const TaskTimer = ({ task, onUpdate, callMcpTool }: { task: Task; onUpdate: (id: string, updates: Partial<Task>) => void; callMcpTool: (name: string, args: any) => Promise<any> }) => {
    const [elapsed, setElapsed] = useState(0);
    const [isRunning, setIsRunning] = useState(!!task.timer_started_at);

    useEffect(() => {
        let interval: any;
        if (isRunning && task.timer_started_at) {
            interval = setInterval(() => {
                const now = new Date();
                const start = new Date(task.timer_started_at!);
                const currentSessionSeconds = Math.floor((now.getTime() - start.getTime()) / 1000);
                setElapsed((task.total_time_spent || 0) + currentSessionSeconds);
            }, 1000);
        } else {
            setElapsed(task.total_time_spent || 0);
        }
        return () => clearInterval(interval);
    }, [isRunning, task.timer_started_at, task.total_time_spent]);

    const handleToggle = async () => {
        const action = isRunning ? "stop" : "start";
        const res = await callMcpTool("manage_timer", { task_id: task.id, action });
        if (res) {
            setIsRunning(!isRunning);
            // fetchTasks is called by the component that passes callMcpTool
        }
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-2xl p-4">
            <div className="flex-1">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Mission Duration</div>
                <div className="text-2xl font-black font-mono text-indigo-400">{formatTime(elapsed)}</div>
            </div>
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleToggle}
                className={cn(
                    "p-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                    isRunning ? "bg-red-500/20 text-red-500 border border-red-500/20" : "bg-emerald-500/20 text-emerald-500 border border-emerald-500/20"
                )}
            >
                {isRunning ? "Pause Mission" : "Engage Objective"}
            </motion.button>
        </div>
    );
};

interface Task {
    id: string;
    title: string;
    description?: string;
    due_date?: string;
    reminder_time?: string;
    status: "pending" | "completed";
    priority?: "low" | "medium" | "high" | "urgent";
    recurrence?: "none" | "daily" | "weekly" | "monthly";
    tags?: string[];
    total_time_spent?: number;
    timer_started_at?: string | null;
}

interface Message {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    id: string;
}

const TaskStats = ({ tasks }: { tasks: Task[] }) => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/5 rounded-[2rem] p-6 space-y-4"
        >
            <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Mission Progress</span>
                <span className="text-sm font-black text-indigo-400">{percentage}%</span>
            </div>

            <div className="flex justify-center py-2 relative">
                <svg className="w-28 h-28 transform -rotate-90">
                    <circle
                        cx="56"
                        cy="56"
                        r="50"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-white/[0.03]"
                    />
                    <motion.circle
                        initial={{ strokeDashoffset: 314 }}
                        animate={{ strokeDashoffset: 314 - (314 * percentage) / 100 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        cx="56"
                        cy="56"
                        r="50"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeDasharray="314"
                        strokeLinecap="round"
                        fill="transparent"
                        className="text-indigo-500"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-black">{completed}</span>
                    <span className="text-[8px] uppercase font-bold text-slate-500 tracking-[0.1em]">Solved</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5">
                    <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Done</span>
                    </div>
                    <div className="text-base font-black text-white/90">{completed}</div>
                </div>
                <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5">
                    <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Active</span>
                    </div>
                    <div className="text-base font-black text-white/90">{pending}</div>
                </div>
            </div>
        </motion.div>
    );
};

export default function ChatPage() {
    const [user, setUser] = useState<any>(null);
    const [isPending, setIsPending] = useState(true);
    const router = useRouter();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskPriority, setNewTaskPriority] = useState<Task['priority']>("medium");
    const [newTaskRecurrence, setNewTaskRecurrence] = useState<Task['recurrence']>("none");
    const [newTaskDueDate, setNewTaskDueDate] = useState("");
    const [newTaskDueTime, setNewTaskDueTime] = useState("");
    const [newTaskReminderTime, setNewTaskReminderTime] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    };

    const callMcpTool = async (name: string, args: any) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            router.push("/auth/login");
            return null;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        try {
            const response = await fetch(`${apiUrl}/api/agent/tool`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ name, arguments: args })
            });

            if (response.ok) {
                const data = await response.json();
                fetchTasks();
                return data.result;
            } else {
                throw new Error(`Tool ${name} failed`);
            }
        } catch (error) {
            console.error(error);
            addToast(`Mission operation failed: ${name}`, "error");
            return null;
        }
    };

    const handleAddTask = async (title?: string, priority: Task['priority'] = 'medium', recurrence: Task['recurrence'] = 'none') => {
        const inputContent = title || newTaskTitle;
        if (!inputContent.trim()) return;

        // Split by new lines for bulk add
        const titles = inputContent.split('\n').filter(t => t.trim().length > 0);

        if (titles.length === 0) return;

        if (titles.length === 1) {
            // Combine date and time into ISO string
            let dueDate = null;
            if (newTaskDueDate) {
                const dateTime = newTaskDueTime
                    ? `${newTaskDueDate}T${newTaskDueTime}:00`
                    : `${newTaskDueDate}T00:00:00`;
                dueDate = new Date(dateTime).toISOString();
            }

            const args: any = {
                title: titles[0].trim(),
                priority,
                recurrence
            };

            if (dueDate) {
                args.due_date = dueDate;
            }

            const res = await callMcpTool("add_todo", args);
            if (res) {
                addToast("Objective synchronized successfully. 🚀");
            }
        } else {
            const res = await callMcpTool("add_todos_bulk", {
                titles,
                priority,
                recurrence
            });
            if (res) {
                addToast(`Bulk Deployment: ${titles.length} objectives synchronized. 🚀`);
            }
        }

        setNewTaskTitle("");
        setNewTaskDueDate("");
        setNewTaskDueTime("");
        setNewTaskReminderTime("");
        setIsAddingTask(false);
    };

    const updateTaskDetails = async (id: string, updates: Partial<Task>) => {
        // We still use direct Supabase for description/title updates for speed,
        // but mission-critical status/timer changes should go through tools.
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
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (!session || sessionError) {
                setMessages((prev) => [...prev, {
                    role: "assistant",
                    content: "Your session has expired or is invalid. Please sign out and sign in again to re-establish a secure link! 🔐",
                    timestamp: new Date(),
                    id: (Date.now() + 1).toString()
                }]);
                setIsLoading(false);
                return;
            }

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const response = await fetch(`${apiUrl}/api/agent/dispatch`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ utterance: text })
            });

            if (response.status === 401) {
                setMessages((prev) => [...prev, {
                    role: "assistant",
                    content: "Security alert! The server didn't recognize your credentials. Try refreshing the page or logging back in. 🛡️",
                    timestamp: new Date(),
                    id: (Date.now() + 1).toString()
                }]);
                setIsLoading(false);
                return;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || "API call failed");
            }

            const data = await response.json();

            if (response.ok) {
                setMessages((prev) => [...prev, {
                    role: "assistant",
                    content: data.message,
                    timestamp: new Date(),
                    id: (Date.now() + 1).toString()
                }]);

                if (data.action === "create" && data.result?.task) {
                    // Sync priority and recurrence if available from response
                    fetchTasks();
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
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

        try {
            const response = await fetch(`${apiUrl}/api/agent/tool`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    name: "toggle_todo",
                    arguments: { task_id: id }
                })
            });

            if (response.ok) {
                const data = await response.json();
                addToast(data.result);
                fetchTasks();
            } else {
                throw new Error("Toggle failed");
            }
        } catch (error) {
            addToast("Failed to update objective in the neural net. 💾", "error");
        }
    };

    const deleteTask = async (id: string) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

        try {
            const response = await fetch(`${apiUrl}/api/agent/tool`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    name: "delete_todo",
                    arguments: { task_id: id }
                })
            });

            if (response.ok) {
                const data = await response.json();
                addToast(data.result, "info");
                fetchTasks();
            } else {
                throw new Error("Deletion failed");
            }
        } catch (error) {
            addToast("Failed to erase objective data. 🛡️", "error");
        }
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
                animate={{ x: sidebarOpen ? 0 : -320 }}
                className={cn(
                    "fixed inset-y-0 left-0 w-80 bg-[#1E293B]/80 backdrop-blur-2xl border-r border-white/5 z-50 transition-transform duration-500 flex flex-col shadow-2xl"
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
                        onClick={() => setIsAddingTask(true)}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-bold hover:bg-white/10 transition-all shadow-xl backdrop-blur-sm group"
                    >
                        <Plus size={20} className="text-indigo-400 group-hover:rotate-90 transition-transform duration-300" />
                        <span>New Task Session</span>
                    </motion.button>

                    <TaskStats tasks={tasks} />
                    <PriorityChart tasks={tasks} />

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
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 active:scale-95 transition-all cursor-pointer group relative">
                        <div className="relative">
                            <div className="w-11 h-11 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 ring-1 ring-white/30 font-bold overflow-hidden">
                                {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || "U"}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#1E293B] rounded-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-black text-white/90 truncate">
                                {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"}
                            </div>
                            <div className="text-[10px] font-bold text-indigo-400/80 uppercase tracking-widest truncate">
                                {user?.email}
                            </div>
                        </div>
                        <button
                            onClick={() => supabase.auth.signOut()}
                            className="p-2 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </motion.aside>

            {/* Toasts Overlay */}
            <div className="fixed top-8 right-8 z-[100] flex flex-col gap-3 pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, x: 20, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className={cn(
                                "pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border font-bold text-sm min-w-[280px]",
                                toast.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                                    toast.type === 'error' ? "bg-red-500/10 border-red-500/20 text-red-400" :
                                        "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                            )}
                        >
                            <div className={cn(
                                "w-2 h-2 rounded-full",
                                toast.type === 'success' ? "bg-emerald-500" :
                                    toast.type === 'error' ? "bg-red-500" :
                                        "bg-indigo-400"
                            )} />
                            {toast.message}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Main Container - Responsive Grid: Chat + Todo */}
            <div className={cn(
                "flex-1 grid grid-cols-1 lg:grid-cols-[1fr_450px] overflow-hidden relative z-10 transition-all duration-500",
                sidebarOpen && "lg:ml-80"
            )}>


                {/* Chat Interface - Center Column */}
                <section className="flex flex-col bg-[#1E293B]/40 backdrop-blur-3xl border-r border-white/5">
                    <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-white/[0.02]">
                        <h1 className="text-2xl font-black tracking-tighter text-white">
                            AI <span className="text-indigo-500">CHAT</span>
                        </h1>
                    </header>

                    <div className="flex-1 overflow-y-auto p-8 space-y-4">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                                <Bot size={64} className="text-indigo-500/20" />
                                <div>
                                    <h2 className="text-xl font-black text-white/90 mb-2">Welcome to AI Agentixz USA! 🇺🇸</h2>
                                    <p className="text-sm text-slate-400">I'm your elite AI operative. I can help you manage your objectives in English or Urdu.</p>
                                    <p className="text-sm text-slate-400 mt-2">What's our first mission?</p>
                                </div>
                            </div>
                        )}

                        <AnimatePresence mode="popLayout">
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className={cn(
                                        "flex gap-4 p-4 rounded-2xl",
                                        msg.role === "user"
                                            ? "bg-indigo-500/10 border border-indigo-500/20 ml-12"
                                            : "bg-white/5 border border-white/5 mr-12"
                                    )}
                                >
                                    {msg.role === "assistant" && (
                                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <Bot size={20} className="text-white" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <div className="text-sm text-white/90 whitespace-pre-wrap">{msg.content}</div>
                                        <div className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-widest">
                                            {msg.timestamp.toLocaleTimeString()}
                                        </div>
                                    </div>
                                    {msg.role === "user" && (
                                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <span className="text-white font-black text-sm">{user?.email?.charAt(0).toUpperCase()}</span>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {isLoading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 mr-12"
                            >
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Bot size={20} className="text-white animate-pulse" />
                                </div>
                                <div className="flex-1 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                            </motion.div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-6 border-t border-white/5 bg-white/[0.02]">
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
                                placeholder="Type your mission objective..."
                                disabled={isLoading}
                                className="flex-1 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                            />
                            <VoiceControl onTranscript={handleTranscript} />
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => sendMessage(input)}
                                disabled={isLoading || !input.trim()}
                                className="px-8 py-4 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20"
                            >
                                Send
                            </motion.button>
                        </div>
                    </div>
                </section>

                {/* Task Board - Right Column */}
                <section className="flex flex-col bg-[#1E293B]/60 lg:bg-[#1E293B]/40 backdrop-blur-3xl min-h-[50vh] lg:min-h-0 border-t lg:border-t-0 lg:border-l border-white/5">
                    <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-white/[0.02] flex-shrink-0">
                        <div className="flex items-center gap-6">
                            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/80">
                                <Menu size={24} />
                            </button>
                            <h1 className="text-2xl font-black tracking-tighter text-white">
                                TODO <span className="text-indigo-500">APP</span>
                            </h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search objectives..."
                                    className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <motion.button
                                onClick={() => setIsAddingTask(!isAddingTask)}
                                className={cn("flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all",
                                    isAddingTask ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "bg-white/5 hover:bg-white/10 text-white"
                                )}
                            >
                                <Plus size={18} />
                                New Task
                            </motion.button>
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-scroll p-4 sm:p-8 space-y-4">
                        <AnimatePresence>
                            {isAddingTask && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl space-y-4">
                                    <textarea
                                        autoFocus
                                        value={newTaskTitle}
                                        onChange={(e) => setNewTaskTitle(e.target.value)}
                                        placeholder="Task title (Shift+Enter for multiple tasks)..."
                                        className="w-full bg-transparent border-none focus:ring-0 text-white font-bold resize-none h-20 placeholder:text-slate-500"
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Priority</label>
                                            <select
                                                value={newTaskPriority}
                                                onChange={(e) => setNewTaskPriority(e.target.value as any)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            >
                                                <option className="bg-[#1E293B]" value="low">LOW</option>
                                                <option className="bg-[#1E293B]" value="medium">MEDIUM</option>
                                                <option className="bg-[#1E293B]" value="high">HIGH</option>
                                                <option className="bg-[#1E293B]" value="urgent">URGENT</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Recurrence</label>
                                            <select
                                                value={newTaskRecurrence}
                                                onChange={(e) => setNewTaskRecurrence(e.target.value as any)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            >
                                                <option className="bg-[#1E293B]" value="none">NONE</option>
                                                <option className="bg-[#1E293B]" value="daily">DAILY</option>
                                                <option className="bg-[#1E293B]" value="weekly">WEEKLY</option>
                                                <option className="bg-[#1E293B]" value="monthly">MONTHLY</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Due Date</label>
                                            <input
                                                type="date"
                                                value={newTaskDueDate}
                                                onChange={(e) => setNewTaskDueDate(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Due Time</label>
                                            <input
                                                type="time"
                                                value={newTaskDueTime}
                                                onChange={(e) => setNewTaskDueTime(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Reminder/Alarm Time</label>
                                        <input
                                            type="datetime-local"
                                            value={newTaskReminderTime}
                                            onChange={(e) => setNewTaskReminderTime(e.target.value)}
                                            placeholder="Set reminder notification time"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder:text-slate-500"
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={() => handleAddTask(newTaskTitle, newTaskPriority, newTaskRecurrence)}
                                            className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20"
                                        >
                                            Add Task
                                        </button>
                                        <button
                                            onClick={() => { setIsAddingTask(false); setNewTaskTitle(""); setNewTaskPriority("medium"); setNewTaskRecurrence("none"); setNewTaskDueDate(""); setNewTaskDueTime(""); setNewTaskReminderTime(""); }}
                                            className="px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence mode="popLayout">
                            {tasks
                                .filter(t => searchQuery === "" || t.title.toLowerCase().includes(searchQuery.toLowerCase()))
                                .map((task) => (
                                    <motion.div
                                        key={task.id}
                                        layout
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        onClick={() => setSelectedTask(task)}
                                        className={cn("group flex items-center gap-4 p-5 rounded-[1.5rem] border border-white/5 bg-white/5 hover:bg-white/[0.08] transition-all cursor-pointer")}
                                    >
                                        <button onClick={(e) => { e.stopPropagation(); toggleTask(task.id, task.status); }} className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors", task.status === "completed" ? "bg-emerald-500 border-emerald-500" : "border-slate-600 group-hover:border-indigo-500")}>
                                            {task.status === "completed" && <CheckCircle2 size={14} />}
                                        </button>
                                        <div className="flex-1 flex flex-col gap-0.5">
                                            <div className="flex items-center gap-2">
                                                <span className={cn("font-bold text-sm", task.status === "completed" && "line-through opacity-50")}>{task.title}</span>
                                                {task.priority && task.priority !== 'medium' && (
                                                    <span className={cn("text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest", task.priority === 'urgent' ? "bg-red-500/20 text-red-400" : task.priority === 'high' ? "bg-amber-500/20 text-amber-400" : "bg-slate-500/20 text-slate-400")}>{task.priority}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 flex-wrap">
                                                {task.recurrence && task.recurrence !== 'none' && (
                                                    <div className="flex items-center gap-1 text-[9px] font-bold text-indigo-400/60 uppercase tracking-widest"><Repeat size={10} /> {task.recurrence}</div>
                                                )}
                                                {task.due_date && (
                                                    <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-400/60 uppercase tracking-widest">
                                                        <Calendar size={10} />
                                                        {new Date(task.due_date).toLocaleDateString()}
                                                        <Clock size={10} className="ml-1" />
                                                        {new Date(task.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }} className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 transition-all"><Trash2 size={16} /></button>
                                    </motion.div>
                                ))}
                        </AnimatePresence>
                    </div>

                    <div className="p-8 border-t border-white/5 flex flex-col gap-4">
                        <div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-widest text-slate-500">MISSION EFFICIENCY</span><span className="text-xs font-black text-indigo-400">{tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0}%</span></div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${(tasks.filter(t => t.status === 'completed').length / (tasks.length || 1)) * 100}%` }} className="h-full bg-indigo-500" /></div>
                    </div>

                    {/* Task Detail Panel */}
                    <AnimatePresence>
                        {selectedTask && (
                            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="absolute inset-0 bg-[#0F172A] z-[60] flex flex-col border-l border-white/10 shadow-2xl">
                                <header className="h-20 border-b border-white/5 flex items-center justify-between px-8">
                                    <button onClick={() => setSelectedTask(null)} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 transition-colors"><X size={20} /></button>
                                    <span className="text-xs font-black uppercase tracking-widest text-indigo-400">Tactical Intelligence</span>
                                </header>
                                <div className="p-8 space-y-8 flex-1 overflow-y-auto">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">OBJECTIVE</label>
                                        <input type="text" value={selectedTask.title} onChange={(e) => updateTaskDetails(selectedTask.id, { title: e.target.value })} className="w-full bg-transparent border-none focus:ring-0 text-2xl font-black p-0 uppercase" />
                                    </div>

                                    <TaskTimer task={selectedTask} onUpdate={updateTaskDetails} callMcpTool={callMcpTool} />

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5"><div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Priority</div><select value={selectedTask.priority || 'medium'} onChange={(e) => updateTaskDetails(selectedTask.id, { priority: e.target.value as any })} className="bg-transparent border-none focus:ring-0 text-xs font-bold p-0 uppercase block w-full"><option className="bg-[#1E293B]" value="low">LOW</option><option className="bg-[#1E293B]" value="medium">MEDIUM</option><option className="bg-[#1E293B]" value="high">HIGH</option><option className="bg-[#1E293B]" value="urgent">URGENT</option></select></div>
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5"><div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Repeat</div><select value={selectedTask.recurrence || 'none'} onChange={(e) => updateTaskDetails(selectedTask.id, { recurrence: e.target.value as any })} className="bg-transparent border-none focus:ring-0 text-xs font-bold p-0 uppercase block w-full"><option className="bg-[#1E293B]" value="none">NONE</option><option className="bg-[#1E293B]" value="daily">DAILY</option><option className="bg-[#1E293B]" value="weekly">WEEKLY</option><option className="bg-[#1E293B]" value="monthly">MONTHLY</option></select></div>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Due Date & Time</div>
                                        <input
                                            type="datetime-local"
                                            value={selectedTask.due_date ? new Date(selectedTask.due_date).toISOString().slice(0, 16) : ''}
                                            onChange={(e) => updateTaskDetails(selectedTask.id, { due_date: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                                            className="bg-transparent border border-white/10 focus:ring-2 focus:ring-indigo-500 text-xs font-bold p-2 rounded-lg block w-full"
                                        />
                                    </div>
                                    <div className="space-y-2"><div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Description</div><textarea value={selectedTask.description || ''} onChange={(e) => updateTaskDetails(selectedTask.id, { description: e.target.value })} placeholder="Tactical context..." className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm italic resize-none h-40" /></div>
                                </div>
                                <div className="p-8 border-t border-white/5"><button onClick={() => { toggleTask(selectedTask.id, selectedTask.status); setSelectedTask(null); }} className={cn("w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest", selectedTask.status === 'completed' ? "bg-slate-700 text-slate-400" : "bg-indigo-600 text-white shadow-xl shadow-indigo-500/20")}>{selectedTask.status === 'completed' ? "Re-activate Objective" : "Mark Objective Complete"}</button></div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>
            </div>
        </div>
    );
}
