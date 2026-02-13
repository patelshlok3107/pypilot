"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";

import { PythonSyntaxStrip } from "@/components/theme/python-syntax";
import { apiFetch } from "@/lib/api";
import type { CodeRunResponse } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const DEFAULT_CODE = `def greet(name):
    return f"Hello, {name}!"

print(greet("Python Learner"))
`;

export function CodePlayground() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [stdin, setStdin] = useState("");
  const [result, setResult] = useState<CodeRunResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runCode() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<CodeRunResponse>(
        "/playground/run",
        {
          method: "POST",
          body: JSON.stringify({ code, stdin }),
        },
        true,
      );
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Execution failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
      <Card className="space-y-3 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-lg font-semibold">Python Playground</h3>
          <Button onClick={runCode} disabled={loading}>
            {loading ? "Running..." : "Run Code"}
          </Button>
        </div>

        <PythonSyntaxStrip
          tokens={["def", "for", "if", "list", "dict", "try/except", "print()", "return"]}
        />

        <div className="python-prompt">&gt;&gt;&gt; Run code and learn from instant output + AI debugging</div>

        <div className="h-[440px] overflow-hidden rounded-xl border border-python-blue/35">
          <Editor
            height="100%"
            defaultLanguage="python"
            value={code}
            onChange={(value) => setCode(value ?? "")}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "JetBrains Mono, monospace",
              automaticLayout: true,
            }}
          />
        </div>
      </Card>

      <div className="space-y-4">
        <Card>
          <h4 className="mb-2 text-sm font-semibold text-slate-200">Input (stdin)</h4>
          <textarea
            value={stdin}
            onChange={(event) => setStdin(event.target.value)}
            className="h-20 w-full rounded-lg border border-python-blue/35 bg-slate-950/70 p-2 font-mono text-xs text-slate-100"
            placeholder="Optional input"
          />
        </Card>

        <Card>
          <h4 className="mb-2 text-sm font-semibold text-slate-200">Output</h4>
          <pre className="max-h-40 overflow-auto rounded-lg border border-python-blue/35 bg-slate-950/70 p-3 text-xs text-python-yellow">
            {result?.stdout || "No output yet."}
          </pre>
        </Card>

        <Card>
          <h4 className="mb-2 text-sm font-semibold text-slate-200">Errors</h4>
          <pre className="max-h-40 overflow-auto rounded-lg border border-python-blue/35 bg-slate-950/70 p-3 text-xs text-red-200">
            {error || result?.stderr || "No errors."}
          </pre>
          {result?.ai_error_explanation && (
            <div className="mt-3 rounded-lg border border-python-yellow/35 bg-python-yellow/10 p-3 text-xs leading-relaxed text-yellow-100">
              <p className="mb-1 font-semibold">AI Debug Coach</p>
              <p>{result.ai_error_explanation}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
