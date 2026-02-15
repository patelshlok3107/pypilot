"use client";

import { CodeEditor } from "@/components/practice/CodeEditor";
import { Play, Save, Share2, Terminal as TerminalIcon, Settings } from "lucide-react";
import { useState } from "react";

export default function PlaygroundPage() {
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = () => {
    setIsRunning(true);
    // Simulate run
    setTimeout(() => {
      setOutput("Program exited with code 0\n> Hello from PyPilot Playground!");
      setIsRunning(false);
    }, 800);
  };

  return (
    <div className="flex h-[calc(100vh-100px)] flex-col gap-4 animate-floatUp">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Python Playground</h1>
          <p className="text-slate-400 text-sm">Experiment, build, and share your code.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10">
            <Save size={16} /> Save
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10">
            <Share2 size={16} /> Share
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 font-bold text-white hover:bg-green-500 shadow-lg shadow-green-500/20" onClick={handleRun}>
            <Play size={16} fill="currentColor" /> Run
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Editor Area */}
        <div className="flex-1 rounded-xl border border-white/10 bg-[#0f1117] flex flex-col">
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-2">
            <span className="text-xs font-mono text-slate-400">main.py</span>
            <Settings size={14} className="text-slate-500 hover:text-white cursor-pointer" />
          </div>
          <div className="flex-1 relative">
            <CodeEditor initialValue="# Welcome to the Playground!
import random

def greet(name):
    greetings = ['Hello', 'Hi', 'Greetings', 'Welcome']
    return f'{random.choice(greetings)}, {name}!'

print(greet('Developer'))
" />
          </div>
        </div>

        {/* Output Area */}
        <div className="w-1/3 flex flex-col rounded-xl border border-white/10 bg-black/40">
          <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3 bg-white/5">
            <TerminalIcon size={16} className="text-slate-400" />
            <span className="text-sm font-bold text-slate-300">Terminal</span>
          </div>
          <div className="flex-1 p-4 font-mono text-sm text-slate-300 overflow-y-auto">
            {output ? (
              <pre className="whitespace-pre-wrap">{output}</pre>
            ) : (
              <span className="text-slate-600 italic">Ready to execute...</span>
            )}
            {isRunning && <span className="animate-pulse text-green-500">_</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
