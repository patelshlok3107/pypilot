"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

import { NotebookPage } from "@/components/learn/NotebookPage";
import { useProgress } from "@/contexts/ProgressContext";
import { apiFetch } from "@/lib/api";
import { buildLearnCategories, LearnCategory, ModuleGate, parseNotebookPages } from "@/lib/learn";
import { Course, DashboardStats } from "@/lib/types";

interface PageProps {
    params: Promise<{
        category: string;
        chapter: string;
    }>;
}

export default function ChapterPage({ params }: PageProps) {
    const resolvedParams = use(params);
    const router = useRouter();
    const { completeChapter } = useProgress();

    const [categories, setCategories] = useState<LearnCategory[]>([]);
    const [unlockXp, setUnlockXp] = useState(1800);
    const [unlockLessons, setUnlockLessons] = useState(12);
    const [attemptId, setAttemptId] = useState<number | null>(null);
    const [startedAt, setStartedAt] = useState<number>(() => Date.now());
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
                setError(err instanceof Error ? err.message : "Unable to load this lesson.");
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
    const chapter = category?.chaptersList.find((item) => item.id === resolvedParams.chapter);

    const pages = useMemo(() => {
        if (!chapter) {
            return [];
        }
        return parseNotebookPages(chapter.contentMd, chapter.objective, chapter.starterCode);
    }, [chapter]);

    useEffect(() => {
        if (!chapter || chapter.locked) {
            return;
        }

        let cancelled = false;
        const beginAttempt = async () => {
            try {
                setAttemptId(null);
                const attempt = await apiFetch<{ attempt_id: number }>(
                    `/learning/lessons/${chapter.lessonId}/attempts/start`,
                    {
                        method: "POST",
                        body: JSON.stringify({
                            dwell_seconds: 0,
                            metadata_json: {
                                category: resolvedParams.category,
                                chapter: resolvedParams.chapter,
                            },
                        }),
                    }
                );
                if (!cancelled) {
                    setAttemptId(attempt.attempt_id);
                    setStartedAt(Date.now());
                }
            } catch {
                // Keep UX usable; backend completion will still validate anti-fake fields.
            }
        };

        beginAttempt();
        return () => {
            cancelled = true;
        };
    }, [chapter, resolvedParams.category, resolvedParams.chapter]);

    useEffect(() => {
        if (!chapter || chapter.locked || !attemptId) {
            return;
        }

        let cancelled = false;
        const sendHeartbeat = async (reason: "interval" | "visibility" | "final") => {
            if (cancelled) {
                return;
            }
            const dwellSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
            try {
                await apiFetch(`/learning/lessons/${chapter.lessonId}/attempts/heartbeat`, {
                    method: "POST",
                    body: JSON.stringify({
                        attempt_id: attemptId,
                        dwell_seconds: dwellSeconds,
                        metadata_json: {
                            reason,
                            visibility: document.visibilityState,
                            chapter_id: chapter.id,
                        },
                    }),
                });
            } catch {
                // Avoid interrupting lesson UX on transient heartbeat failures.
            }
        };

        const intervalId = window.setInterval(() => {
            if (document.visibilityState === "visible") {
                void sendHeartbeat("interval");
            }
        }, 15000);

        const onVisibilityChange = () => {
            if (document.visibilityState === "hidden") {
                void sendHeartbeat("visibility");
            }
        };

        document.addEventListener("visibilitychange", onVisibilityChange);

        return () => {
            window.clearInterval(intervalId);
            document.removeEventListener("visibilitychange", onVisibilityChange);
            void sendHeartbeat("final");
            cancelled = true;
        };
    }, [attemptId, chapter, startedAt]);

    const handleComplete = async () => {
        if (!chapter) {
            return;
        }
        const dwellSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
        if (attemptId) {
            try {
                await apiFetch(`/learning/lessons/${chapter.lessonId}/attempts/heartbeat`, {
                    method: "POST",
                    body: JSON.stringify({
                        attempt_id: attemptId,
                        dwell_seconds: dwellSeconds,
                        metadata_json: {
                            reason: "final",
                            visibility: document.visibilityState,
                            chapter_id: chapter.id,
                        },
                    }),
                });
            } catch {
                // Continue completion flow; backend anti-fake checks are authoritative.
            }
        }
        await completeChapter(chapter.id, {
            attemptId: attemptId ?? undefined,
            dwellSeconds,
            quizScore: 100,
            challengePassed: true,
        });
        router.push(`/learn/${resolvedParams.category}`);
    };

    if (loading) {
        return (
            <div className="flex min-h-[calc(100vh-100px)] items-center justify-center p-4 md:p-8 animate-floatUp">
                <div className="h-[600px] w-full max-w-4xl rounded-xl border border-white/10 bg-white/5 animate-pulse" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
                <h2 className="text-lg font-semibold">Could not load this lesson</h2>
                <p className="mt-2 text-sm">{error}</p>
            </div>
        );
    }

    if (!category || !chapter) {
        return (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-300">
                <h2 className="text-lg font-semibold text-white">Lesson not found</h2>
                <p className="mt-2 text-sm">This lesson does not exist in the current catalog.</p>
                <Link href="/learn" className="mt-4 inline-flex text-sm font-semibold text-blue-300 hover:text-blue-200">
                    Back to Learning Paths
                </Link>
            </div>
        );
    }

    if (chapter.locked) {
        return (
            <div className="mx-auto max-w-2xl animate-floatUp rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-red-100">
                <div className="inline-flex items-center gap-2 rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                    <Lock size={14} />
                    Advanced lesson locked
                </div>
                <h1 className="mt-4 text-2xl font-bold text-white">{chapter.title}</h1>
                <p className="mt-3 text-sm text-red-100">
                    {chapter.lockReason === "Mastery gate lock"
                        ? "Unlock this lesson by completing the previous module with quiz score >= 70 and passed challenges."
                        : `Unlock this lesson with an active subscription or by earning ${unlockXp} XP / ${unlockLessons} completed lessons.`}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                        href="/subscription"
                        className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100"
                    >
                        View Subscription
                    </Link>
                    <Link
                        href={`/learn/${category.id}`}
                        className="rounded-lg border border-white/40 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                    >
                        Continue Free Lessons
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-[calc(100vh-100px)] items-center justify-center p-4 md:p-8 animate-floatUp">
            <NotebookPage
                title={chapter.title}
                pages={pages}
                onComplete={handleComplete}
            />
        </div>
    );
}
