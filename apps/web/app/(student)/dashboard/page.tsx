"use client";

import { Flame, Target, Trophy, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ProgressRing } from "@/components/dashboard/ProgressRing";
import { LessonCard } from "@/components/dashboard/LessonCard";
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";
import { useProgress } from "@/contexts/ProgressContext";
import { useEffect, useState } from "react";
import { getStoredUser } from "@/lib/auth";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const { progress, updateStreak } = useProgress();
  const [userName, setUserName] = useState("Student");

  useEffect(() => {
    updateStreak();
    const user = getStoredUser<{ full_name: string }>();
    if (user?.full_name) {
      setUserName(user.full_name);
    }
  }, [updateStreak]);

  const completionRate = progress.totalLessons > 0
    ? Math.round((progress.completedLessons / progress.totalLessons) * 100)
    : 0;

  const dailyGoalProgress = Math.min(Math.round((progress.dailyXp / 50) * 100), 100);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}
        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Welcome back, <span className="premium-gradient-text">{userName}</span>
          </h1>
          <p className="text-slate-400 mt-1">
            {progress.streakDays > 0
              ? `You're on a ${progress.streakDays}-day lesson streak! Keep it up.`
              : "Ready to explore Python in your workspace?"}
          </p>
        </div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2 self-start rounded-full border border-white/5 bg-white/5 px-4 py-2 shadow-lg backdrop-blur-md md:self-auto"
        >
          <Flame
            className={progress.streakDays > 0 ? "text-orange-500" : "text-slate-500"}
            size={20}
            fill="currentColor"
          />
          <span className={`font-bold ${progress.streakDays > 0 ? "text-orange-500" : "text-slate-400"}`}>
            {progress.streakDays} Day{progress.streakDays !== 1 ? 's' : ''} Streak
          </span>
        </motion.div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Daily Goal"
          value={`${dailyGoalProgress}%`}
          subtitle={`${progress.dailyXp}/50 XP earned`}
          icon={Target}
          delay={0.1}
          color={dailyGoalProgress >= 100 ? "text-green-400" : "text-blue-400"}
        />
        <StatCard
          title="Total XP"
          value={progress.xp.toLocaleString()}
          subtitle={`Rank: Level ${progress.level}`}
          icon={Trophy}
          delay={0.2}
          color="text-yellow-400"
        />
        <StatCard
          title="Chapters"
          value={`${progress.completedLessons}/${progress.totalLessons}`}
          subtitle="Progress Status"
          icon={TrendingUp}
          delay={0.3}
          color={progress.completedLessons > 0 ? "text-cyan-400" : "text-slate-400"}
        />
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.02 }}
          className="glass-card p-4 flex items-center justify-between border-white/10"
        >
          <div>
            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Course Progress</p>
            <h4 className="mt-1 text-2xl font-bold text-white">{completionRate}%</h4>
          </div>
          <div className="scale-75 origin-right">
            <ProgressRing progress={completionRate} size={80} strokeWidth={6} />
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 space-y-8"
        >
          <LessonCard />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div
              whileHover={{ y: -5, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
              className="glass-card p-6 h-48 flex flex-col justify-center items-center text-center cursor-pointer group border-white/10"
            >
              <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                <Trophy className="text-purple-400" size={24} />
              </div>
              <h3 className="font-semibold text-white">Weekly Challenge</h3>
              <p className="text-sm text-slate-400 mt-1">Join 450+ students in the "Algorithm Arena"</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -5, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
              className="glass-card p-6 h-48 flex flex-col justify-center items-center text-center cursor-pointer group border-white/10"
            >
              <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <TrendingUp className="text-blue-400" size={24} />
              </div>
              <h3 className="font-semibold text-white">Skill Analysis</h3>
              <p className="text-sm text-slate-400 mt-1">View your strong and weak topics</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Sidebar Area */}
        <motion.div
          variants={{ hidden: { opacity: 0, x: 20 }, show: { opacity: 1, x: 0 } }}
          transition={{ delay: 0.6 }}
          className="space-y-8"
        >
          <div className="glass-card p-6 border-white/10">
            <ActivityTimeline />
          </div>

          {/* Leaderboard Teaser */}
          <div className="glass-card bg-gradient-to-b from-white/5 to-transparent p-6 border-white/10">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Trophy size={18} className="text-yellow-500" />
              Top Students
            </h3>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-extra-bold ${i === 1 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' :
                    i === 2 ? 'bg-slate-300/20 text-slate-300 border border-slate-300/30' :
                      'bg-orange-500/20 text-orange-500 border border-orange-500/30'
                    }`}>
                    {i}
                  </div>
                  <div className="flex-1">
                    <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${100 - (i * 15)}%` }}
                        transition={{ duration: 1, delay: 0.8 + (i * 0.1) }}
                        className={`h-full ${i === 1 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                      />
                    </div>
                  </div>
                  <div className="text-xs text-slate-300 font-mono">1{9 - i}00 XP</div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">
              VIEW LEADERBOARD
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
