import { useMemo } from "react";
import { Navigate } from "react-router";
import { BookMarked, BookOpen, CheckCircle2, TrendingUp, Award, Users, ClipboardList, Star } from "lucide-react";

import {
  useGetDashboardAnalyticsQuery,
  useGetProgressAnalyticsQuery,
  useGetPerformanceAnalyticsQuery,
} from "../store/api/apiSlice";
import { useAppSelector } from "../hooks/redux";

import { RevisionAlert } from "../components/dashboard/RevisionAlert";
import { SummaryCardsGrid } from "../components/dashboard/SummaryCardsGrid";
import { CoursesOverview } from "../components/dashboard/CoursesOverview";
import { AssignmentPerformanceChart } from "../components/dashboard/AssignmentPerformanceChart";
import { CourseCompanion } from "../components/dashboard/CourseCompanion";
import type { SummaryCardData } from "../types";

export default function DashboardPage() {
  const user = useAppSelector((s) => s.auth.user);
  const isInstructor = user?.role === "INSTRUCTOR";
  const isStudent = user?.role === "STUDENT";

  const { data: statsRes, isLoading: statsLoading } = useGetDashboardAnalyticsQuery();
  const {
    data: progressRes,
    isLoading: progressLoading,
    isError: progressError,
  } = useGetProgressAnalyticsQuery(undefined, { skip: isInstructor });
  const { data: performanceRes } = useGetPerformanceAnalyticsQuery(undefined, { skip: isInstructor });

  const stats = statsRes?.data;
  const progress = progressRes?.data;

  const performanceChartData = useMemo(
    () =>
      (performanceRes?.data ?? []).slice(0, 8).map((p) => ({
        name: p.assignment?.slice(0, 14) ?? "Assignment",
        score: p.percentage ?? 0,
      })),
    [performanceRes]
  );

  const summaryCards: SummaryCardData[] = useMemo(
    () =>
      isInstructor
        ? [
          { label: "Your Courses", value: stats?.totalCourses ?? 0, icon: BookOpen, color: "bg-primary/10 text-primary" },
          { label: "Total Students", value: stats?.totalStudents ?? 0, icon: Users, color: "bg-secondary/10 text-secondary" },
          { label: "To Grade", value: stats?.submissionsToGrade ?? 0, icon: ClipboardList, color: "bg-tertiary/10 text-tertiary" },
          { label: "Avg. Rating", value: (stats?.averageRating ?? 0).toFixed(1), icon: Star, color: "bg-primary/10 text-primary" },
        ]
        : [
          { label: "Enrolled Courses", value: stats?.totalCourses ?? 0, icon: BookMarked, color: "bg-primary/10 text-primary" },
          { label: "Completed Courses", value: stats?.completedCourses ?? 0, icon: CheckCircle2, color: "bg-secondary/10 text-secondary" },
          { label: "Average Progress", value: `${stats?.averageProgress ?? 0}%`, icon: TrendingUp, color: "bg-tertiary/10 text-tertiary" },
          { label: "Certificates Earned", value: stats?.certificatesEarned ?? 0, icon: Award, color: "bg-primary/10 text-primary" },
        ],
    [isInstructor, stats]
  );

 
  if (user && !isStudent && !isInstructor) {
    return <Navigate to="/" replace />;
  }

  const firstName = user?.name?.split(" ")[0] ?? "";

  return (
    <div className="space-y-lg relative animate-fade-in">
      <section className="mb-lg">
        <h2 className="text-3xl font-semibold text-on-surface mb-1">Welcome back, {firstName} 👋</h2>
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <p className="text-lg text-on-surface-variant">
            {isInstructor ? "Here's how your courses are doing." : "Here's where you left off."}
          </p>
          {!isInstructor && stats?.averageProgress !== undefined && (
            <div className="flex-1 max-w-xs h-2 bg-outline-variant rounded-full overflow-hidden">
              <div
                className="h-full bg-secondary rounded-full transition-all duration-500"
                style={{ width: `${stats.averageProgress}%` }}
              />
            </div>
          )}
        </div>
      </section>

      {!isInstructor && !statsLoading && <RevisionAlert count={stats?.needsRevision ?? 0} />}

      <SummaryCardsGrid cards={summaryCards} isLoading={statsLoading} />

      {isInstructor ? (
        <CoursesOverview role="INSTRUCTOR" courses={stats?.courses} />
      ) : (
        <CoursesOverview role="STUDENT" progress={progress} isLoading={progressLoading} isError={progressError} />
      )}

      {!isInstructor && <AssignmentPerformanceChart data={performanceChartData} />}

      <CourseCompanion firstName={firstName} isInstructor={isInstructor} />
    </div>
  );
}