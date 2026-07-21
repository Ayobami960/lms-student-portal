"use client";

import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useGetDashboardAnalyticsQuery } from "../../../store/api/apiSlice";

interface RoleCount {
  role: string;
  _count: number;
}

interface DashboardAnalyticsResponse {
  usersByRole: RoleCount[];
}

export default function AdminAnalyticsPage() {
  const { data, isLoading } = useGetDashboardAnalyticsQuery(undefined, {
    pollingInterval: 60000,
  }) as { data?: { data: DashboardAnalyticsResponse }; isLoading: boolean };

  const chartData =
    data?.data?.usersByRole?.map((r) => ({ role: r.role, count: r._count })) ?? [];

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Analytics</h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        Global platform metrics.
      </p>

      <div className="bg-white dark:bg-card rounded-lg p-6 shadow-sm border border-border">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-foreground tracking-tight">
            Users by Role
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
          >
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRole" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="currentColor"
                className="opacity-10 dark:opacity-20"
              />
              <XAxis
                dataKey="role"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "currentColor" }}
                className="text-muted-foreground"
                dy={10}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "currentColor" }}
                className="text-muted-foreground"
              />
              <Tooltip
                formatter={(value) => [value, "Users"]}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--card)",
                  color: "var(--foreground)",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                }}
                cursor={{ fill: "currentColor", opacity: 0.05 }}
              />
              <Bar dataKey="count" fill="url(#colorRole)" radius={[8, 8, 0, 0]} maxBarSize={64} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}