"use client";

import { useState } from "react";
import { Send, User } from "lucide-react";

interface Message {
    id: number;
    user: string;
    avatar?: string;
    text: string;
    time: string;
    isMe: boolean;
}

const initialMessages: Message[] = [];

export function ChatInterface() {
    const [messages, setMessages] = useState(initialMessages);
    const [input, setInput] = useState("");

    const handleSend = () => {
        if (!input.trim()) return;

        const newMessage: Message = {
            id: Date.now(),
            user: "You",
            text: input,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMe: true,
        };

        setMessages([...messages, newMessage]);
        setInput("");
    };

    return (
        <div className="flex min-h-[430px] h-full flex-col overflow-hidden rounded-2xl border border-white/5 bg-white/5 sm:min-h-[520px]">
            {/* Chat Header */}
            <div className="border-b border-white/5 bg-white/5 px-4 py-3">
                <h3 className="font-bold text-white">Squad Chat</h3>
                <p className="text-xs text-slate-400">Select a squad to start chatting</p>
            </div>

            {/* Messages Area */}
            <div className="flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/10">
                {messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                        <div className="text-center">
                            <p className="text-slate-400">No messages yet</p>
                            <p className="mt-2 text-sm text-slate-500">
                                Be the first to send a message!
                            </p>
                        </div>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`flex max-w-[90%] gap-3 sm:max-w-[80%] ${msg.isMe ? "flex-row-reverse" : "flex-row"}`}>
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-python-blue to-purple-500 text-xs font-bold text-white">
                                    {msg.user[0]}
                                </div>

                                <div>
                                    <div className={`flex items-baseline gap-2 mb-1 ${msg.isMe ? "justify-end" : "justify-start"}`}>
                                        <span className="text-xs font-bold text-slate-300">{msg.user}</span>
                                        <span className="text-[10px] text-slate-500">{msg.time}</span>
                                    </div>
                                    <div className={`rounded-2xl px-4 py-2 text-sm ${msg.isMe
                                        ? "bg-python-blue text-white rounded-tr-none"
                                        : "bg-white/10 text-slate-200 rounded-tl-none"
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Input Area */}
            <div className="border-t border-white/5 bg-black/20 p-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        placeholder="Type a message..."
                        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-python-blue focus:outline-none placeholder-slate-500"
                    />
                    <button
                        onClick={handleSend}
                        className="rounded-xl bg-python-blue p-2 text-white hover:bg-python-blue-light transition-colors"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
