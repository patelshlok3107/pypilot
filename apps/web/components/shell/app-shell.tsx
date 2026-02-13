"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Award,
  BookOpen,
  Bot,
  Code2,
  Gauge,
  LogOut,
  Settings,
  Sparkles,
  Target,
  Trophy,
  UserCircle2,
  Users,
} from "lucide-react";

import { PythonSyntaxCloud, PythonSyntaxStrip } from "@/components/theme/python-syntax";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { clearAuth, getStoredUser } from "@/lib/auth";
import type { AuthUser } from "@/lib/types";
import { Button } from "@/components/ui/button";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/ai-tutor", label: "AI Tutor", icon: Bot },
  { href: "/tracks", label: "Tracks", icon: Target },
  { href: "/practice", label: "Practice", icon: Sparkles },
  { href: "/squads", label: "Squads", icon: Users },
  { href: "/playground", label: "Playground", icon: Code2 },
  { href: "/achievements", label: "Achievements", icon: Trophy },
  { href: "/report-card", label: "Report Card", icon: Award },
  { href: "/settings", label: "Settings", icon: Settings },
];

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = getStoredUser<AuthUser>();

  return (
    <div className="python-grid relative min-h-screen overflow-hidden text-white">
      <PythonSyntaxCloud className="opacity-70" />

      <div className="relative mx-auto grid min-h-screen max-w-[1450px] grid-cols-1 gap-4 px-3 py-3 lg:grid-cols-[290px_1fr] lg:px-4 lg:py-4">
        <aside className="python-window overflow-hidden">
          <div className="python-toolbar flex items-center gap-2 px-4 py-3">
            <span className="python-dot bg-red-400" />
            <span className="python-dot bg-yellow-300" />
            <span className="python-dot bg-green-400" />
            <p className="ml-2 text-xs font-mono text-white/90">workspace.py</p>
          </div>

          <div className="space-y-5 p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-python-yellow">PyPilot</p>
              <h1 className="font-display text-2xl font-semibold">Python Study OS</h1>
            </div>

            <PythonSyntaxStrip tokens={["def", "class", "for", "if", "[]", "{}"]} />

            <nav className="space-y-1">
              {nav.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                      active
                        ? "bg-python-blue/25 text-white shadow-[0_0_0_1px_rgba(75,139,190,0.5)]"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="rounded-xl border border-python-yellow/25 bg-slate-950/70 p-3">
              <p className="text-xs text-slate-400">Current level</p>
              <p className="text-2xl font-semibold text-python-yellow">Lv. {user?.level ?? 1}</p>
              <p className="text-xs text-slate-400">{user?.xp ?? 0} XP</p>
            </div>
          </div>
        </aside>

        <main className="python-window overflow-hidden">
          <header className="python-toolbar flex flex-col items-start justify-between gap-3 px-4 py-3 md:flex-row md:items-center lg:px-5">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-python-yellow/20 p-2 text-python-yellow">
                <UserCircle2 size={18} />
              </div>
              <div>
                <p className="text-xs text-white/75">Welcome back</p>
                <p className="font-semibold">{user?.full_name || "Student"}</p>
              </div>
            </div>

            <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
              <p className="python-prompt w-full md:w-auto">&gt;&gt;&gt; keep_learning(today=True)</p>
              <ThemeToggle />
              <Button
                variant="ghost"
                className="gap-2"
                onClick={async () => {
                  await clearAuth();
                  router.push("/login");
                }}
              >
                <LogOut size={14} />
                Logout
              </Button>
            </div>
          </header>

          <section className="p-4 lg:p-5">{children}</section>
        </main>
      </div>
    </div>
  );
}
