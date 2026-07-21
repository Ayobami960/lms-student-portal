"use client";

import {
  ArrowUpRight,
  ArrowDownRight,
  Users,
  BookOpen,
  GraduationCap,
  Award,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalCertificates: number;
  totalUsersTrend?: number;
  totalCoursesTrend?: number;
  totalEnrollmentsTrend?: number;
  totalCertificatesTrend?: number;
}

interface StatsCardsProps {
  stats?: DashboardStats;
  isLoading?: boolean;
}

export default function StatsCards({ stats, isLoading }: StatsCardsProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-6">
            <div className="flex justify-between items-center mb-4">
              <Skeleton className="h-4 w-20 rounded-md" />
              <Skeleton className="h-4 w-12 rounded-md" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      <KPICard title="Total Users" value={(stats.totalUsers ?? 0).toLocaleString()} trend={stats.totalUsersTrend} icon={Users} accent="var(--primary)" />
      <KPICard title="Total Courses" value={(stats.totalCourses ?? 0).toLocaleString()} trend={stats.totalCoursesTrend} icon={BookOpen} accent="var(--chart-2)" />
      <KPICard title="Total Enrollments" value={(stats.totalEnrollments ?? 0).toLocaleString()} trend={stats.totalEnrollmentsTrend} icon={GraduationCap} accent="var(--chart-3)" />
      <KPICard title="Certificates Issued" value={(stats.totalCertificates ?? 0).toLocaleString()} trend={stats.totalCertificatesTrend} icon={Award} accent="var(--chart-4)" />
    </div>
  );
}

function KPICard({
  title,
  value,
  trend,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string;
  trend?: number;
  icon: LucideIcon;
  accent: string;
}) {
  const hasTrend = typeof trend === "number";
  const isUp = (trend ?? 0) >= 0;
  const displayTrend = hasTrend ? `${isUp ? "+" : ""}${trend}%` : null;

  return (
    <div className="card p-6 flex flex-col justify-between transition-all hover:shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
          {title}
        </h3>
        {hasTrend && (
          <div className={cn("flex items-center gap-1 text-xs font-bold", isUp ? "text-primary" : "text-destructive")}>
            {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {displayTrend}
          </div>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: `color-mix(in oklch, ${accent} 15%, transparent)`, color: accent }}
        >
          <Icon className="w-6 h-6" />
        </div>
        <span className="text-2xl md:text-3xl font-black text-card-foreground tracking-tight">
          {value}
        </span>
      </div>
    </div>
  );
}