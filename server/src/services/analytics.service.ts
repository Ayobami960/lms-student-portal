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
      
    const pendingAssignments = submissions.filter((s: any) => s.status !== "GRADED").length +
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
        students: c._count.enrollments 
      })),
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

    return { 
      totalUsers, 
      totalCourses, 
      totalEnrollments, 
      totalCertificates, 
      usersByRole: usersByRole as unknown as GroupByRoleResult[]
    };
  },
};

// Fixed top-level input type parameter mapping context
async function countUnsubmittedAssignments(studentId: string) {
  const assignments = await prisma.assignment.findMany({
    where: { lesson: { module: { course: { enrollments: { some: { studentId } } } } } },
    include: { submissions: { where: { studentId } } },
  });
  
  return assignments.filter((a: any) => a.submissions.length === 0 && a.dueDate > new Date()).length;
}
