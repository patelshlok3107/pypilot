"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { ParticleBackground } from "@/components/effects/ParticleBackground";
import { apiFetch } from "@/lib/api";
import { setAuth } from "@/lib/auth";
import type { OnboardingStatus, TokenResponse } from "@/lib/types";
import { UserPlus, Mail, Lock, User, AlertCircle, ArrowRight } from "lucide-react";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await apiFetch<TokenResponse>(
        "/auth/signup",
        {
          method: "POST",
          body: JSON.stringify({
            full_name: fullName,
            email,
            password,
          }),
        },
        false,
      );
      setAuth(response.access_token, response.user);
      const onboarding = await apiFetch<OnboardingStatus>("/onboarding/status").catch(() => null);
      router.push(onboarding?.onboarding_complete ? "/dashboard" : "/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account.");
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
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400">
              <UserPlus size={32} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Create Account</h1>
            <p className="mt-2 text-slate-400">Join our learning community</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="group relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-purple-400" size={18} />
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Full Name"
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 outline-none transition-all focus:border-purple-500/50 focus:bg-white/10"
              />
            </div>

            <div className="group relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-purple-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email Address"
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 outline-none transition-all focus:border-purple-500/50 focus:bg-white/10"
              />
            </div>

            <div className="group relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-purple-400" size={18} />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                required
                minLength={8}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 outline-none transition-all focus:border-purple-500/50 focus:bg-white/10"
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
              className="group relative w-full overflow-hidden rounded-xl bg-purple-600 py-3 font-bold text-white transition-all hover:bg-purple-500 hover:shadow-[0_0_15px_rgba(139,92,246,0.5)] disabled:opacity-50"
            >
              <div className="flex items-center justify-center gap-2">
                {loading ? "Creating Profile..." : "Sign Up"}
                <ArrowRight size={18} className={`transition-transform ${loading ? "translate-x-1" : "group-hover:translate-x-1"}`} />
              </div>
            </button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-slate-400">Already a student?</span>{" "}
            <Link href="/login" className="font-bold text-purple-400 hover:text-purple-300 transition-colors">
              Log in instead
            </Link>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
