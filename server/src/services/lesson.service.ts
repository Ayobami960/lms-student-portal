import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";

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

  async update(id: string, requester: { id: string; role: string }, data: Partial<{
    title: string; description: string; content: string; videoUrl: string; order: number;
  }>) {
    const lesson = await prisma.lesson.findUnique({ where: { id }, include: { module: { include: { course: true } } } });
    if (!lesson) throw ApiError.notFound("Lesson not found");
    if (requester.role !== "ADMIN" && lesson.module.course.instructorId !== requester.id) {
      throw ApiError.forbidden("You do not own this course");
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

  /**
   * Marks a lesson complete for a student, then recalculates course progress:
   * 1. Upsert LessonProgress
   * 2. Count completed lessons vs total lessons in the course
   * 3. Update Enrollment.progress (and completed flag / completedAt)
   */
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

    return { progress: updated.progress, completed: updated.completed, courseId };
  },
};
