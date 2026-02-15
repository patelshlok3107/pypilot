"use client";

import { useEffect, useState } from "react";

import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import type { Achievement, GamificationSummary } from "@/lib/types";

export default function AchievementsPage() {
  const [summary, setSummary] = useState<GamificationSummary | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    async function load() {
      const [summaryData, achievementsData] = await Promise.all([
        apiFetch<GamificationSummary>("/gamification/summary"),
        apiFetch<Achievement[]>("/gamification/achievements"),
      ]);
      setSummary(summaryData);
      setAchievements(achievementsData);
    }
    load();
  }, []);

  if (!summary) return <p className="text-slate-300">Loading achievements...</p>;

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-xl font-semibold">Achievements</h1>
        <p className="mt-1 text-sm text-slate-300">
          Current XP: <span className="text-brand-300">{summary.xp}</span> | Level {summary.level} | Streak {summary.streak_days} days
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {achievements.map((item) => (
          <Card
            key={item.id}
            className={item.unlocked ? "border-brand-400/30 bg-brand-500/10" : "opacity-70"}
          >
            <p className="text-sm uppercase tracking-wide text-slate-300">{item.icon}</p>
            <h2 className="mt-1 text-lg font-semibold">{item.name}</h2>
            <p className="mt-1 text-sm text-slate-300">{item.description}</p>
            <p className="mt-3 text-xs text-brand-300">Reward: +{item.xp_bonus} XP</p>
            <p className="mt-1 text-xs">{item.unlocked ? "Unlocked" : "Locked"}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
