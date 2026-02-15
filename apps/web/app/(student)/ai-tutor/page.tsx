"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Trash2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AITutorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm your Python AI Tutor. I can help you learn Python, debug code, explain concepts, or answer any programming questions. What would you like to learn today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("https://api.poe.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer A__c0aKjBgQBDLQf4_NqiGhvUNdsAhILIFM69MrzGR0",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a helpful Python programming tutor. Explain concepts clearly, provide code examples when helpful, and encourage learning. Format code blocks with ```python for syntax highlighting."
            },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: input }
          ],
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.choices[0].message.content,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Chat cleared! What would you like to learn about Python?",
        timestamp: new Date(),
      },
    ]);
  };

  const parseMessageContent = (content: string) => {
    const parts: Array<{ type: "text" | "code"; content: string; language?: string }> = [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: content.slice(lastIndex, match.index),
        });
      }
      parts.push({
        type: "code",
        content: match[2],
        language: match[1] || "python",
      });
      lastIndex = codeBlockRegex.lastIndex;
    }

    if (lastIndex < content.length) {
      parts.push({
        type: "text",
        content: content.slice(lastIndex),
      });
    }

    return parts.length > 0 ? parts : [{ type: "text" as const, content }];
  };

  return (
    <div className="flex h-[calc(100vh-100px)] flex-col p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Sparkles className="text-purple-400" size={32} />
            AI Python Tutor
          </h1>
          <p className="text-slate-400 mt-1">Your personal AI assistant for learning Python</p>
        </div>
        <button
          onClick={clearChat}
          className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm text-slate-400 hover:bg-white/10 border border-white/10 transition-colors"
        >
          <Trash2 size={16} />
          Clear Chat
        </button>
      </div>

      {/* Chat Container */}
      <div className="flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-6 mb-4">
        <div className="space-y-6">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-6 py-4 ${message.role === "user"
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                      : "bg-white/10 text-slate-100"
                    }`}
                >
                  {parseMessageContent(message.content).map((part, idx) => (
                    <div key={idx}>
                      {part.type === "text" ? (
                        <p className="whitespace-pre-wrap leading-relaxed">{part.content}</p>
                      ) : (
                        <div className="my-3 relative">
                          <div className="absolute top-2 right-2">
                            <button
                              onClick={() => navigator.clipboard.writeText(part.content)}
                              className="rounded bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20"
                            >
                              Copy
                            </button>
                          </div>
                          <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm">
                            <code className="text-green-400">{part.content}</code>
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                  <p className="mt-2 text-xs opacity-60">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="rounded-2xl bg-white/10 px-6 py-4">
                <div className="flex gap-2">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400"></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "0.1s" }}></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "0.2s" }}></div>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Ask me anything about Python..."
          disabled={loading}
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none disabled:opacity-50"
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-4 font-bold text-white hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Send size={20} />
        </button>
      </div>

      {/* Quick Prompts */}
      <div className="mt-4 flex flex-wrap gap-2">
        {[
          "Explain variables in Python",
          "How do I use loops?",
          "What are functions?",
          "Debug my code",
        ].map((prompt) => (
          <button
            key={prompt}
            onClick={() => setInput(prompt)}
            className="rounded-full bg-white/5 px-4 py-2 text-sm text-slate-400 hover:bg-white/10 border border-white/10 transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
