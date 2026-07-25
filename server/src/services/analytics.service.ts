import { prisma } from "../config/db.js";

// Explicit structural interfaces matching your Prisma model schemas
interface CourseWithCount {
  id: string;
  title: string;
  _count: {
    enrollments: number;
  };
}

interface GroupByRoleResult {
  role: string;
  _count: number;
}

export const analyticsService = {
  async studentDashboard(studentId: string) {
    const [enrollments, certificates, submissions] = await Promise.all([
      prisma.enrollment.findMany({ where: { studentId }, include: { course: true } }),
      prisma.certificate.count({ where: { studentId } }),
      prisma.submission.findMany({ where: { studentId }, include: { assignment: true } }),
    ]);

    const totalCourses = enrollments.length;

    // Explicitly typed 'e' to satisfy strict implicitAny rules
    const completedCourses = enrollments.filter((e: any) => e.completed).length;

    // Explicitly typed both the running accumulator 'sum' and current item 'e'
    const averageProgress = totalCourses > 0
      ? Math.round(enrollments.reduce((sum: number, e: any) => sum + e.progress, 0) / totalCourses)
      : 0;

    // Restored from old code: submissions that were graded but not yet approved
    const needsRevision = submissions.filter((s: any) => s.status === "GRADED" && !s.approved).length;

    const pendingAssignments = submissions.filter((s: any) => s.status !== "GRADED").length +
      needsRevision +
      await countUnsubmittedAssignments(studentId);

    const gradedSubmissions = submissions.filter((s: any) => s.score !== null);
    const averageScore = gradedSubmissions.length > 0
      ? Math.round(gradedSubmissions.reduce((sum: number, s: any) => sum + (s.score ?? 0), 0) / gradedSubmissions.length)
      : null;

    // Approximate learning hours from course durations weighted by progress
    const learningMinutes = enrollments.reduce((sum: number, e: any) => sum + (e.course.duration * e.progress) / 100, 0);

    return {
      totalCourses,
      completedCourses,
      averageProgress,
      certificatesEarned: certificates,
      pendingAssignments,
      needsRevision,
      learningHours: Math.round(learningMinutes / 60),
      averageScore,
    };
  },

  async studentProgress(studentId: string) {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
      include: { course: { select: { id: true, title: true, thumbnail: true } } },
      orderBy: { enrolledAt: "desc" },
    });

    return enrollments.map((e: any) => ({
      courseId: e.courseId,
      courseTitle: e.course.title,
      thumbnail: e.course.thumbnail,
      progress: e.progress,
      completed: e.completed,
    }));
  },

  async studentPerformance(studentId: string) {
    const submissions = await prisma.submission.findMany({
      where: { studentId, score: { not: null } },
      include: { assignment: { select: { title: true, maxScore: true } } },
      orderBy: { gradedAt: "desc" },
    });

    return submissions.map((s: any) => ({
      assignment: s.assignment.title,
      score: s.score,
      maxScore: s.assignment.maxScore,
      percentage: s.score !== null ? Math.round((s.score / s.assignment.maxScore) * 100) : null,
    }));
  },

  async instructorDashboard(instructorId: string) {
    const courses = await prisma.course.findMany({
      where: { instructorId },
      include: { _count: { select: { enrollments: true } } },
    });

    // Explicitly typed map iterator argument
    const courseIds = courses.map((c: any) => c.id);

    const [totalStudents, submissionsToGrade, avgRating] = await Promise.all([
      prisma.enrollment.count({ where: { courseId: { in: courseIds } } }),
      prisma.submission.count({
        where: { status: { in: ["SUBMITTED", "LATE"] }, assignment: { lesson: { module: { courseId: { in: courseIds } } } } },
      }),
      prisma.course.aggregate({ where: { instructorId }, _avg: { rating: true } }),
    ]);

    return {
      totalCourses: courses.length,
      totalStudents,
      submissionsToGrade,
      averageRating: avgRating._avg.rating ?? 0,
      // Map return layout matching explicit structure definitions
      courses: (courses as unknown as CourseWithCount[]).map((c) => ({
        id: c.id,
        title: c.title,
        students: c._count.enrollments,
      })),
    };
  },

  async platformDashboard() {
    const [totalUsers, totalCourses, totalEnrollments, totalCertificates, usersByRole, pendingInstructors] =
      await Promise.all([
        prisma.user.count(),
        prisma.course.count(),
        prisma.enrollment.count(),
        prisma.certificate.count(),
        prisma.user.groupBy({ by: ["role"], _count: true }),
        prisma.user.count({ where: { role: "INSTRUCTOR", isApproved: false } })
      ]);

    return {
      totalUsers,
      totalCourses,
      totalEnrollments,
      totalCertificates,
      usersByRole: usersByRole as unknown as GroupByRoleResult[],
      pendingInstructors,
    };
  },


  async getPlatformCharts() {
    const [courses, usersByRole, enrollmentsRaw] = await Promise.all([
      prisma.course.findMany({
        select: { id: true, title: true, _count: { select: { enrollments: true } } },
        orderBy: { enrollments: { _count: "desc" } },
        take: 10,
      }),
      prisma.user.groupBy({ by: ["role"], _count: true }),
      prisma.enrollment.findMany({ select: { enrolledAt: true } }),
    ]);

    
    const instructorCourses = await prisma.course.findMany({
      select: { instructorId: true, instructor: { select: { name: true } }, _count: { select: { enrollments: true } } },
    });
    const byInstructor = new Map<string, { name: string; count: number }>();
    for (const c of instructorCourses) {
      const entry = byInstructor.get(c.instructorId) ?? { name: c.instructor.name, count: 0 };
      entry.count += c._count.enrollments;
      byInstructor.set(c.instructorId, entry);
    }

    // Monthly enrollment trend for the last 6 months.
    const now = new Date();
    const months: { label: string; year: number; month: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ label: d.toLocaleString("default", { month: "short" }), year: d.getFullYear(), month: d.getMonth() });
    }
    const monthlyEnrollments = months.map(({ label, year, month }) => ({
      month: label,
      count: enrollmentsRaw.filter((e) => e.enrolledAt.getFullYear() === year && e.enrolledAt.getMonth() === month).length,
    }));

    return {
      enrollmentsByInstructor: Array.from(byInstructor.values()).map((v) => ({ instructor: v.name, students: v.count })),
      enrollmentsByCourse: courses.map((c) => ({ course: c.title, students: c._count.enrollments })),
      usersByRole: usersByRole.map((r) => ({ role: r.role, count: r._count })),
      monthlyEnrollments,
    };
  },
};


async function countUnsubmittedAssignments(studentId: string) {
  const assignments = await prisma.assignment.findMany({
    where: { lesson: { module: { course: { enrollments: { some: { studentId } } } } } },
    include: { submissions: { where: { studentId } } },
  });

  return assignments.filter((a: any) => a.submissions.length === 0 && a.dueDate > new Date()).length;
}