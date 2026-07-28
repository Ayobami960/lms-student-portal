import { useMemo } from "react";
import { Link } from "react-router";
import {
  Eye, CheckCircle2, HelpCircle, BookOpen, Award, Users, ClipboardList, Star, AlertTriangle, ArrowRight,
} from "lucide-react";
import {
  useGetDashboardAnalyticsQuery,
  useGetProgressAnalyticsQuery,
  useGetMonthlyHoursQuery,
  useGetLeaderboardQuery,
} from "../store/api/apiSlice";
import { Skeleton } from "../components/Skeleton";
import { ProgressBar } from "../components/ProgressBar";
import { EmptyState } from "../components/EmptyState";
import { AIWidget } from "../components/AIWidget";
import { StatsRow, type StatItem } from "../components/dashboard/StatsRow";
import { HoursSpentChart } from "../components/dashboard/HoursSpentChart";
import { PerformanceGauge } from "../components/dashboard/PerformanceGauge";
import { LeaderBoard, type LeaderboardEntry } from "../components/dashboard/LeaderBoard";
import { useAppSelector } from "../hooks/redux";
import { TopbarDashboard } from "../components/layout/TopbarDashboard";

export default function DashboardPage() {
  const user = useAppSelector((s) => s.auth.user);
  const isInstructor = user?.role === "INSTRUCTOR";

  const { data: statsRes, isLoading: statsLoading } = useGetDashboardAnalyticsQuery();
  const { data: progressRes, isLoading: progressLoading } = useGetProgressAnalyticsQuery(undefined, { skip: isInstructor });
  const { data: hoursRes } = useGetMonthlyHoursQuery(undefined, { skip: isInstructor });
  const { data: leaderboardRes } = useGetLeaderboardQuery(undefined, { skip: isInstructor });

  const stats = statsRes?.data;
  const progress = progressRes?.data;
  const hours = hoursRes?.data ?? [];
  const rawLeaderboard = leaderboardRes?.data ?? [];

  
  const statItems: StatItem[] = useMemo(() => {
    if (isInstructor) {
      return [
        { label: "Your Courses", value: stats?.totalCourses ?? 0, icon: BookOpen },
        { label: "Total Students", value: stats?.totalStudents ?? 0, icon: Users },
        { label: "To Grade", value: stats?.submissionsToGrade ?? 0, icon: ClipboardList },
        { label: "Avg. Rating", value: (stats?.averageRating ?? 0).toFixed(1), icon: Star },
      ];
    }
    return [
      { label: "Total Enrolled", value: stats?.totalCourses ?? 0, icon: Eye },
      { label: "Completed", value: stats?.completedCourses ?? 0, icon: CheckCircle2 },
      { label: "Avg. Score", value: `${stats?.averageScore ?? 0}%`, icon: HelpCircle },
      { label: "Certificates", value: stats?.certificatesEarned ?? 0, icon: Award },
    ];
  }, [isInstructor, stats]);

  // The real /leaderboard payload only has {id, rank, name, courses,
  // points} — no trend/avatar/hour, so those are simply omitted per
  // entry and the component renders sensible fallbacks for them.
  const leaderboard: LeaderboardEntry[] = useMemo(
    () =>
      rawLeaderboard.map((l: any) => ({
        rank: l.rank,
        name: l.name,
        course: l.courses,
        point: l.points,
      })),
    [rawLeaderboard]
  );

  const myRank = useMemo(() => rawLeaderboard.find((l: any) => l.id === user?.id)?.rank, [rawLeaderboard, user]);
  const myPoints = useMemo(() => rawLeaderboard.find((l: any) => l.id === user?.id)?.points ?? 0, [rawLeaderboard, user]);

  return (
    <div className="space-y-6">
      <TopbarDashboard/>
      {!isInstructor && !statsLoading && (stats?.needsRevision ?? 0) > 0 && (
        <Link
          to="/assignments"
          className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 transition hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-900/20 dark:text-amber-400"
        >
          <span className="flex items-center gap-2 font-medium">
            <AlertTriangle size={16} /> {stats?.needsRevision} assignment{stats?.needsRevision > 1 ? "s" : ""} need revision before you can claim a certificate
          </span>
          <span className="flex items-center gap-1">Fix now <ArrowRight size={14} /></span>
        </Link>
      )}

       {statsLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <StatsRow items={statItems} />
      )}
 
 
      {isInstructor ? (
        <div className="card p-6">
          <h3 className="mb-3 text-lg font-bold text-on-surface">Your Courses</h3>
          {!stats?.courses?.length ? (
            <EmptyState
              icon={BookOpen}
              title="No courses yet"
              description="Create your first course to get started."
              action={<Link to="/my-courses" className="btn-primary">Go to My Courses</Link>}
            />
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-outline-variant text-xs uppercase text-on-surface-variant">
                <tr><th className="px-2 py-2">Course</th><th className="px-2 py-2">Students</th></tr>
              </thead>
              <tbody>
                {stats.courses.map((c: any) => (
                  <tr key={c.id} className="border-b border-outline-variant/50 last:border-0">
                    <td className="px-2 py-2.5 font-medium">{c.title}</td>
                    <td className="px-2 py-2.5 text-on-surface-variant">{c.students}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <HoursSpentChart data={hours} />
            </div>
            <PerformanceGauge percent={stats?.averageScore ?? 0} points={myPoints} />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Continue Learning</h2>
              <Link to="/courses" className="text-sm text-secondary hover:underline">Browse all courses</Link>
            </div>
            {progressLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
              </div>
            ) : !progress?.length ? (
              <EmptyState
                icon={BookOpen}
                title="No courses yet"
                description="Enroll in a course to start tracking your progress here."
                action={<Link to="/courses" className="btn-primary">Browse courses</Link>}
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {progress.slice(0, 3).map((p: any) => (
                  <Link key={p.courseId} to={`/courses/${p.courseId}`} className="card p-4 transition hover:shadow-card">
                    <h3 className="mb-2 truncate text-sm font-medium">{p.courseTitle}</h3>
                    <ProgressBar value={p.progress} />
                    <p className="mt-2 text-xs text-on-surface-variant">
                      {p.progress}% complete{p.completed ? " — Done!" : ""}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <LeaderBoard entries={leaderboard} currentUserRank={myRank} />
        </>
      )}

      <div className="h-[380px]">
        <AIWidget />
      </div>
    </div>
  );
}