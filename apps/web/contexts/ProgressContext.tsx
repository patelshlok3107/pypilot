"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { DashboardStats, LessonCompletionResponse } from "@/lib/types";

interface UserProgress {
    xp: number;
    level: number;
    streakDays: number;
    completedChapters: string[];
    dailyXp: number;
    weeklyXp: number;
    totalLessons: number;
    completedLessons: number;
    canAccessAdvancedTopics: boolean;
    earnedAdvancedAccess: boolean;
    advancedUnlockXpRequired: number;
    advancedUnlockLessonsRequired: number;
}

interface ProgressContextType {
    progress: UserProgress;
    addXP: (amount: number, source: string) => Promise<void>;
    completeChapter: (
        chapterId: string,
        options?: {
            attemptId?: number;
            dwellSeconds?: number;
            quizScore?: number;
            challengePassed?: boolean;
        }
    ) => Promise<void>;
    updateStreak: () => Promise<void>;
    refreshProgress: () => Promise<void>;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function ProgressProvider({ children }: { children: ReactNode }) {
    const [progress, setProgress] = useState<UserProgress>({
        xp: 0,
        level: 1,
        streakDays: 0,
        completedChapters: [],
        dailyXp: 0,
        weeklyXp: 0,
        totalLessons: 0,
        completedLessons: 0,
        canAccessAdvancedTopics: false,
        earnedAdvancedAccess: false,
        advancedUnlockXpRequired: 1800,
        advancedUnlockLessonsRequired: 12,
    });

    const emitXpEvent = useCallback(
        (amount: number, source: string, nextLevel = progress.level, leveledUp = false) => {
            if (typeof window !== "undefined") {
                const event = new CustomEvent("xpGained", {
                    detail: {
                        amount,
                        source,
                        newXp: progress.xp + amount,
                        newLevel: nextLevel,
                        leveledUp,
                    },
                });
                window.dispatchEvent(event);
            }
        },
        [progress.level, progress.xp]
    );

    const refreshProgress = useCallback(async () => {
        try {
            const data = await apiFetch<DashboardStats>("/users/me/dashboard");
            setProgress({
                xp: data.xp,
                level: data.level,
                streakDays: data.streak_days,
                completedChapters: data.completed_lesson_ids.map((lessonId) => lessonId.toString()),
                dailyXp: data.daily_xp,
                weeklyXp: data.weekly_xp,
                totalLessons: data.total_lessons,
                completedLessons: data.completed_lessons,
                canAccessAdvancedTopics: data.can_access_advanced_topics,
                earnedAdvancedAccess: data.earned_advanced_access,
                advancedUnlockXpRequired: data.advanced_unlock_xp_required,
                advancedUnlockLessonsRequired: data.advanced_unlock_lessons_required,
            });
        } catch (error) {
            console.error("Failed to load progress:", error);
        }
    }, []);

    // Load initial progress from API
    useEffect(() => {
        refreshProgress();
    }, [refreshProgress]);

    const addXP = useCallback(async (amount: number, source: string) => {
        emitXpEvent(amount, source);
        await refreshProgress();
    }, [emitXpEvent, refreshProgress]);

    const completeChapter = useCallback(async (
        chapterId: string,
        options?: {
            attemptId?: number;
            dwellSeconds?: number;
            quizScore?: number;
            challengePassed?: boolean;
        }
    ) => {
        if (progress.completedChapters.includes(chapterId)) {
            return;
        }

        const lessonId = Number(chapterId);
        if (!Number.isInteger(lessonId) || lessonId <= 0) {
            console.error(`Invalid lesson id for chapter completion: ${chapterId}`);
            return;
        }

        try {
            const completion = await apiFetch<LessonCompletionResponse>(`/progress/lessons/${lessonId}/complete`, {
                method: "POST",
                body: JSON.stringify({
                    quiz_score: options?.quizScore ?? 100,
                    challenge_passed: options?.challengePassed ?? true,
                    attempt_id: options?.attemptId ?? null,
                    dwell_seconds: options?.dwellSeconds ?? 0,
                })
            });

            if (completion.xp_awarded > 0) {
                emitXpEvent(
                    completion.xp_awarded,
                    `Completed lesson ${lessonId}`,
                    completion.level,
                    completion.level > progress.level
                );
            }

            await refreshProgress();
        } catch (error) {
            console.error("Failed to complete chapter:", error);
        }
    }, [emitXpEvent, progress.completedChapters, progress.level, refreshProgress]);

    const updateStreak = useCallback(async () => {
        await refreshProgress();
    }, [refreshProgress]);

    return (
        <ProgressContext.Provider value={{ progress, addXP, completeChapter, updateStreak, refreshProgress }}>
            {children}
        </ProgressContext.Provider>
    );
}

export function useProgress() {
    const context = useContext(ProgressContext);
    if (!context) {
        throw new Error('useProgress must be used within ProgressProvider');
    }
    return context;
}
