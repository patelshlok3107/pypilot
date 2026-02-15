"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ParticleBackground } from "@/components/effects/ParticleBackground";
import { apiFetch } from "@/lib/api";
import { setAuth } from "@/lib/auth";
import type { OnboardingStatus, TokenResponse } from "@/lib/types";
import { LogIn, Mail, Lock, AlertCircle, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [nextPath, setNextPath] = useState("/dashboard");

  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNextPath(params.get("next") || "/dashboard");
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await apiFetch<TokenResponse>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
        },
        false,
      );
      setAuth(response.access_token, response.user);
      const onboarding = await apiFetch<OnboardingStatus>("/onboarding/status").catch(() => null);
      if (onboarding && !onboarding.onboarding_complete) {
        router.push("/onboarding");
        return;
      }
      router.push(nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 text-white">
      <ParticleBackground />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="glass-card neon-border overflow-hidden p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400">
              <LogIn size={32} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
            <p className="mt-2 text-slate-400">Log in to resume your learning</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="group relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-blue-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email Address"
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 outline-none transition-all focus:border-blue-500/50 focus:bg-white/10"
              />
            </div>

            <div className="group relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-blue-400" size={18} />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 outline-none transition-all focus:border-blue-500/50 focus:bg-white/10"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-sm text-red-400"
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full overflow-hidden rounded-xl bg-blue-600 py-3 font-bold text-white transition-all hover:bg-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] disabled:opacity-50"
            >
              <div className="flex items-center justify-center gap-2">
                {loading ? "Authenticating..." : "Log In"}
                <ArrowRight size={18} className={`transition-transform ${loading ? "translate-x-1" : "group-hover:translate-x-1"}`} />
              </div>
            </button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-slate-400">New student?</span>{" "}
            <Link href="/signup" className="font-bold text-blue-400 hover:text-blue-300 transition-colors">
              Create an account
            </Link>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
