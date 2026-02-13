"use client";

import { clsx } from "clsx";
import { Laptop, Moon, SunMedium } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "pypilot_theme_mode";

type ThemeMode = "dark" | "light" | "system";
type ResolvedTheme = "dark" | "light";

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return mode;
}

function applyTheme(mode: ThemeMode): ResolvedTheme {
  const resolved = resolveTheme(mode);
  const root = document.documentElement;
  root.setAttribute("data-theme-mode", mode);
  root.setAttribute("data-theme", resolved);
  root.classList.toggle("dark", resolved === "dark");
  root.classList.toggle("light", resolved === "light");
  return resolved;
}

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [mode, setMode] = useState<ThemeMode>("system");
  const modeRef = useRef<ThemeMode>("system");
  const [resolved, setResolved] = useState<ResolvedTheme>("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("pypilot_theme");
    const initialMode: ThemeMode =
      stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    modeRef.current = initialMode;
    setMode(initialMode);
    setResolved(applyTheme(initialMode));
    setReady(true);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (modeRef.current === "system") {
        setResolved(applyTheme("system"));
      }
    };

    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  function setThemeMode(nextMode: ThemeMode) {
    modeRef.current = nextMode;
    setMode(nextMode);
    setResolved(applyTheme(nextMode));
    localStorage.setItem(STORAGE_KEY, nextMode);
  }

  if (!ready) return null;

  return (
    <div
      className={clsx(
        "inline-flex items-center gap-1 rounded-xl border border-python-blue/45 bg-slate-900/80 p-1 text-xs text-white shadow-[0_8px_20px_rgba(2,6,23,0.35)] backdrop-blur-sm",
        className,
      )}
    >
      <button
        aria-label="System theme"
        title="System theme"
        onClick={() => setThemeMode("system")}
        className={clsx(
          "inline-flex items-center gap-1 rounded-lg px-2 py-1 transition",
          mode === "system" ? "bg-python-blue/40 text-white" : "text-slate-200 hover:bg-white/10",
        )}
      >
        <Laptop size={13} />
        <span className="hidden sm:inline">System</span>
      </button>
      <button
        aria-label="Light theme"
        title="Light theme"
        onClick={() => setThemeMode("light")}
        className={clsx(
          "inline-flex items-center gap-1 rounded-lg px-2 py-1 transition",
          mode === "light" ? "bg-python-blue/40 text-white" : "text-slate-200 hover:bg-white/10",
        )}
      >
        <SunMedium size={13} />
        <span className="hidden sm:inline">Light</span>
      </button>
      <button
        aria-label="Dark theme"
        title="Dark theme"
        onClick={() => setThemeMode("dark")}
        className={clsx(
          "inline-flex items-center gap-1 rounded-lg px-2 py-1 transition",
          mode === "dark" ? "bg-python-blue/40 text-white" : "text-slate-200 hover:bg-white/10",
        )}
      >
        <Moon size={13} />
        <span className="hidden sm:inline">Dark</span>
      </button>
      <span className="hidden rounded-md border border-python-yellow/40 px-2 py-1 font-mono text-[10px] text-python-yellow md:inline">
        {resolved}
      </span>
    </div>
  );
}
