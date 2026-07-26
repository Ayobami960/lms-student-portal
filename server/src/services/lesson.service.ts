import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { emailService } from "./email.service.js";
import { emailTemplates } from "../../emails/templates.js";
import { notificationService } from "./notification.service.js";

async function assertModuleOwnership(moduleId: string, requester: { id: string; role: string }) {
  const mod = await prisma.module.findUnique({ where: { id: moduleId }, include: { course: true } });
  if (!mod) throw ApiError.notFound("Module not found");
  if (requester.role !== "ADMIN" && mod.course.instructorId !== requester.id) {
    throw ApiError.forbidden("You do not own this course");
  }
  return mod;
}

export const lessonService = {
  async listByModule(moduleId: string) {
    return prisma.lesson.findMany({ where: { moduleId }, orderBy: { order: "asc" } });
  },

  async getById(id: string, studentId?: string) {
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: { module: { include: { course: true } }, assignments: true },
    });
    if (!lesson) throw ApiError.notFound("Lesson not found");

    let progress = null;
    if (studentId) {
      progress = await prisma.lessonProgress.findUnique({
        where: { studentId_lessonId: { studentId, lessonId: id } },
      });
    }
    return { ...lesson, progress };
  },

  async create(moduleId: string, requester: { id: string; role: string }, data: {
    title: string; description?: string; content?: string; videoUrl?: string; order?: number;
  }) {
    await assertModuleOwnership(moduleId, requester);
    const count = await prisma.lesson.count({ where: { moduleId } });
    return prisma.lesson.create({ data: { ...data, moduleId, order: data.order ?? count } });
  },

  // lesson.service.ts — add this method
  async update(id: string, requester: { id: string; role: string }, data: Partial<{
    title: string; description: string; content: string; videoUrl: string;
  }>) {
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: { module: { include: { course: true } } },
    });
    if (!lesson) throw new ApiError(404, "Lesson not found");
    if (requester.role !== "ADMIN" && lesson.module.course.instructorId !== requester.id) {
      throw new ApiError(403, "You can only update lessons in your own courses");
    }
    return prisma.lesson.update({ where: { id }, data });
  },

  async remove(id: string, requester: { id: string; role: string }) {
    const lesson = await prisma.lesson.findUnique({ where: { id }, include: { module: { include: { course: true } } } });
    if (!lesson) throw ApiError.notFound("Lesson not found");
    if (requester.role !== "ADMIN" && lesson.module.course.instructorId !== requester.id) {
      throw ApiError.forbidden("You do not own this course");
    }
    await prisma.lesson.delete({ where: { id } });
  },

 
  async completeLesson(lessonId: string, studentId: string) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: true },
    });
    if (!lesson) throw ApiError.notFound("Lesson not found");

    const courseId = lesson.module.courseId;

    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (!enrollment) throw ApiError.forbidden("You must be enrolled in this course to complete lessons");

    await prisma.lessonProgress.upsert({
      where: { studentId_lessonId: { studentId, lessonId } },
      update: { completed: true, completedAt: new Date() },
      create: { studentId, lessonId, completed: true, completedAt: new Date() },
    });

    const totalLessons = await prisma.lesson.count({ where: { module: { courseId } } });
    const completedLessons = await prisma.lessonProgress.count({
      where: { studentId, completed: true, lesson: { module: { courseId } } },
    });

    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    const isComplete = progress >= 100;

    const updated = await prisma.enrollment.update({
      where: { studentId_courseId: { studentId, courseId } },
      data: {
        progress,
        completed: isComplete,
        completedAt: isComplete ? enrollment.completedAt ?? new Date() : enrollment.completedAt,
      },
    });

    const justCompleted = isComplete && !enrollment.completed;
    if (justCompleted) {
      const [student, course] = await Promise.all([
        prisma.user.findUnique({ where: { id: studentId } }),
        prisma.course.findUnique({ where: { id: courseId }, include: { instructor: true } }),
      ]);

      if (student && course) {
        const studentEmail = emailTemplates.courseCompletionStudent(student.name, course.title);
        void emailService.send({ to: student.email, subject: studentEmail.subject, html: studentEmail.html });
        void notificationService.create(studentId, "COURSE_COMPLETED", "Course completed! 🎓", `You completed ${course.title}.`, `/courses/${courseId}`);

        const instructorEmail = emailTemplates.courseCompletionInstructor(course.instructor.name, student.name, course.title);
        void emailService.send({ to: course.instructor.email, subject: instructorEmail.subject, html: instructorEmail.html });
        void notificationService.create(course.instructorId, "COURSE_COMPLETED", "A student completed your course", `${student.name} completed ${course.title}.`, `/courses/${courseId}`);

        const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
        void notificationService.createMany(
          admins.map((a: any) => a.id),
          "COURSE_COMPLETED",
          "Course completion",
          `${student.name} completed ${course.title}.`
        );
      }
    }

    return { progress: updated.progress, completed: updated.completed, courseId };
  },
};