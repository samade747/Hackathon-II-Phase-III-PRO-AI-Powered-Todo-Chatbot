"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, User, Bot, Plus, Trash2, CheckCircle2, MoreVertical, Menu, X, Bell, Calendar, Clock, Flag, Repeat } from "lucide-react";
import dynamic from "next/dynamic";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const VoiceControl = dynamic(() => import("@/components/VoiceControl"), {
    ssr: false,
    loading: () => (
        <div className="w-11 h-11 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 shadow-sm">
            <Mic size={20} />
        </div>
    )
});

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

    // Alarm State
    const [activeAlarm, setActiveAlarm] = useState<any>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Task Modal State
    const [taskModalOpen, setTaskModalOpen] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskDate, setNewTaskDate] = useState("");
    const [newTaskPriority, setNewTaskPriority] = useState("medium");
    const [newTaskRecurrence, setNewTaskRecurrence] = useState("none");

    // Initialize Audio
    useEffect(() => {
        audioRef.current = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
        audioRef.current.loop = true;
    }, []);

    const stopAlarm = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setActiveAlarm(null);
    };

    const snoozeAlarm = async () => {
        if (!activeAlarm) return;
        stopAlarm();
        sendMessage(`Remind me to ${activeAlarm.title} in 5 minutes`);
    };

    const handleCreateTask = () => {
        if (!newTaskTitle.trim()) return;

        let command = `Add task ${newTaskTitle}`;
        // Explicitly add priority and recurrence to the natural language command
        if (newTaskPriority !== "medium") command += ` priority ${newTaskPriority}`;
        if (newTaskRecurrence !== "none") command += ` recurrence ${newTaskRecurrence}`;
        if (newTaskDate) command += ` due ${newTaskDate}`;

        sendMessage(command);

        // Reset Form
        setTaskModalOpen(false);
        setNewTaskTitle("");
        setNewTaskDate("");
        setNewTaskPriority("medium");
        setNewTaskRecurrence("none");
    };

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
                    const historyMessages: Message[] = [];
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
                                timestamp: new Date(item.timestamp || item.created_at)
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

        if ("Notification" in window) {
            Notification.requestPermission();
        }

        const interval = setInterval(() => {
            const now = new Date();
            tasks.forEach(task => {
                if (task.due_date && task.status === 'pending') {
                    const due = new Date(task.due_date);
                    const diff = now.getTime() - due.getTime();
                    // Trigger if due within last 60s AND not active
                    if (diff >= 0 && diff < 60000 && (!activeAlarm || activeAlarm.id !== task.id)) {
                        setActiveAlarm(task);
                        if (audioRef.current) {
                            audioRef.current.play().catch(e => console.log("Audio needed interaction"));
                        }
                        if (Notification.permission === "granted") {
                            new Notification(`⏰ Alarm: ${task.title}`);
                        }
                    }
                }
            });
        }, 30000);

        return () => clearInterval(interval);
    }, [tasks, activeAlarm]);

    const toggleTask = async (taskId: string) => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
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
            fetchTasks();
        } catch (error) {
            console.error("Failed to toggle task", error);
            fetchTasks();
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
        <div className="flex h-[100dvh] bg-slate-50 overflow-hidden font-sans">
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
                    "fixed inset-y-0 left-0 w-72 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 z-50 lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none",
                    !sidebarOpen && "translate-x-[-100%] lg:translate-x-0"
                )}
            >
                <div className="p-6 border-b border-slate-100/60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-bold shadow-indigo-200 shadow-md">A</div>
                        <span className="font-bold text-slate-800 text-lg tracking-tight">Agentixz</span>
                    </div>
                    {/* Add Task Button (Mobile Close) */}
                    <div className="flex items-center gap-1">
                        <button onClick={() => setTaskModalOpen(true)} className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors shadow-sm">
                            <Plus size={20} />
                        </button>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-4 flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                    {/* New Chat Button */}
                    <button
                        onClick={() => setMessages([])}
                        className="w-full flex items-center gap-3 px-4 py-3.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200/50 hover:shadow-indigo-200 mb-6 group"
                    >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                        <span>New Chat</span>
                    </button>

                    <div className="flex items-center justify-between px-2 mb-2">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recent Tasks</div>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">{tasks.length}</span>
                    </div>

                    {tasks.length === 0 ? (
                        <div className="px-4 py-8 text-sm text-slate-400 text-center italic border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                            No pending tasks.<br />"Add task..." via voice!
                        </div>
                    ) : (
                        tasks.map((task, i) => (
                            <button
                                key={task.id || i}
                                onClick={() => toggleTask(task.id)}
                                className="w-full text-left px-4 py-3.5 rounded-xl text-slate-600 hover:bg-white hover:text-slate-900 transition-all text-sm truncate flex items-start gap-3 border border-transparent hover:border-slate-100 hover:shadow-sm group"
                            >
                                <CheckCircle2 size={18} className={cn("flex-shrink-0 transition-colors mt-0.5", task.status === 'completed' ? "text-emerald-500" : "text-slate-300 group-hover:text-indigo-400")} />
                                <div className="flex-1 min-w-0">
                                    <div className={cn("font-medium truncate transition-all", task.status === 'completed' && "line-through opacity-50 text-slate-400")}>{task.title}</div>
                                    <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2 mt-1">
                                        <span className={cn("capitalize px-1.5 py-0.5 rounded-md bg-slate-50",
                                            task.priority === 'urgent' ? "text-rose-600 bg-rose-50" :
                                                task.priority === 'high' ? "text-orange-600 bg-orange-50" :
                                                    "text-slate-500")}>
                                            {task.priority}
                                        </span>
                                        {task.recurrence !== 'none' && <span className="text-indigo-500">• {task.recurrence}</span>}
                                    </div>
                                    {task.due_date && (
                                        <div className="text-[10px] text-indigo-600 font-semibold mt-1 flex items-center gap-1.5 bg-indigo-50 px-2 py-1 rounded-md w-fit border border-indigo-100/50">
                                            <Bell size={10} className="fill-indigo-600 animate-pulse-slow" />
                                            <span>{new Date(task.due_date).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))
                    )}
                </div>

                <div className="p-4 border-t border-slate-100/60 bg-white/50">
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white hover:shadow-sm cursor-pointer transition-all border border-transparent hover:border-slate-100">
                        <div className="w-10 h-10 bg-gradient-to-tr from-slate-200 to-slate-300 rounded-full flex items-center justify-center text-slate-600 shadow-inner ring-2 ring-white">
                            <User size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-slate-800 truncate">John Doe</div>
                            <div className="text-xs text-slate-500 truncate font-medium">Pro Member</div>
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

                    {/* Navbar Alarm Icon */}
                    <div className="relative p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer">
                        <Bell className={cn("text-slate-400 transition-all", activeAlarm && "text-rose-500 animate-[bounce_1s_infinite]")} size={24} />
                        {tasks.filter(t => t.due_date && t.status === 'pending').length > 0 && (
                            <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold shadow-sm ring-2 ring-white">
                                {tasks.filter(t => t.due_date && t.status === 'pending').length}
                            </span>
                        )}
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

                {/* Alarm Overlay */}
                <AnimatePresence>
                    {activeAlarm && (
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="fixed bottom-0 inset-x-0 z-[60] bg-white border-t border-rose-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] p-6 pb-safe"
                        >
                            <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 animate-pulse">
                                        <Bell size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-lg">Alarm Ringing!</h3>
                                        <p className="text-slate-500 text-sm">Task: {activeAlarm.title}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={snoozeAlarm}
                                        className="px-6 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                                    >
                                        Snooze 5m
                                    </button>
                                    <button
                                        onClick={stopAlarm}
                                        className="px-6 py-2.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-200 transition-colors"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Task Creation Modal */}
                <AnimatePresence>
                    {taskModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setTaskModalOpen(false)}
                                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto scrollbar-none"
                            >
                                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <Plus className="bg-indigo-100 text-indigo-600 p-1 rounded-lg" size={28} />
                                    New Task
                                </h2>

                                <div className="space-y-6">
                                    {/* Title */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">What needs to be done?</label>
                                        <input
                                            autoFocus
                                            value={newTaskTitle}
                                            onChange={(e) => setNewTaskTitle(e.target.value)}
                                            placeholder="e.g. Call Mom, Buy Milk..."
                                            className="w-full text-lg font-medium border-b-2 border-slate-100 focus:border-indigo-500 outline-none py-2 transition-colors placeholder:text-slate-300"
                                        />
                                    </div>

                                    {/* Priority */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block flex items-center gap-1">
                                            <Flag size={12} /> Priority
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {['low', 'medium', 'high', 'urgent'].map((p) => (
                                                <button
                                                    key={p}
                                                    onClick={() => setNewTaskPriority(p)}
                                                    className={cn(
                                                        "px-3 py-1.5 border rounded-lg text-xs font-semibold capitalize transition-all",
                                                        newTaskPriority === p
                                                            ? (p === 'urgent' ? "bg-rose-100 text-rose-700 border-rose-200" :
                                                                p === 'high' ? "bg-orange-100 text-orange-700 border-orange-200" :
                                                                    p === 'medium' ? "bg-blue-100 text-blue-700 border-blue-200" :
                                                                        "bg-slate-100 text-slate-700 border-slate-200")
                                                            : "bg-white text-slate-500 border-slate-100 hover:bg-slate-50"
                                                    )}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Recurrence */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block flex items-center gap-1">
                                            <Repeat size={12} /> Recurrence
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {['none', 'daily', 'weekly', 'monthly'].map((r) => (
                                                <button
                                                    key={r}
                                                    onClick={() => setNewTaskRecurrence(r)}
                                                    className={cn(
                                                        "px-3 py-1.5 border rounded-lg text-xs font-semibold capitalize transition-all",
                                                        newTaskRecurrence === r
                                                            ? "bg-indigo-100 text-indigo-700 border-indigo-200"
                                                            : "bg-white text-slate-500 border-slate-100 hover:bg-slate-50"
                                                    )}
                                                >
                                                    {r}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Timer/Date */}
                                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block flex items-center gap-1">
                                            <Clock size={12} /> Due Date & Time
                                        </label>

                                        {/* Chips */}
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {[
                                                { label: '+15m', val: 15 },
                                                { label: '+30m', val: 30 },
                                                { label: '+1h', val: 60 },
                                                { label: 'Tmrw', val: 1440 }
                                            ].map((opt) => (
                                                <button
                                                    key={opt.label}
                                                    onClick={() => {
                                                        const d = new Date(new Date().getTime() + opt.val * 60000);
                                                        setNewTaskDate(d.toISOString());
                                                    }}
                                                    className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200/60 rounded-lg text-xs font-semibold text-slate-600 transition-all active:scale-95 shadow-sm"
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Picker */}
                                        <input
                                            type="datetime-local"
                                            value={newTaskDate ? new Date(newTaskDate).toISOString().slice(0, 16) : ""}
                                            className="w-full p-2.5 bg-white rounded-xl text-sm font-medium text-slate-600 outline-none focus:ring-2 focus:ring-indigo-100 border border-slate-200/60"
                                            onChange={(e) => setNewTaskDate(new Date(e.target.value).toISOString())}
                                        />
                                        {newTaskDate && (
                                            <div className="mt-2 text-[11px] text-indigo-600 font-medium text-right">
                                                Selected: {new Date(newTaskDate).toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-8 flex items-center gap-3">
                                    <button
                                        onClick={() => setTaskModalOpen(false)}
                                        className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreateTask}
                                        disabled={!newTaskTitle.trim()}
                                        className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:grayscale transition-all"
                                    >
                                        Create Task
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
