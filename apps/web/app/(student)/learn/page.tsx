"use client";

import Link from "next/link";
import { Lock, Sparkles, Target } from "lucide-react";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import { buildLearnCategories, LearnCategory, ModuleGate } from "@/lib/learn";
import { Course, DashboardStats, LearningRecommendation } from "@/lib/types";

export default function LearnPage() {
  const [categories, setCategories] = useState<LearnCategory[]>([]);
  const [unlockXp, setUnlockXp] = useState(1800);
  const [unlockLessons, setUnlockLessons] = useState(12);
  const [recommendation, setRecommendation] = useState<LearningRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [courses, dashboard, gates, recommendationData] = await Promise.all([
          apiFetch<Course[]>("/courses/catalog"),
          apiFetch<DashboardStats>("/users/me/dashboard"),
          apiFetch<ModuleGate[]>("/learning/gates"),
          apiFetch<LearningRecommendation>("/learning/recommendation"),
        ]);

        if (!isMounted) {
          return;
        }

        const gateMap = Object.fromEntries(gates.map((gate) => [gate.module_id, gate]));
        setCategories(
          buildLearnCategories(
            courses,
            dashboard.completed_lesson_ids,
            dashboard.can_access_advanced_topics,
            gateMap
          )
        );
        setUnlockXp(dashboard.advanced_unlock_xp_required);
        setUnlockLessons(dashboard.advanced_unlock_lessons_required);
        setRecommendation(recommendationData);
      } catch (err) {
        if (!isMounted) {
          return;
        }
        setError(err instanceof Error ? err.message : "Unable to load learning paths.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-floatUp">
        <h1 className="text-3xl font-bold text-white">Learning Paths</h1>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="h-48 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
        <h2 className="text-lg font-semibold">Could not load learning paths</h2>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-floatUp">
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold text-white">Learning Paths</h1>
        <p className="mt-2 text-slate-400">
          Progress is calculated from completed lessons only. Advanced modules unlock with subscription or earned milestones.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Earn unlock target: {unlockXp} XP or {unlockLessons} completed lessons.
        </p>
      </div>

      {recommendation && recommendation.lesson_id && (
        <Link
          href={`/learn/${recommendation.module_id}/${recommendation.lesson_id}`}
          className="group flex items-start gap-3 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-4 transition-colors hover:bg-cyan-500/20"
        >
          <Target className="mt-1 text-cyan-200" size={18} />
          <div>
            <p className="text-sm font-semibold text-cyan-100">Recommended Next Lesson</p>
            <p className="text-base font-bold text-white">{recommendation.lesson_title}</p>
            <p className="text-xs text-cyan-100/90">{recommendation.reason}</p>
            {recommendation.unlock_reason && (
              <p className="mt-1 text-xs text-amber-200">{recommendation.unlock_reason}</p>
            )}
          </div>
        </Link>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/learn/${category.id}`}
            className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-6 transition-all hover:scale-[1.02] hover:bg-white/10"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 transition-opacity duration-500 group-hover:opacity-10`}
            />

            <div className="relative z-10">
              <div className="mb-4 flex items-center justify-between gap-2">
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${category.color} text-white shadow-lg`}
                >
                  <span className="text-xl font-bold">{category.title[0]}</span>
                </div>
                <div className="flex items-center gap-2">
                  {category.isAdvanced && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
                      <Sparkles size={12} />
                      Advanced
                    </span>
                  )}
                  {category.locked && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-red-200">
                      <Lock size={12} />
                      Locked
                    </span>
                  )}
                </div>
              </div>

              <h3 className="text-xl font-bold text-white">{category.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm text-slate-400">{category.description}</p>

              <div className="mt-6 flex items-center justify-between">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
                  {category.completedLessons}/{category.chapters} Chapters
                </span>
                <span className="text-xs text-slate-400">{category.progressPercent}% Complete</span>
              </div>

              <div className="mt-4 h-1 w-full rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-white transition-all duration-700"
                  style={{ width: `${category.progressPercent}%` }}
                />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
