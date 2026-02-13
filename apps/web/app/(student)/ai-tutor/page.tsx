"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  MessageSquarePlus,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  languageCode?: string;
}

interface ChatThread {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

interface LanguageOption {
  code: string;
  label: string;
  recognitionCode: string;
  speechCode: string;
  promptName: string;
}

type BrowserSpeechRecognitionResult = {
  isFinal: boolean;
  0?: {
    transcript?: string;
  };
};

type BrowserSpeechRecognitionEvent = {
  resultIndex: number;
  results: ArrayLike<BrowserSpeechRecognitionResult>;
};

type BrowserSpeechRecognitionErrorEvent = {
  error?: string;
  message?: string;
};

interface BrowserSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  }
}

const STORAGE_KEY = "pypilot_ai_tutor_threads_v1";
const ACTIVE_THREAD_KEY = "pypilot_ai_tutor_active_thread_v1";

const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    code: "auto",
    label: "Auto detect",
    recognitionCode: "en-US",
    speechCode: "en-US",
    promptName: "the same language used by the user",
  },
  {
    code: "en-US",
    label: "English",
    recognitionCode: "en-US",
    speechCode: "en-US",
    promptName: "English",
  },
  {
    code: "hi-IN",
    label: "Hindi",
    recognitionCode: "hi-IN",
    speechCode: "hi-IN",
    promptName: "Hindi",
  },
  {
    code: "gu-IN",
    label: "Gujarati",
    recognitionCode: "gu-IN",
    speechCode: "gu-IN",
    promptName: "Gujarati",
  },
  {
    code: "es-ES",
    label: "Spanish",
    recognitionCode: "es-ES",
    speechCode: "es-ES",
    promptName: "Spanish",
  },
  {
    code: "fr-FR",
    label: "French",
    recognitionCode: "fr-FR",
    speechCode: "fr-FR",
    promptName: "French",
  },
  {
    code: "ur-PK",
    label: "Urdu",
    recognitionCode: "ur-PK",
    speechCode: "ur-PK",
    promptName: "Urdu",
  },
  {
    code: "mr-IN",
    label: "Marathi",
    recognitionCode: "mr-IN",
    speechCode: "mr-IN",
    promptName: "Marathi",
  },
  {
    code: "te-IN",
    label: "Telugu",
    recognitionCode: "te-IN",
    speechCode: "te-IN",
    promptName: "Telugu",
  },
];

const LANGUAGE_BY_CODE = new Map(LANGUAGE_OPTIONS.map((option) => [option.code, option]));
const DEFAULT_LANGUAGE = LANGUAGE_BY_CODE.get("en-US") as LanguageOption;

function makeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function buildWelcomeMessage(content?: string): Message {
  return {
    id: makeId(),
    role: "assistant",
    content:
      content ||
      "Hi! I'm your Python AI Tutor. I can help you learn Python, debug code, explain concepts, or answer any programming questions. What would you like to learn today?",
    timestamp: new Date().toISOString(),
    languageCode: "en-US",
  };
}

function createThread(title = "New Chat"): ChatThread {
  const now = new Date().toISOString();
  return {
    id: makeId(),
    title,
    createdAt: now,
    updatedAt: now,
    messages: [buildWelcomeMessage()],
  };
}

function summarizeTitle(text: string): string {
  const compact = text.replace(/\s+/g, " ").trim();
  if (!compact) return "New Chat";
  return compact.length > 42 ? `${compact.slice(0, 42)}...` : compact;
}

function detectLanguageCode(text: string): string {
  const value = text.trim();
  const lower = value.toLowerCase();
  const marathiHints = [
    "\u0906\u0939\u0947", // आहे
    "\u0924\u0941\u092e\u094d\u0939\u0940", // तुम्ही
    "\u092e\u093e\u091d", // माझ
    "\u0915\u093e\u092f", // काय
    "\u0928\u093e\u0939\u0940", // नाही
    "\u0915\u0930\u093e", // करा
    "\u0936\u093f\u0915", // शिक
  ];

  if (!value) return "en-US";
  if (/[\u0A80-\u0AFF]/.test(value)) return "gu-IN";
  if (/[\u0C00-\u0C7F]/.test(value)) return "te-IN";
  if (/[\u0600-\u06FF]/.test(value)) return "ur-PK";

  if (/[\u0900-\u097F]/.test(value)) {
    if (marathiHints.some((hint) => lower.includes(hint))) {
      return "mr-IN";
    }
    return "hi-IN";
  }

  if (/(hola|gracias|por favor|como|espanol|spanish)/.test(lower)) {
    return "es-ES";
  }

  if (/(bonjour|merci|s'il|comment|francais|french)/.test(lower)) {
    return "fr-FR";
  }

  return "en-US";
}

function getLanguageOption(code: string): LanguageOption {
  return LANGUAGE_BY_CODE.get(code) || DEFAULT_LANGUAGE;
}

function stripCodeBlocksForSpeech(text: string): string {
  return text.replace(/```[\s\S]*?```/g, " Code example is shown in chat. ").replace(/\s+/g, " ").trim();
}

function getSpeechRecognitionConstructor(): BrowserSpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export default function AITutorPage() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceInputLanguage, setVoiceInputLanguage] = useState("auto");
  const [voiceReplyEnabled, setVoiceReplyEnabled] = useState(true);
  const [voiceStatus, setVoiceStatus] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceFeaturesReady, setVoiceFeaturesReady] = useState({
    recognition: false,
    synthesis: false,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const inputRef = useRef("");

  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  useEffect(() => {
    setVoiceFeaturesReady({
      recognition: Boolean(getSpeechRecognitionConstructor()),
      synthesis: typeof window !== "undefined" && "speechSynthesis" in window,
    });
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    try {
      const rawThreads = localStorage.getItem(STORAGE_KEY);
      const rawActiveThread = localStorage.getItem(ACTIVE_THREAD_KEY);
      if (!rawThreads) {
        const initial = createThread();
        setThreads([initial]);
        setActiveThreadId(initial.id);
        return;
      }

      const parsed = JSON.parse(rawThreads) as ChatThread[];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        const initial = createThread();
        setThreads([initial]);
        setActiveThreadId(initial.id);
        return;
      }

      const normalized = parsed.map((thread) => ({
        ...thread,
        messages:
          Array.isArray(thread.messages) && thread.messages.length > 0
            ? thread.messages
            : [buildWelcomeMessage()],
      }));
      setThreads(normalized);

      const hasStoredActive =
        rawActiveThread && normalized.some((thread) => thread.id === rawActiveThread);
      setActiveThreadId(hasStoredActive ? (rawActiveThread as string) : normalized[0].id);
    } catch {
      const initial = createThread();
      setThreads([initial]);
      setActiveThreadId(initial.id);
    }
  }, []);

  useEffect(() => {
    if (!threads.length) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
    localStorage.setItem(ACTIVE_THREAD_KEY, activeThreadId || threads[0].id);
  }, [threads, activeThreadId]);

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) || threads[0] || null,
    [threads, activeThreadId],
  );
  const messages = activeThread?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const stopSpeaking = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const speakAssistantResponse = useCallback(
    (text: string, languageCode: string) => {
      if (!voiceReplyEnabled) return;
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        setVoiceStatus("Voice output is not supported in this browser.");
        return;
      }

      const speakable = stripCodeBlocksForSpeech(text);
      if (!speakable) return;

      const selected = getLanguageOption(languageCode);
      const utterance = new SpeechSynthesisUtterance(speakable);
      utterance.lang = selected.speechCode;

      const voices = window.speechSynthesis.getVoices();
      const preferredPrefix = selected.speechCode.split("-")[0].toLowerCase();
      const matchingVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith(preferredPrefix));
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setVoiceStatus("Could not play voice response on this device.");
      };

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    },
    [voiceReplyEnabled],
  );

  const upsertActiveThread = useCallback(
    (updater: (thread: ChatThread) => ChatThread) => {
      if (!activeThread) return;
      setThreads((prev) =>
        prev.map((thread) => (thread.id === activeThread.id ? updater(thread) : thread)),
      );
    },
    [activeThread],
  );

  const createNewChat = () => {
    const fresh = createThread();
    setThreads((prev) => [fresh, ...prev]);
    setActiveThreadId(fresh.id);
    setInput("");
    setVoiceStatus("");
  };

  const sendMessage = useCallback(
    async (messageOverride?: string, preferredLanguageCode = "auto") => {
      if (!activeThread || loading) return;

      const content = (messageOverride ?? input).trim();
      if (!content) return;

      const requestedLanguageCode =
        preferredLanguageCode !== "auto" ? preferredLanguageCode : detectLanguageCode(content);
      const selectedLanguage = getLanguageOption(requestedLanguageCode);
      const existingMessages = activeThread.messages;

      const userMessage: Message = {
        id: makeId(),
        role: "user",
        content,
        timestamp: new Date().toISOString(),
        languageCode: selectedLanguage.code,
      };

      upsertActiveThread((thread) => ({
        ...thread,
        title: thread.title === "New Chat" ? summarizeTitle(content) : thread.title,
        updatedAt: new Date().toISOString(),
        messages: [...thread.messages, userMessage],
      }));

      setInput("");
      setLoading(true);
      setVoiceStatus("");

      try {
        const response = await fetch("https://api.poe.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer A__c0aKjBgQBDLQf4_NqiGhvUNdsAhILIFM69MrzGR0",
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content:
                  `You are a helpful Python programming tutor. Explain concepts clearly, provide code examples when helpful, and encourage learning. Format code blocks with \\\`\\\`\\\`python for syntax highlighting. Always respond in ${selectedLanguage.promptName}. If the user switches language, follow the user's latest language.`,
              },
              ...existingMessages.map((message) => ({ role: message.role, content: message.content })),
              { role: "user", content },
            ],
            stream: false,
          }),
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        const assistantMessage: Message = {
          id: makeId(),
          role: "assistant",
          content: data.choices[0].message.content,
          timestamp: new Date().toISOString(),
          languageCode: selectedLanguage.code,
        };

        upsertActiveThread((thread) => ({
          ...thread,
          updatedAt: new Date().toISOString(),
          messages: [...thread.messages, assistantMessage],
        }));

        speakAssistantResponse(assistantMessage.content, selectedLanguage.code);
      } catch (error) {
        console.error("Error:", error);
        const errorMessage: Message = {
          id: makeId(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date().toISOString(),
          languageCode: "en-US",
        };
        upsertActiveThread((thread) => ({
          ...thread,
          updatedAt: new Date().toISOString(),
          messages: [...thread.messages, errorMessage],
        }));
      } finally {
        setLoading(false);
      }
    },
    [activeThread, input, loading, speakAssistantResponse, upsertActiveThread],
  );

  const toggleVoiceInput = useCallback(() => {
    if (loading || !activeThread) return;

    const recognitionConstructor = getSpeechRecognitionConstructor();
    if (!recognitionConstructor) {
      setVoiceStatus("Voice input is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    try {
      const recognition = new recognitionConstructor();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang =
        voiceInputLanguage === "auto"
          ? DEFAULT_LANGUAGE.recognitionCode
          : getLanguageOption(voiceInputLanguage).recognitionCode;

      let finalTranscript = "";

      recognition.onresult = (event) => {
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          const transcript = result?.[0]?.transcript || "";
          if (result?.isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const merged = `${finalTranscript} ${interimTranscript}`.trim();
        setInput(merged);
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        setVoiceStatus(`Voice input stopped (${event.error || "unknown_error"}).`);
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;

        const transcript = finalTranscript.trim() || inputRef.current.trim();
        if (!transcript) return;

        const languageCode =
          voiceInputLanguage === "auto" ? detectLanguageCode(transcript) : voiceInputLanguage;

        void sendMessage(transcript, languageCode);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
      setVoiceStatus("Listening... speak now.");
    } catch {
      setIsListening(false);
      setVoiceStatus("Could not start microphone. Please allow mic access and try again.");
    }
  }, [activeThread, isListening, loading, sendMessage, voiceInputLanguage]);

  const clearCurrentChat = () => {
    if (!activeThread) return;
    upsertActiveThread((thread) => ({
      ...thread,
      title: "New Chat",
      updatedAt: new Date().toISOString(),
      messages: [buildWelcomeMessage("Chat cleared! What would you like to learn about Python?")],
    }));
    setVoiceStatus("");
  };

  const parseMessageContent = (content: string) => {
    const parts: Array<{ type: "text" | "code"; content: string; language?: string }> = [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

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
    <div className="flex h-[calc(100vh-100px)] flex-col gap-4 p-4 md:flex-row md:p-6">
      <aside className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 md:w-80 md:shrink-0">
        <button
          onClick={createNewChat}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3 text-sm font-semibold text-white hover:from-blue-600 hover:to-purple-700"
        >
          <MessageSquarePlus size={16} />
          New Chat
        </button>
        <div className="max-h-[220px] space-y-2 overflow-y-auto md:max-h-[calc(100vh-260px)]">
          {threads.map((thread) => {
            const active = activeThread?.id === thread.id;
            const lastMessage = thread.messages[thread.messages.length - 1];
            return (
              <button
                key={thread.id}
                onClick={() => setActiveThreadId(thread.id)}
                className={`w-full rounded-xl border px-3 py-2 text-left transition-colors ${
                  active
                    ? "border-blue-400/50 bg-blue-500/20"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                <p className="truncate text-sm font-semibold text-white">{thread.title}</p>
                <p className="mt-1 truncate text-xs text-slate-400">
                  {lastMessage?.content || "No messages yet"}
                </p>
              </button>
            );
          })}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold text-white">
              <Sparkles className="text-purple-400" size={32} />
              AI Python Tutor
            </h1>
            <p className="mt-1 text-slate-400">Your personal AI assistant for learning Python</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={voiceInputLanguage}
              onChange={(event) => setVoiceInputLanguage(event.target.value)}
              className="rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              onClick={toggleVoiceInput}
              disabled={!voiceFeaturesReady.recognition || loading || !activeThread}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                isListening
                  ? "border-red-500/60 bg-red-500/20 text-red-200"
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              {isListening ? "Stop Mic" : "Voice Input"}
            </button>

            <button
              onClick={() => setVoiceReplyEnabled((prev) => !prev)}
              disabled={!voiceFeaturesReady.synthesis}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                voiceReplyEnabled
                  ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-200"
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {voiceReplyEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              {voiceReplyEnabled ? "Voice Reply On" : "Voice Reply Off"}
            </button>

            <button
              onClick={stopSpeaking}
              disabled={!isSpeaking}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <VolumeX size={16} />
              Stop Voice
            </button>

            <button
              onClick={clearCurrentChat}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-400 transition-colors hover:bg-white/10"
            >
              <Trash2 size={16} />
              Clear Chat
            </button>
          </div>
        </div>

        {(voiceStatus || !voiceFeaturesReady.recognition || !voiceFeaturesReady.synthesis) && (
          <div className="mb-3 rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
            {voiceStatus ||
              "Voice mode depends on browser support. Chrome/Edge usually support both mic and voice output best."}
          </div>
        )}

        <div className="mb-4 flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-6">
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
                    className={`max-w-[80%] rounded-2xl px-6 py-4 ${
                      message.role === "user"
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                        : "bg-white/10 text-slate-100"
                    }`}
                  >
                    {parseMessageContent(message.content).map((part, idx) => (
                      <div key={idx}>
                        {part.type === "text" ? (
                          <p className="whitespace-pre-wrap leading-relaxed">{part.content}</p>
                        ) : (
                          <div className="relative my-3">
                            <div className="absolute right-2 top-2">
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
                      {new Date(message.timestamp).toLocaleTimeString()}
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
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                void sendMessage();
              }
            }}
            placeholder="Ask me anything about Python..."
            disabled={loading || !activeThread}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={() => void sendMessage()}
            disabled={loading || !input.trim() || !activeThread}
            className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-4 font-bold text-white transition-all hover:from-blue-600 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>

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
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-400 transition-colors hover:bg-white/10"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

