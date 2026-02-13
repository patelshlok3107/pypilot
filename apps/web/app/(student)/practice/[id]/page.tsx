"use client";

import { use } from "react";
import { CodeEditor } from "@/components/practice/CodeEditor";
import { Play, RotateCcw, CheckCircle, Zap } from "lucide-react";
import { useState } from "react";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default function ChallengePage({ params }: PageProps) {
    const resolvedParams = use(params);
    const [output, setOutput] = useState<string>("");
    const [isRunning, setIsRunning] = useState(false);

    const handleRun = () => {
        setIsRunning(true);
        setOutput("Running tests...\n");

        // Simulate execution delay
        setTimeout(() => {
            setOutput((prev) => prev + "Test Case 1: Passed ✅\nTest Case 2: Passed ✅\nTest Case 3: Passed ✅\n\nAll tests passed! +50 XP");
            setIsRunning(false);
        }, 1500);
    };

    return (
        <div className="flex h-[calc(100vh-120px)] flex-col lg:flex-row gap-6 animate-floatUp">
            {/* Problem Description Panel */}
            <div className="flex basis-1/3 flex-col rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm">
                <div className="mb-4 flex items-center justify-between">
                    <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-bold text-yellow-500 border border-yellow-500/20">
                        Medium Difficulty
                    </span>
                    <div className="flex items-center gap-1 text-green-400">
                        <Zap size={14} fill="currentColor" />
                        <span className="font-bold">50 XP</span>
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-white">Fibonacci Sequence</h1>

                <div className="prose prose-invert prose-sm mt-4 text-slate-300 flex-1 overflow-y-auto">
                    <p>Write a function <code>fibonacci(n)</code> that returns the n-th number in the Fibonacci sequence.</p>
                    <p>The sequence starts: 0, 1, 1, 2, 3, 5, 8, ...</p>

                    <h3>Example:</h3>
                    <pre className="bg-black/30 p-2 rounded-lg">
                        {`Input: n = 5
Output: 5

Input: n = 10
Output: 55`}
                    </pre>

                    <h3>Constraints:</h3>
                    <ul>
                        <li>0 &le; n &le; 30</li>
                    </ul>
                </div>
            </div>

            {/* Editor & Output Panel */}
            <div className="flex flex-1 flex-col gap-4">
                <div className="relative flex-1 rounded-2xl border border-white/5 bg-[#0f1117] overflow-hidden">
                    <CodeEditor initialValue="def fibonacci(n):
    # Your code here
    pass" />

                    <div className="absolute bottom-4 right-4 flex gap-2">
                        <button
                            className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 font-semibold text-white hover:bg-white/20 transition-colors"
                            onClick={() => setOutput("")}
                        >
                            <RotateCcw size={16} />
                            Reset
                        </button>
                        <button
                            onClick={handleRun}
                            disabled={isRunning}
                            className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 font-semibold text-white hover:bg-green-500 transition-colors shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isRunning ? (
                                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                            ) : (
                                <Play size={16} fill="currentColor" />
                            )}
                            Run Code
                        </button>
                    </div>
                </div>

                {/* Output Console */}
                <div className="h-48 rounded-2xl border border-white/5 bg-black/40 p-4 font-mono text-sm">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                        <span className="text-xs text-slate-500 uppercase tracking-wider">Output Console</span>
                        {output.includes("All tests passed") && (
                            <span className="flex items-center gap-1 text-xs text-green-400 font-bold">
                                <CheckCircle size={12} /> Success
                            </span>
                        )}
                    </div>
                    <pre className={`whitespace-pre-wrap ${output.includes("Passed") ? "text-green-300" : "text-slate-300"}`}>
                        {output || "Run your code to see output..."}
                    </pre>
                </div>
            </div>
        </div>
    );
}
