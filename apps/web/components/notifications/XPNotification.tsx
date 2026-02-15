"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Zap } from "lucide-react";

interface XPNotification {
    id: number;
    amount: number;
    source: string;
    leveledUp: boolean;
    newLevel?: number;
}

export function XPNotification() {
    const [notifications, setNotifications] = useState<XPNotification[]>([]);

    useEffect(() => {
        const handleXPGained = (event: CustomEvent) => {
            const { amount, source, newLevel, leveledUp } = event.detail;

            const notification: XPNotification = {
                id: Date.now(),
                amount,
                source,
                leveledUp,
                newLevel,
            };

            setNotifications(prev => [...prev, notification]);

            // Auto-remove after 3 seconds
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== notification.id));
            }, 3000);
        };

        window.addEventListener('xpGained', handleXPGained as EventListener);
        return () => window.removeEventListener('xpGained', handleXPGained as EventListener);
    }, []);

    return (
        <div className="fixed top-20 right-6 z-50 space-y-2">
            <AnimatePresence>
                {notifications.map((notification) => (
                    <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: 100, scale: 0.8 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 100, scale: 0.8 }}
                        className="rounded-xl border border-green-500/50 bg-green-500/10 backdrop-blur-md p-4 shadow-lg min-w-[250px]"
                    >
                        {notification.leveledUp ? (
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-yellow-500 p-2">
                                    <Trophy className="text-white" size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-yellow-400">Level Up!</p>
                                    <p className="text-sm text-white">You're now Level {notification.newLevel}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-green-500 p-2">
                                    <Zap className="text-white" size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-green-400">+{notification.amount} XP</p>
                                    <p className="text-xs text-slate-300">{notification.source}</p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
