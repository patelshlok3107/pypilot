"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { apiFetch } from "@/lib/api";
import { getStoredUser, getToken } from "@/lib/auth";
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
      const token = getToken();
      const stored = getStoredUser<AuthUser>();
      if (!token || !stored) {
        router.replace(`/login?next=${encodeURIComponent(pathname || "/dashboard")}`);
        return;
      }

      setUser(stored);

      try {
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
        // If onboarding status fails, keep user in workspace and let pages render.
      }

      setLoading(false);
    }

    verifySession();
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
