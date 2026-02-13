"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, ChevronRight, Lock, PlayCircle, Sparkles } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { buildLearnCategories, LearnCategory, ModuleGate } from "@/lib/learn";
import { Course, DashboardStats } from "@/lib/types";

interface PageProps {
    params: Promise<{
        category: string;
    }>;
}

export default function CategoryPage({ params }: PageProps) {
    const resolvedParams = use(params);
    const [categories, setCategories] = useState<LearnCategory[]>([]);
    const [unlockXp, setUnlockXp] = useState(1800);
    const [unlockLessons, setUnlockLessons] = useState(12);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            try {
                setLoading(true);
                setError(null);

                const [courses, dashboard, gates] = await Promise.all([
                    apiFetch<Course[]>("/courses/catalog"),
                    apiFetch<DashboardStats>("/users/me/dashboard"),
                    apiFetch<ModuleGate[]>("/learning/gates"),
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
            } catch (err) {
                if (!isMounted) {
                    return;
                }
                setError(err instanceof Error ? err.message : "Unable to load this learning module.");
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

    const category = categories.find((item) => item.id === resolvedParams.category);

    if (loading) {
        return (
            <div className="space-y-4 animate-floatUp">
                <div className="h-40 rounded-3xl border border-white/10 bg-white/5 animate-pulse" />
                {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="h-20 rounded-xl border border-white/10 bg-white/5 animate-pulse" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
                <h2 className="text-lg font-semibold">Could not load this module</h2>
                <p className="mt-2 text-sm">{error}</p>
            </div>
        );
    }

    if (!category) {
        return (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-300">
                <h2 className="text-lg font-semibold text-white">Module not found</h2>
                <p className="mt-2 text-sm">This module does not exist in the current catalog.</p>
                <Link href="/learn" className="mt-4 inline-flex text-sm font-semibold text-blue-300 hover:text-blue-200">
                    Back to Learning Paths
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-floatUp">
            <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${category.color} p-8 md:p-12`}>
                <div className="relative z-10">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-4xl font-bold text-white">{category.title}</h1>
                        {category.isAdvanced && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-black/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                                <Sparkles size={12} />
                                Advanced
                            </span>
                        )}
                        {category.locked && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                                <Lock size={12} />
                                Locked
                            </span>
                        )}
                    </div>
                    <p className="mt-4 max-w-2xl text-lg text-white/80">{category.description}</p>
                    <div className="mt-6 flex items-center gap-4">
                        <div className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
                            {category.completedLessons}/{category.chapters} lessons completed
                        </div>
                        <span className="text-sm font-medium text-white/90">{category.progressPercent}% progress</span>
                    </div>
                    {category.locked && (
                        <p className="mt-4 text-sm text-white/90">
                            {category.lockReason === "Mastery gate lock"
                                ? "Complete the previous module with quiz score >= 70 and passed challenges to unlock."
                                : `Unlock requirement: subscription or earn ${unlockXp} XP / ${unlockLessons} completed lessons.`}
                        </p>
                    )}
                </div>
                <div className="absolute right-0 top-0 h-full w-1/2 -translate-y-1/2 translate-x-1/2 transform rounded-full bg-white/5 blur-3xl" />
            </div>

            <div className="mx-auto max-w-4xl space-y-4">
                <h2 className="mb-6 text-xl font-bold text-white">Course Content</h2>
                {category.chaptersList.map((chapter, index) =>
                    chapter.locked ? (
                        <div
                            key={chapter.id}
                            className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 p-4"
                        >
                            <div className="flex items-center gap-4">
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-sm font-mono text-slate-300">
                                    {String(index + 1).padStart(2, "0")}
                                </span>
                                <div>
                                    <h3 className="font-medium text-white">{chapter.title}</h3>
                                    <p className="text-xs text-red-200">
                                        {chapter.lockReason === "Mastery gate lock"
                                            ? "Locked by mastery gate"
                                            : "Locked advanced lesson"}
                                    </p>
                                </div>
                            </div>
                            <Lock className="text-red-300" size={18} />
                        </div>
                    ) : (
                        <Link
                            key={chapter.id}
                            href={`/learn/${category.id}/${chapter.id}`}
                            className="group flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-4 transition-all hover:scale-[1.01] hover:bg-white/10"
                        >
                            <div className="flex items-center gap-4">
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-sm font-mono text-slate-400">
                                    {String(index + 1).padStart(2, "0")}
                                </span>
                                <div>
                                    <h3 className="font-medium text-white transition-colors group-hover:text-python-blue-light">
                                        {chapter.title}
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        {chapter.estimatedMinutes} mins | {chapter.xpReward} XP
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                {chapter.completed ? (
                                    <CheckCircle className="text-green-500" size={20} />
                                ) : (
                                    <PlayCircle className="text-slate-500 transition-colors group-hover:text-white" size={20} />
                                )}
                                <ChevronRight className="text-slate-600 transition-transform group-hover:translate-x-1" size={16} />
                            </div>
                        </Link>
                    )
                )}

                {category.chaptersList.length === 0 && (
                    <div className="py-12 text-center text-slate-500">No chapters available yet. Check back soon!</div>
                )}
            </div>
        </div>
    );
}
