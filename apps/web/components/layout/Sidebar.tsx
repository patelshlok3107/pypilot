"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    BookOpen,
    Code2,
    Users,
    Terminal,
    BarChart3,
    Bot,
    Menu,
    X,
    ChevronRight,
    LogOut,
    CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { clearAuth } from "@/lib/auth";

const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard", color: "text-blue-400" },
    { name: "Subscription", icon: CreditCard, href: "/subscription", color: "text-amber-400" },
    { name: "Learn", icon: BookOpen, href: "/learn", color: "text-green-400" },
    { name: "Practice", icon: Code2, href: "/practice", color: "text-neutral-400" },
    { name: "Squad", icon: Users, href: "/squad", color: "text-purple-400" },
    { name: "Playground", icon: Terminal, href: "/playground", color: "text-orange-400" },
    { name: "Report", icon: BarChart3, href: "/report", color: "text-pink-400" },
    { name: "AI Tutor", icon: Bot, href: "/ai-tutor", color: "text-cyan-400" },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleSignOut = async () => {
        await clearAuth();
        router.replace("/login");
    };

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsMobileOpen(true)}
                className="fixed left-4 top-4 z-50 rounded-full bg-glass-200 p-2 text-white backdrop-blur-md md:hidden"
            >
                <Menu size={24} />
            </button>

            {/* Mobile Overlay */}
            <AnimatePresence>
                {isMobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileOpen(false)}
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Container */}
            <motion.aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/5 bg-[#0a0a0f]/90 backdrop-blur-xl transition-all duration-300 md:translate-x-0",
                    isMobileOpen ? "translate-x-0" : "-translate-x-full",
                    isCollapsed ? "w-20" : "w-64"
                )}
            >
                {/* Logo Area */}
                <div className="flex h-20 items-center justify-between px-6">
                    {!isCollapsed && (
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-python-blue to-python-yellow flex items-center justify-center font-bold text-black">
                                P
                            </div>
                            <span className="text-xl font-bold tracking-tight text-white">PyPilot</span>
                        </Link>
                    )}
                    {isCollapsed && (
                        <div className="mx-auto h-8 w-8 rounded-lg bg-gradient-to-br from-python-blue to-python-yellow flex items-center justify-center font-bold text-black">
                            P
                        </div>
                    )}

                    <button
                        onClick={() => setIsMobileOpen(false)}
                        className="md:hidden text-white/70 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 space-y-2 px-3 py-6">
                    {menuItems.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsMobileOpen(false)}
                                className={cn(
                                    "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-white/10 text-white shadow-glow"
                                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                                )}
                            >
                                <item.icon
                                    size={20}
                                    className={cn(
                                        "transition-colors",
                                        isActive ? item.color : "group-hover:text-white"
                                    )}
                                />
                                {!isCollapsed && (
                                    <span>{item.name}</span>
                                )}
                                {isActive && !isCollapsed && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute left-0 h-8 w-1 rounded-r-full bg-python-blue"
                                    />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Toggle Collapse (Desktop Only) */}
                <div className="hidden border-t border-white/5 p-4 md:block">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="flex w-full items-center justify-center rounded-lg py-2 text-slate-500 hover:bg-white/5 hover:text-white"
                    >
                        {isCollapsed ? <ChevronRight size={20} /> : <span className="text-xs uppercase tracking-wider">Collapse</span>}
                    </button>
                </div>

                {/* User Profile / Logout */}
                <div className="border-t border-white/5 p-4">
                    <button
                        onClick={() => {
                            void handleSignOut();
                        }}
                        className={cn("flex w-full items-center gap-3 rounded-xl p-2 transition-colors hover:bg-red-500/10 hover:text-red-400", isCollapsed ? "justify-center" : "")}
                    >
                        <LogOut size={20} className="text-slate-400 group-hover:text-red-400" />
                        {!isCollapsed && <span className="text-sm font-medium text-slate-400">Sign Out</span>}
                    </button>
                </div>
            </motion.aside>
        </>
    );
}
