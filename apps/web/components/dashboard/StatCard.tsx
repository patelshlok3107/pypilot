"use client";

import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    color?: string;
    subtitle?: string;
    delay?: number;
}

export function StatCard({ title, value, icon: Icon, trend, color = "text-white", subtitle, delay = 0 }: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
            className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-5 backdrop-blur-sm transition-all shadow-lg hover:shadow-blue-500/10"
        >
            {/* Animated background glow on hover */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-500/0 to-purple-500/0 opacity-0 transition-opacity group-hover:from-blue-500/5 group-hover:to-purple-500/5 group-hover:opacity-100" />

            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors uppercase tracking-wider">{title}</p>
                    <motion.h4
                        key={value}
                        initial={{ scale: 0.9, opacity: 0.5 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="mt-2 text-3xl font-bold text-white tracking-tight"
                    >
                        {value}
                    </motion.h4>
                    {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
                </div>
                <motion.div
                    whileHover={{ rotate: 12, scale: 1.1 }}
                    className={`rounded-xl bg-white/5 p-3 transition-colors group-hover:bg-white/10 ${color}`}
                >
                    <Icon size={24} />
                </motion.div>
            </div>
            {trend && (
                <div className="mt-4 flex items-center text-xs font-medium text-green-400">
                    <span>{trend}</span>
                </div>
            )}
        </motion.div>
    );
}
