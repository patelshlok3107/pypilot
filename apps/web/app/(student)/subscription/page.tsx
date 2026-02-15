"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CreditCard, Rocket, Shield, Info } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { SubscriptionCard } from "@/components/subscription/SubscriptionCard";

interface Plan {
    code: string;
    label: string;
    amount_usd: number;
    amount_inr: number;
    billing_cycle: string;
    features: string[];
}

interface Entitlements {
    plan_tier: string;
    subscription_status: string;
}

export default function SubscriptionPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [plansData, entData] = await Promise.all([
                    apiFetch<Plan[]>("/payments/plans"),
                    apiFetch<Entitlements>("/users/me/entitlements")
                ]);
                setPlans(plansData);
                setEntitlements(entData);
            } catch (error) {
                console.error("Failed to fetch subscription data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSubscribe = async (planCode: string, billingCycle: string) => {
        if (planCode === "free") return;

        setActionLoading(planCode);
        try {
            const response = await apiFetch<{ checkout_url: string }>("/payments/checkout", {
                method: "POST",
                body: JSON.stringify({
                    success_url: window.location.origin + "/dashboard?payment=success",
                    cancel_url: window.location.origin + "/subscription?payment=cancelled",
                    billing_cycle: billingCycle,
                })
            });
            window.location.href = response.checkout_url;
        } catch (error) {
            console.error("Checkout failed:", error);
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-500" />
                <p className="mt-4 text-slate-400">Loading subscription details...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto py-10 px-6">
            <div className="mb-12 text-center">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl font-bold text-white tracking-tight"
                >
                    Choose Your <span className="premium-gradient-text">Learning Path</span>
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="mt-4 text-slate-400 max-w-2xl mx-auto"
                >
                    Unlock advanced AI features, premium career tracks, and certified learning milestones.
                    Switch plans anytime to suit your growth.
                </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map((plan, idx) => (
                    <motion.div
                        key={plan.code}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * idx }}
                    >
                        <SubscriptionCard
                            title={plan.label}
                            priceUsd={plan.amount_usd}
                            priceInr={plan.amount_inr}
                            billingCycle={plan.billing_cycle}
                            features={plan.features}
                            isActive={entitlements?.plan_tier === plan.code}
                            isPopular={plan.code === "pro-monthly"}
                            onSubscribe={() => handleSubscribe(plan.code, plan.billing_cycle)}
                            loading={actionLoading === plan.code}
                        />
                    </motion.div>
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-16 rounded-2xl border border-white/10 bg-white/5 p-8 flex flex-col md:flex-row items-center gap-6"
            >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400">
                    <Shield size={24} />
                </div>
                <div className="flex-grow text-center md:text-left">
                    <h3 className="text-lg font-bold text-white">Safe & Secure Payments</h3>
                    <p className="text-sm text-slate-400 mt-1">
                        All transactions are processed through Stripe for bank-level security.
                        Your subscription will be activated immediately after payment.
                    </p>
                </div>
                <div className="flex items-center gap-4 text-slate-500 opacity-50 select-none grayscale">
                    <CreditCard size={32} />
                    <Info size={24} />
                </div>
            </motion.div>
        </div>
    );
}
