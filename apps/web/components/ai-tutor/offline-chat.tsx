/*
 Offline AI Tutor Chat Component
 100% Local LLM - No API Keys Required
*/

"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getStoredUser } from "@/lib/auth";
import VoiceAssistant from "./voice-assistant";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

type TutorMode = "general" | "explain" | "debug" | "practice";

export function OfflineAITutorChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Welcome to PyPilot! 👋 I'm your offline Python tutor. I run 100% locally with no API keys needed!\n\nWhat would you like to learn about?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<TutorMode>("general");
  const [tutorStatus, setTutorStatus] = useState<string>("Checking...");
  const [isSignedIn, setIsSignedIn] = useState<boolean>(Boolean(getStoredUser()));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const STORAGE_KEY = "offline_ai_tutor_messages_v1";

  // Load saved conversation from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch (e) {
      // ignore parse errors
    }
  }, []);

  // Persist conversation to localStorage whenever messages change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      // ignore storage errors (e.g., quota)
    }
  }, [messages]);

  // Check tutor status on mount
  useEffect(() => {
    checkTutorStatus();
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const resp = await fetch("/api/auth/session", { credentials: "include" });
        setIsSignedIn(resp.ok);
      } catch {
        setIsSignedIn(Boolean(getStoredUser()));
      }
    };
    void checkSession();
  }, []);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const checkTutorStatus = async () => {
    try {
      const response = await fetch("/api/ai-tutor/status");
      const data = await response.json();
      setTutorStatus(data.status === "online" ? "🟢 Online (Offline Mode)" : "🔴 Offline");
    } catch (error) {
      setTutorStatus("🔴 Not Available");
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    // Add user message
    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };
    const messageToSend = input; // Store the message before clearing input
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Use streaming endpoint for real-time responses
      const response = await fetch("/api/ai-tutor/chat-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: messageToSend, mode: mode }),
      });

      if (!response.ok) {
        const text = await response.text();
        if (response.status === 401) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "Authentication required. Please log in to use personalized features, or continue anonymously.",
              timestamp: new Date().toISOString(),
            },
          ]);
          setLoading(false);
          return;
        }

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `API Error: ${response.status} ${text}`,
            timestamp: new Date().toISOString(),
          },
        ]);
        setLoading(false);
        return;
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage: Message = {
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      };

      // Add empty assistant message to show it's loading
      setMessages((prev) => [...prev, assistantMessage]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          assistantMessage.content += chunk;

          // Update the last message (assistant's response) with new chunk
          setMessages((prev) => {
            const updated = [...prev];
            if (updated.length > 0 && updated[updated.length - 1].role === "assistant") {
              updated[updated.length - 1] = { ...assistantMessage };
            }
            return updated;
          });
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : "Unknown error"}. Make sure Ollama is running.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      const resp = await fetch("/api/ai-tutor/clear-history", {
        method: "POST",
        credentials: "include",
      });

      if (!resp.ok) {
        if (resp.status === 401) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "Authentication required to clear history. Please log in.",
              timestamp: new Date().toISOString(),
            },
          ]);
          return;
        }
      }
      const welcome = {
        id: "welcome",
        role: "assistant",
        content: "Welcome back! Chat history cleared. What would you like to learn?",
        timestamp: new Date().toISOString(),
      } as Message;
      setMessages([welcome]);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        // ignore
      }
    } catch (error) {
      console.error("Error clearing history:", error);
    }
  };

  function parseMessageParts(content: string) {
    const parts: Array<{ type: "text" | "code"; content: string }> = [];
    const regex = /```(?:[a-zA-Z0-9_+-]*)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: "text", content: content.slice(lastIndex, match.index) });
      }
      parts.push({ type: "code", content: match[1] });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < content.length) {
      parts.push({ type: "text", content: content.slice(lastIndex) });
    }

    return parts;
  }

  function CodeBlock({ code }: { code: string }) {
    return (
      <div className="relative my-3">
        <pre className="bg-slate-800 text-white rounded-md p-3 overflow-auto text-sm">
          <code>{code}</code>
        </pre>
        <button
          onClick={() => navigator.clipboard.writeText(code)}
          className="absolute right-2 top-2 bg-white/10 text-white px-2 py-1 rounded text-xs hover:bg-white/20"
        >
          Copy
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Offline AI Tutor</h1>
            <p className="text-sm text-slate-600 mt-1">{tutorStatus}</p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-2 items-center">
          {(["general", "explain", "debug", "practice"] as TutorMode[]).map((m) => (
            <Button
              key={m}
              onClick={() => setMode(m)}
              className={`capitalize ${mode === m ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-900"}`}
            >
              {m === "general" ? "💬 Chat" : m === "explain" ? "📚 Explain" : m === "debug" ? "🐛 Debug" : "✍️ Practice"}
            </Button>
          ))}

          {/* Login prompt */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-slate-500">Signed in:</span>
            <span className="text-sm font-medium text-slate-700">{isSignedIn ? "Yes" : "No"}</span>
            {!isSignedIn && (
              <Button
                onClick={() => window.location.href = '/login'}
                className="text-xs px-3 bg-emerald-500 text-white"
              >
                Log in
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <Card className="h-96 mb-4 p-4 bg-white overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg, idx) => {
            const parts = parseMessageParts(msg.content);
            const hasCode = parts.some((p) => p.type === "code");

            return (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs lg:max-w-md ${msg.role === "user" ? "" : ""}`}>
                  {/* If assistant message contains both text and code, render text in a normal assistant bubble and code blocks in separate boxes below */}
                  {msg.role === "assistant" && hasCode ? (
                    <>
                      {/* render text parts in assistant-style bubble */}
                      {parts.filter((p) => p.type === "text").map((p, i) => (
                        <div
                          key={`text-${idx}-${i}`}
                          className={`px-4 py-2 rounded-lg bg-slate-200 text-slate-900 rounded-bl-none text-sm whitespace-pre-wrap break-words mb-2`}
                        >
                          {p.content}
                        </div>
                      ))}

                      {/* render each code block as its own separate box */}
                      {parts.filter((p) => p.type === "code").map((p, i) => (
                        <div key={`code-${idx}-${i}`} className="w-full">
                          <CodeBlock code={p.content} />
                        </div>
                      ))}

                      {msg.timestamp && (
                        <p className="text-xs mt-1 opacity-70">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      )}
                    </>
                  ) : (
                    // Default single-bubble rendering for user messages or assistant messages without code
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${msg.role === "user"
                          ? "bg-blue-500 text-white rounded-br-none"
                          : "bg-slate-200 text-slate-900 rounded-bl-none"
                        }`}
                    >
                      <div className="text-sm white-space-pre-wrap break-words">{
                        // If there are parts (maybe no code), join them as text
                        parts.map((p, i) => (
                          <React.Fragment key={i}>{p.content}</React.Fragment>
                        ))
                      }</div>
                      {msg.timestamp && (
                        <p className="text-xs mt-1 opacity-70">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-200 text-slate-900 px-4 py-2 rounded-lg rounded-bl-none">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </Card>

      {/* Input Area */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex items-center">
            <VoiceAssistant onTranscript={(text) => { setInput(text); sendMessage(); }} />
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask me anything about Python..."
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <Button onClick={sendMessage} disabled={loading || !input.trim()} className="px-6 bg-blue-600 text-white hover:bg-blue-700">
            {loading ? "..." : "Send"}
          </Button>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-between text-sm">
          <Button onClick={clearHistory} className="px-4 bg-slate-400 text-white hover:bg-slate-500">
            Clear History
          </Button>
          <div className="text-xs text-slate-500">
            💡 Tip: Use Explain, Debug, or Practice modes for specific help
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-slate-700">
        <strong>ℹ️ About:</strong> This AI tutor runs 100% offline using Mistral 7B. No API keys, no internet required
        after initial setup. Responses are processed locally on your computer for complete privacy.
      </div>
    </div>
  );
}

export default OfflineAITutorChat;
