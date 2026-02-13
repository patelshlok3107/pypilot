"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { apiFetch } from "@/lib/api";
import { clearAuth, setAuth } from "@/lib/auth";
import type { AuthUser, OnboardingStatus } from "@/lib/types";

type AuthGateProps = {
  children: React.ReactNode;
};

export function AuthGate({ children }: AuthGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    async function verifySession() {
      try {
        const sessionUser = await apiFetch<AuthUser>("/auth/session", { method: "GET" }, false);
        setAuth(sessionUser);
        setUser(sessionUser);

        const onboarding = await apiFetch<OnboardingStatus>("/onboarding/status");
        const onOnboardingPage = pathname === "/onboarding";
        if (!onboarding.onboarding_complete && !onOnboardingPage) {
          router.replace("/onboarding");
          return;
        }
        if (onboarding.onboarding_complete && onOnboardingPage) {
          router.replace("/dashboard");
          return;
        }
      } catch {
        await clearAuth();
        router.replace(`/login?next=${encodeURIComponent(pathname || "/dashboard")}`);
        return;
      }

      setLoading(false);
    }

    void verifySession();
  }, [pathname, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        Loading workspace...
      </div>
    );
  }

  return <>{children}</>;
}
