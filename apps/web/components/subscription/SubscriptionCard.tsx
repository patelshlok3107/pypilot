"use client";

import React from "react";
import { Check, Zap } from "lucide-react";
import { motion } from "framer-motion";

interface SubscriptionCardProps {
    title: string;
    priceUsd: number;
    priceInr: number;
    billingCycle: string;
    features: string[];
    isActive: boolean;
    isPopular?: boolean;
    onSubscribe: () => void;
    loading?: boolean;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
    title,
    priceUsd,
    priceInr,
    billingCycle,
    features,
    isActive,
    isPopular,
    onSubscribe,
    loading
}) => {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className={`relative flex flex-col h-full rounded-2xl border p-8 transition-all ${isActive
                    ? "border-blue-500 bg-blue-500/5 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
        >
            {isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-blue-600 text-[10px] font-bold uppercase tracking-widest text-white ring-4 ring-[#020617]">
                    Most Popular
                </div>
            )}

            <div className="mb-8">
                <h3 className={`text-xl font-bold ${isActive ? "text-blue-400" : "text-white"}`}>{title}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">${priceUsd}</span>
                    <span className="text-slate-400 text-sm">/ {billingCycle === "annual" ? "year" : "month"}</span>
                </div>
                {priceInr > 0 && (
                    <p className="mt-1 text-xs text-slate-500 font-medium">Approx. ₹{priceInr} INR</p>
                )}
            </div>

            <div className="flex-grow space-y-4 mb-8">
                {features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                        <div className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${isActive ? "bg-blue-500/20 text-blue-400" : "bg-white/10 text-slate-400"}`}>
                            <Check size={12} strokeWidth={3} />
                        </div>
                        <span className="text-sm text-slate-300">{feature}</span>
                    </div>
                ))}
            </div>

            <button
                onClick={onSubscribe}
                disabled={isActive || loading}
                className={`w-full rounded-xl py-4 font-bold transition-all ${isActive
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 cursor-default"
                        : "bg-white text-black hover:bg-slate-200"
                    }`}
            >
                {isActive ? (
                    <span className="flex items-center justify-center gap-2">
                        <Zap size={16} className="fill-current" />
                        Currently Active
                    </span>
                ) : (
                    loading ? "Processing..." : `Upgrade to ${title}`
                )}
            </button>
        </motion.div>
    );
};
