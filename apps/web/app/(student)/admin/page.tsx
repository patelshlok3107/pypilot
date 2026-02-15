"use client";

import { useEffect, useState } from "react";

import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";

type Analytics = {
  total_users: number;
  paid_users: number;
  active_users_last_7_days: number;
  total_submissions: number;
  average_completion_rate: number;
};

type Subscription = {
  user_id: string;
  email: string;
  plan: string;
  status: string;
  current_period_end: string | null;
};

export default function AdminPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [analyticsData, subscriptionData] = await Promise.all([
          apiFetch<Analytics>("/admin/analytics"),
          apiFetch<Subscription[]>("/admin/subscriptions"),
        ]);
        setAnalytics(analyticsData);
        setSubscriptions(subscriptionData);
      } catch {
        setDenied(true);
      }
    }
    load();
  }, []);

  if (denied) {
    return (
      <Card>
        <p className="text-sm text-amber-300">Admin access required for this section.</p>
      </Card>
    );
  }

  if (!analytics) {
    return <p className="text-slate-300">Loading admin panel...</p>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-xl font-semibold">Admin Panel</h1>
        <p className="mt-1 text-sm text-slate-300">Platform analytics, course controls, and subscriptions.</p>
      </Card>

      <section className="grid gap-4 md:grid-cols-5">
        <Card>
          <p className="text-xs text-slate-400">Users</p>
          <p className="text-2xl font-semibold">{analytics.total_users}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-400">Paid</p>
          <p className="text-2xl font-semibold">{analytics.paid_users}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-400">Active (7d)</p>
          <p className="text-2xl font-semibold">{analytics.active_users_last_7_days}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-400">Submissions</p>
          <p className="text-2xl font-semibold">{analytics.total_submissions}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-400">Avg Completion</p>
          <p className="text-2xl font-semibold">{analytics.average_completion_rate}%</p>
        </Card>
      </section>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">Subscription Tracking</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-300">
              <tr>
                <th className="p-2">Email</th>
                <th className="p-2">Plan</th>
                <th className="p-2">Status</th>
                <th className="p-2">Period End</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => (
                <tr key={`${sub.user_id}-${sub.current_period_end || "none"}`} className="border-t border-white/10">
                  <td className="p-2">{sub.email}</td>
                  <td className="p-2">{sub.plan}</td>
                  <td className="p-2">{sub.status}</td>
                  <td className="p-2">{sub.current_period_end || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
