"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { ProgressProvider } from "@/contexts/ProgressContext";
import { XPNotification } from "@/components/notifications/XPNotification";
import { AuthGate } from "@/components/shell/auth-gate";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProgressProvider>
      <XPNotification />
      <AuthGate>
        <DashboardLayout>{children}</DashboardLayout>
      </AuthGate>
    </ProgressProvider>
  );
}
