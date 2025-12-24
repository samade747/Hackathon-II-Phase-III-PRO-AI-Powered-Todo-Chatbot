#!/usr/bin/env python3
"""Script to add chat interface to the page.tsx file"""

# Read the file
with open(r"d:\github\Hackathon-II-Phase-III-PRO-AI-Powered-Todo-Chatbot\frontend\src\app\chat\page.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Find the line with "Task Board - Full Width" comment (around line 657)
insert_index = None
for i, line in enumerate(lines):
    if "{/* Task Board - Full Width */}" in line or "{/* Task Board - Right Column */}" in line:
        insert_index = i
        break

if insert_index is None:
    print("Could not find insertion point!")
    exit(1)

# Chat interface code to insert
chat_interface = '''
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

'''

# Update the comment on the task board line
lines[insert_index] = lines[insert_index].replace("Task Board - Full Width", "Task Board - Right Column")

# Insert the chat interface before the task board
lines.insert(insert_index, chat_interface)

# Write back
with open(r"d:\github\Hackathon-II-Phase-III-PRO-AI-Powered-Todo-Chatbot\frontend\src\app\chat\page.tsx", "w", encoding="utf-8") as f:
    f.writelines(lines)

print("✅ Chat interface added successfully!")
print(f"Inserted at line {insert_index}")
