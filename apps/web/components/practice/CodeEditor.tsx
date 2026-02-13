"use client";

import Editor, { useMonaco } from "@monaco-editor/react";
import { useEffect } from "react";

interface CodeEditorProps {
    initialValue?: string;
    language?: string;
    onChange?: (value: string | undefined) => void;
}

export function CodeEditor({ initialValue = "# Write your Python code here\nprint('Hello World')", language = "python", onChange }: CodeEditorProps) {
    const monaco = useMonaco();

    useEffect(() => {
        if (monaco) {
            monaco.editor.defineTheme("premium-dark", {
                base: "vs-dark",
                inherit: true,
                rules: [
                    { token: "comment", foreground: "6a9955" },
                    { token: "keyword", foreground: "569cd6" },
                    { token: "string", foreground: "ce9178" },
                ],
                colors: {
                    "editor.background": "#0f1117", // Matches our app bg slightly lighter
                    "editor.lineHighlightBackground": "#ffffff0a",
                },
            });
            monaco.editor.setTheme("premium-dark");
        }
    }, [monaco]);

    return (
        <div className="h-full w-full overflow-hidden rounded-xl border border-white/10 shadow-inner">
            <Editor
                height="100%"
                defaultLanguage={language}
                defaultValue={initialValue}
                theme="premium-dark"
                onChange={onChange}
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    fontFamily: "JetBrains Mono",
                    scrollBeyondLastLine: false,
                    padding: { top: 16, bottom: 16 },
                    smoothScrolling: true,
                    cursorBlinking: "smooth",
                    cursorSmoothCaretAnimation: "on",
                }}
            />
        </div>
    );
}
