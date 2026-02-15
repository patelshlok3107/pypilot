"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

interface UserProgress {
    xp: number;
    level: number;
    streakDays: number;
    completedChapters: string[];
    dailyXp: number;
    weeklyXp: number;
    totalLessons: number;
    completedLessons: number;
}

interface ProgressContextType {
    progress: UserProgress;
    addXP: (amount: number, source: string) => void;
    completeChapter: (chapterId: string) => void;
    updateStreak: () => void;
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
        totalLessons: 42,
        completedLessons: 0,
    });

    const refreshProgress = useCallback(async () => {
        if (!getToken()) return;

        try {
            const data = await apiFetch<any>("/users/me/dashboard");
            setProgress({
                xp: data.xp,
                level: data.level,
                streakDays: data.streak_days,
                completedChapters: [], // Backend doesn't currently return this in dashboard stats, might need another endpoint
                dailyXp: Math.floor(data.weekly_goal_progress * 0.5), // Mock mapping if needed
                weeklyXp: data.xp, // Mock mapping
                totalLessons: data.total_lessons,
                completedLessons: data.completed_lessons,
            });
        } catch (error) {
            console.error('Failed to load progress:', error);
        }
    }, []);

    // Load initial progress from API
    useEffect(() => {
        refreshProgress();
    }, [refreshProgress]);

    const calculateLevel = (xp: number): number => {
        return Math.floor(xp / 1000) + 1;
    };

    const addXP = async (amount: number, source: string) => {
        // Optimistic update
        const newXp = progress.xp + amount;
        const newLevel = calculateLevel(newXp);

        const oldLevel = progress.level;

        setProgress(prev => ({
            ...prev,
            xp: newXp,
            level: newLevel,
            dailyXp: prev.dailyXp + amount,
            weeklyXp: prev.weeklyXp + amount,
        }));

        // Show notification
        if (typeof window !== 'undefined') {
            const event = new CustomEvent('xpGained', {
                detail: { amount, source, newXp, newLevel, leveledUp: newLevel > oldLevel }
            });
            window.dispatchEvent(event);
        }

        // Backend sync would ideally happen here via a dedicated endpoint
        // For now, we rely on the specific action endpoints (like complete_lesson) 
        // to update the backend, and refreshProgress to sync everything back.
    };

    const completeChapter = async (chapterId: string) => {
        if (progress.completedChapters.includes(chapterId)) {
            return;
        }

        try {
            // Assuming chapterId can be mapped to a lesson_id for the API
            const lessonId = parseInt(chapterId.split('-').pop() || "1");
            await apiFetch(`/progress/lessons/${lessonId}/complete`, {
                method: "POST",
                body: JSON.stringify({ quiz_score: 100, challenge_passed: true })
            });

            // Refresh to get authoritative data from backend
            await refreshProgress();
        } catch (error) {
            console.error("Failed to complete chapter:", error);
            // Fallback to local update if API fails (maybe not ideal for isolation, but good for UX)
            addXP(100, `Completed: ${chapterId}`);
        }
    };

    const updateStreak = async () => {
        // Backend handles streak updates usually on lesson completion or login
        // We just refresh to see the latest
        await refreshProgress();
    };

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
