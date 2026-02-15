"use client";

import { useState, useEffect } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, Radar, BarChart, Bar } from "recharts";
import { TrendingUp, Clock, Target, Calendar } from "lucide-react";

const progressData = [
    { day: "Mon", xp: 0 },
    { day: "Tue", xp: 0 },
    { day: "Wed", xp: 0 },
    { day: "Thu", xp: 0 },
    { day: "Fri", xp: 0 },
    { day: "Sat", xp: 0 },
    { day: "Sun", xp: 0 },
];

const skillData = [
    { subject: "Syntax", A: 0, fullMark: 100 },
    { subject: "Logic", A: 0, fullMark: 100 },
    { subject: "OOP", A: 0, fullMark: 100 },
    { subject: "DS & Algo", A: 0, fullMark: 100 },
    { subject: "Libraries", A: 0, fullMark: 100 },
    { subject: "Debugging", A: 0, fullMark: 100 },
];

export default function ReportPage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-slate-400">Loading...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-floatUp pb-10">
            <h1 className="text-3xl font-bold text-white">Learning Report</h1>

            {/* Top Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                    <p className="flex items-center gap-2 text-sm text-slate-400">
                        <TrendingUp size={16} /> Total XP
                    </p>
                    <p className="mt-2 text-2xl font-bold text-white">0</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                    <p className="flex items-center gap-2 text-sm text-slate-400">
                        <Clock size={16} /> Time Spent
                    </p>
                    <p className="mt-2 text-2xl font-bold text-white">0h 0m</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                    <p className="flex items-center gap-2 text-sm text-slate-400">
                        <Target size={16} /> Accuracy
                    </p>
                    <p className="mt-2 text-2xl font-bold text-white">-</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                    <p className="flex items-center gap-2 text-sm text-slate-400">
                        <Calendar size={16} /> Active Days
                    </p>
                    <p className="mt-2 text-2xl font-bold text-white">0</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* XP Trend Chart */}
                <div className="rounded-2xl border border-white/5 bg-gradient-to-b from-white/5 to-transparent p-6 h-[400px]">
                    <h3 className="mb-6 font-bold text-white">Weekly Activity (XP)</h3>
                    <ResponsiveContainer width="100%" height="85%">
                        <AreaChart data={progressData}>
                            <defs>
                                <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3776ab" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#3776ab" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="day" stroke="#94a3b8" tickLine={false} axisLine={false} />
                            <YAxis hide />
                            <Tooltip
                                contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#fff" }}
                                itemStyle={{ color: "#fff" }}
                            />
                            <Area type="monotone" dataKey="xp" stroke="#3776ab" fillOpacity={1} fill="url(#colorXp)" strokeWidth={3} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Skill Radar */}
                <div className="rounded-2xl border border-white/5 bg-gradient-to-b from-white/5 to-transparent p-6 h-[400px]">
                    <h3 className="mb-6 font-bold text-white">Skill Analysis</h3>
                    <ResponsiveContainer width="100%" height="85%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={skillData}>
                            <PolarGrid stroke="#334155" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                            <Radar name="My Skills" dataKey="A" stroke="#ffd43b" fill="#ffd43b" fillOpacity={0.4} />
                            <Tooltip cursor={{ stroke: '#8884d8' }} contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#fff" }} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* AI Feedback Section */}
            <div className="rounded-2xl border border-white/5 bg-white/5 p-6 border-l-4 border-l-purple-500">
                <h3 className="font-bold text-white text-lg mb-2">AI Tutor Insight</h3>
                <p className="text-slate-300">
                    "Welcome! Once you start solving challenges and completing lessons, I'll provide personalized insights on your progress here.
                    Try starting with the <strong className="text-white">Basic Python</strong> module!"
                </p>
            </div>
        </div>
    );
}
