"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ParticleBackground } from "@/components/effects/ParticleBackground";
import { ChevronRight, BookOpen, Code, Trophy } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#020617]">
      <ParticleBackground />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="glass-card max-w-4xl p-12 text-center"
        >
          {/* Greeting Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-5xl font-bold tracking-tight text-white md:text-7xl">
              Welcome to <span className="premium-gradient-text">PyPilot</span>
            </h1>

            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-slate-300 md:text-xl">
              Your personal Python learning companion. Master coding through interactive challenges,
              real-time feedback, and a professional workspace designed for modern engineering.
            </p>
          </motion.div>

          {/* Feature Highlights */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3"
          >
            {[
              { icon: BookOpen, label: "Interactive Lessons", color: "text-blue-400" },
              { icon: Code, label: "Real-time Coding", color: "text-cyan-400" },
              { icon: Trophy, label: "Skill Recognition", color: "text-amber-400" }
            ].map((feature, i) => (
              <div key={i} className="flex flex-col items-center gap-2 rounded-2xl bg-white/5 p-4 border border-white/5">
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
                <span className="text-sm font-medium text-slate-400">{feature.label}</span>
              </div>
            ))}
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12 flex flex-col items-center justify-center gap-6 sm:flex-row"
          >
            <Link
              href="/dashboard"
              className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-white px-10 py-4 font-bold text-black transition-all hover:bg-slate-200 sm:w-auto"
            >
              Start Learning
              <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/signup"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-10 py-4 font-bold text-white backdrop-blur-sm transition-all hover:bg-white/10 sm:w-auto"
            >
              Create Account
            </Link>
          </motion.div>

          {/* Sign In Link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 text-slate-400"
          >
            Already a member?{" "}
            <Link href="/login" className="font-semibold text-white hover:text-blue-400 transition-colors">
              Sign In
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </main>
  );
}
