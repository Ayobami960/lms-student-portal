"use client";

import Link from "next/link";
import { Clock, ArrowRight, TrendingUp } from "lucide-react";
import { useGetAdminDashboardAnalyticsQuery } from "@/store/api/apiSlice";
import StatsCards from "@/components/dashboard/StatsCards";

export default function AdminDashboardPage() {
  const { data, isLoading, error } = useGetAdminDashboardAnalyticsQuery();
  const stats = data?.data;

  return (
    <div>
      <div className="mb-6 rounded-xl gradient-primary p-6 text-primary-foreground shadow-lg shadow-primary/20 sm:p-8">
        <p className="text-sm font-medium text-primary-foreground/80">Platform Overview</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Welcome Back </h1>
        <p className="mt-2 max-w-xl text-sm text-primary-foreground/90">
          Global analytics, user management, and course oversight across the entire LMS platform.
        </p>
      </div>

      {!isLoading && (stats?.pendingInstructors ?? 0) > 0 && (
        <Link
          href="/admin/users"
          className="mb-6 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 transition hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30"
        >
          <span className="flex items-center gap-2 font-medium">
            <Clock size={16} /> {stats?.pendingInstructors} instructor{stats?.pendingInstructors > 1 ? "s" : ""} awaiting approval
          </span>
          <span className="flex items-center gap-1">Review now <ArrowRight size={14} /></span>
        </Link>
      )}

      <StatsCards stats={stats} isLoading={isLoading} />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <TrendingUp size={16} className="text-primary" /> Users by Role
          </h2>
          <div className="space-y-3">
            {stats?.usersByRole?.map((r: any) => {
              const pct = stats.totalUsers ? Math.round((r._count / stats.totalUsers) * 100) : 0;
              return (
                <div key={r.role}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{r.role}</span>
                    <span className="font-medium text-card-foreground">{r._count}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            }) ?? <p className="text-sm text-muted-foreground">No data yet.</p>}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Quick actions</h2>
          <div className="space-y-2">
            <Link href="/admin/users" className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm transition-colors hover:bg-accent hover:text-accent-foreground">
              Manage users & approve instructors <ArrowRight size={14} className="text-muted-foreground" />
            </Link>
            <Link href="/courses" className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm transition-colors hover:bg-accent hover:text-accent-foreground">
              Review platform courses <ArrowRight size={14} className="text-muted-foreground" />
            </Link>
            <Link href="/analytics" className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm transition-colors hover:bg-accent hover:text-accent-foreground">
              View detailed analytics <ArrowRight size={14} className="text-muted-foreground" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
