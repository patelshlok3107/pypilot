"use client";

import React, { useEffect, useRef, useState } from "react";

type OnTranscript = (text: string) => void;

export default function VoiceAssistant({ onTranscript }: { onTranscript?: OnTranscript }) {
  const [listening, setListening] = useState(false);
  const [lang, setLang] = useState("en-US");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Setup Web Speech API SpeechRecognition if available
    const win: any = window as any;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.lang = lang;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (onTranscript) onTranscript(transcript);
    };

    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
  }, [lang, onTranscript]);

  function startListening() {
    const rec = recognitionRef.current;
    if (!rec) return;
    try {
      rec.lang = lang;
      rec.start();
      setListening(true);
    } catch (e) {
      console.error(e);
    }
  }

  function stopListening() {
    const rec = recognitionRef.current;
    if (!rec) return;
    try {
      rec.stop();
    } catch (e) {
      console.error(e);
    }
    setListening(false);
  }

  async function speak(text: string, speakLang = "en-US") {
    if (!text) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = speakLang;
    // Choose a voice that matches language if available
    const voices = window.speechSynthesis.getVoices();
    const candidate = voices.find((v) => v.lang && v.lang.startsWith(speakLang.split("-")[0]));
    if (candidate) utter.voice = candidate;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  return (
    <div className="flex items-center gap-2">
      <select value={lang} onChange={(e) => setLang(e.target.value)} className="rounded p-1 text-sm">
        <option value="en-US">English</option>
        <option value="hi-IN">हिन्दी</option>
      </select>

      <button
        onClick={() => (listening ? stopListening() : startListening())}
        className={`px-3 py-1 rounded ${listening ? "bg-red-500 text-white" : "bg-blue-600 text-white"}`}
      >
        {listening ? "Stop" : "Talk"}
      </button>

      <button
        onClick={() => speak("Hello, how can I help?")}
        className="px-3 py-1 rounded bg-slate-200 text-slate-900"
      >
        Play
      </button>
    </div>
  );
}
