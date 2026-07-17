import { prisma } from "../config/db";

export const analyticsService = {
  async studentDashboard(studentId: string) {
    const [enrollments, certificates, submissions] = await Promise.all([
      prisma.enrollment.findMany({ where: { studentId }, include: { course: true } }),
      prisma.certificate.count({ where: { studentId } }),
      prisma.submission.findMany({ where: { studentId }, include: { assignment: true } }),
    ]);

    const totalCourses = enrollments.length;
    const completedCourses = enrollments.filter((e) => e.completed).length;
    const averageProgress = totalCourses > 0
      ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / totalCourses)
      : 0;
    const pendingAssignments = submissions.filter((s) => s.status !== "GRADED").length +
      await countUnsubmittedAssignments(studentId);

    const gradedSubmissions = submissions.filter((s) => s.score !== null);
    const averageScore = gradedSubmissions.length > 0
      ? Math.round(gradedSubmissions.reduce((sum, s) => sum + (s.score ?? 0), 0) / gradedSubmissions.length)
      : null;

    // Approximate learning hours from course durations weighted by progress
    const learningMinutes = enrollments.reduce((sum, e) => sum + (e.course.duration * e.progress) / 100, 0);

    return {
      totalCourses,
      completedCourses,
      averageProgress,
      certificatesEarned: certificates,
      pendingAssignments,
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
    return enrollments.map((e) => ({
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
    return submissions.map((s) => ({
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
    const courseIds = courses.map((c) => c.id);

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
      courses: courses.map((c) => ({ id: c.id, title: c.title, students: c._count.enrollments })),
    };
  },

  async platformDashboard() {
    const [totalUsers, totalCourses, totalEnrollments, totalCertificates, usersByRole] = await Promise.all([
      prisma.user.count(),
      prisma.course.count(),
      prisma.enrollment.count(),
      prisma.certificate.count(),
      prisma.user.groupBy({ by: ["role"], _count: true }),
    ]);

    return { totalUsers, totalCourses, totalEnrollments, totalCertificates, usersByRole };
  },
};

async function countUnsubmittedAssignments(studentId: string) {
  const assignments = await prisma.assignment.findMany({
    where: { lesson: { module: { course: { enrollments: { some: { studentId } } } } } },
    include: { submissions: { where: { studentId } } },
  });
  return assignments.filter((a) => a.submissions.length === 0 && a.dueDate > new Date()).length;
}
