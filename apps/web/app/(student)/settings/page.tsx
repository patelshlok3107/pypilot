"use client";

import { useEffect, useMemo, useState } from "react";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { getStoredUser, setAuth } from "@/lib/auth";
import type {
  AuthUser,
  PlanPriceOut,
  PricingPreviewResponse,
  UserEntitlements,
} from "@/lib/types";

type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  xp: number;
  level: number;
  streak_days: number;
};

type CheckoutResponse = {
  checkout_url: string;
};

type ThemeMode = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

function toThemeMode(value: string | null): ThemeMode {
  if (value === "light" || value === "dark" || value === "system") return value;
  return "system";
}

function toResolvedTheme(value: string | null, mode: ThemeMode): ResolvedTheme {
  if (value === "light" || value === "dark") return value;
  if (mode === "light" || mode === "dark") return mode;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function labelCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [isStudent, setIsStudent] = useState(true);
  const [promoCode, setPromoCode] = useState("");
  const [plans, setPlans] = useState<PlanPriceOut[]>([]);
  const [preview, setPreview] = useState<PricingPreviewResponse | null>(null);
  const [entitlements, setEntitlements] = useState<UserEntitlements | null>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("dark");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    function refreshTheme() {
      const root = document.documentElement;
      const mode = toThemeMode(
        root.getAttribute("data-theme-mode")
          || localStorage.getItem("pypilot_theme_mode")
          || localStorage.getItem("pypilot_theme"),
      );
      const resolved = toResolvedTheme(root.getAttribute("data-theme"), mode);
      setThemeMode(mode);
      setResolvedTheme(resolved);
    }

    refreshTheme();

    const root = document.documentElement;
    const observer = new MutationObserver(refreshTheme);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-theme", "data-theme-mode"],
    });

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", refreshTheme);
    window.addEventListener("storage", refreshTheme);

    return () => {
      observer.disconnect();
      media.removeEventListener("change", refreshTheme);
      window.removeEventListener("storage", refreshTheme);
    };
  }, []);

  async function load() {
    try {
      const [user, planData, entitlementData] = await Promise.all([
        apiFetch<UserProfile>("/users/me"),
        apiFetch<PlanPriceOut[]>("/payments/plans").catch(() => []),
        apiFetch<UserEntitlements>("/users/me/entitlements"),
      ]);
      setProfile(user);
      setFullName(user.full_name);
      setAvatarUrl(user.avatar_url || "");
      setPlans(planData);
      setEntitlements(entitlementData);
    } catch {
      setError("Unable to load settings.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    async function loadPreview() {
      try {
        const quote = await apiFetch<PricingPreviewResponse>("/payments/preview", {
          method: "POST",
          body: JSON.stringify({
            billing_cycle: billingCycle,
            is_student: isStudent,
            promo_code: promoCode.trim() || null,
          }),
        });
        setPreview(quote);
      } catch {
        setPreview(null);
      }
    }

    loadPreview();
  }, [billingCycle, isStudent, promoCode]);

  const activePlan = useMemo(
    () => plans.find((plan) => plan.billing_cycle === billingCycle) || null,
    [billingCycle, plans],
  );

  async function saveProfile() {
    setError("");
    setMessage("");

    try {
      const updated = await apiFetch<UserProfile>("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ full_name: fullName, avatar_url: avatarUrl || null }),
      });

      const existing = getStoredUser<AuthUser>();
      if (existing) {
        setAuth({
          ...existing,
          full_name: updated.full_name,
        });
      }

      setProfile(updated);
      setMessage("Profile updated.");
    } catch {
      setError("Unable to save profile.");
    }
  }

  async function startSubscription() {
    const origin = window.location.origin;
    setError("");
    setMessage("");

    try {
      const response = await apiFetch<CheckoutResponse>("/payments/checkout", {
        method: "POST",
        body: JSON.stringify({
          success_url: `${origin}/settings?billing=success`,
          cancel_url: `${origin}/settings?billing=cancelled`,
          billing_cycle: billingCycle,
          is_student: isStudent,
          promo_code: promoCode.trim() || null,
        }),
      });
      window.location.href = response.checkout_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start subscription checkout.");
    }
  }

  if (!profile) return <p className="text-slate-300">Loading settings...</p>;

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-slate-300">Manage profile, pricing, subscription, and account preferences.</p>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">Profile</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2"
            placeholder="Full name"
          />
          <input
            value={avatarUrl}
            onChange={(event) => setAvatarUrl(event.target.value)}
            className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2"
            placeholder="Avatar URL"
          />
        </div>

        <div className="mt-3 flex items-center gap-3">
          <Button onClick={saveProfile}>Save Profile</Button>
          {message && <p className="text-sm text-brand-200">{message}</p>}
        </div>

        <p className="mt-3 text-sm text-slate-300">Email: {profile.email}</p>
      </Card>

      <Card>
        <h2 className="mb-2 text-lg font-semibold">Appearance</h2>
        <p className="text-sm text-slate-300">
          Choose your workspace theme mode. `System` follows your device setting.
        </p>
        <div className="mt-3">
          <ThemeToggle />
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Active theme:{" "}
          <span className="font-mono text-python-yellow">
            {themeMode === "system"
              ? `${labelCase(themeMode)} -> ${labelCase(resolvedTheme)}`
              : labelCase(themeMode)}
          </span>
        </p>
        <p className="mt-2 text-xs text-slate-400">
          Theme preference is stored on this browser/device.
        </p>
      </Card>

      <section className="grid gap-4 lg:grid-cols-[1fr_420px]">
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Subscription Plans</h2>

          <div className="mb-3 flex gap-2">
            <Button
              variant={billingCycle === "monthly" ? "primary" : "ghost"}
              onClick={() => setBillingCycle("monthly")}
            >
              Monthly
            </Button>
            <Button
              variant={billingCycle === "annual" ? "primary" : "ghost"}
              onClick={() => setBillingCycle("annual")}
            >
              Annual
            </Button>
          </div>

          <div className="space-y-3">
            {plans.map((plan) => (
              <div
                key={plan.code}
                className={`rounded-xl border p-3 ${
                  plan.billing_cycle === billingCycle ? "border-brand-300/40 bg-brand-500/10" : "border-white/10 bg-slate-950/60"
                }`}
              >
                <p className="font-medium">{plan.label}</p>
                <p className="mt-1 text-sm text-slate-300">${plan.amount_usd} / {plan.billing_cycle}</p>
                <ul className="mt-2 space-y-1 text-xs text-slate-300">
                  {plan.features.map((feature) => (
                    <li key={feature}>- {feature}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-semibold">Checkout Preview</h2>
          <label className="mb-2 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isStudent} onChange={(event) => setIsStudent(event.target.checked)} />
            Apply student pricing
          </label>

          <input
            value={promoCode}
            onChange={(event) => setPromoCode(event.target.value.toUpperCase())}
            className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2"
            placeholder="Promo code (optional)"
          />

          {preview ? (
            <div className="mt-3 space-y-1 text-sm text-slate-200">
              <p>Base: ${preview.base_amount_usd}</p>
              <p>Discount: {preview.discount_percent}%</p>
              <p className="font-semibold text-brand-200">Final: ${preview.final_amount_usd}</p>
              <p className="text-xs text-slate-400">Promo: {preview.applied_promo_code || "none"}</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-300">Pricing preview unavailable.</p>
          )}

          <Button className="mt-4 w-full" variant="secondary" onClick={startSubscription}>
            Upgrade with Stripe
          </Button>

          <div className="mt-3 rounded-lg border border-white/10 bg-slate-950/70 p-3 text-xs text-slate-300">
            <p>Current plan: {entitlements?.plan_tier || "free"}</p>
            <p>Subscription status: {entitlements?.subscription_status || "free"}</p>
            <p>AI credits today: {entitlements?.ai_credits_remaining ?? 0}</p>
          </div>

          {activePlan && (
            <p className="mt-2 text-xs text-slate-400">Selected plan code: {activePlan.code}</p>
          )}
        </Card>
      </section>

      {error && <p className="text-sm text-red-300">{error}</p>}
    </div>
  );
}
