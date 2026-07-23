import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";

export const assignmentService = {
  async listForUser(user: { id: string; role: string }, courseId?: string) {
    if (user.role === "STUDENT") {
      return prisma.assignment.findMany({
        where: {
          lesson: courseId
            ? { module: { courseId } }
            : { module: { course: { enrollments: { some: { studentId: user.id } } } } },
        },
        include: {
          lesson: { include: { module: { include: { course: true } } } },
          submissions: { where: { studentId: user.id } },
        },
        orderBy: { dueDate: "asc" },
      });
    }
    // instructor/admin: assignments belonging to their courses (or all for admin)
    return prisma.assignment.findMany({
      where: {
        lesson: {
          module: {
            course:
              user.role === "ADMIN"
                ? courseId
                  ? { id: courseId }
                  : {}
                : { instructorId: user.id, ...(courseId ? { id: courseId } : {}) },
          },
        },
      },
      include: { lesson: { include: { module: { include: { course: true } } } }, submissions: true },
      orderBy: { dueDate: "asc" },
    });
  },

  async getById(id: string) {
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: { lesson: { include: { module: { include: { course: true } } } } },
    });
    if (!assignment) throw new ApiError(404, "Assignment not found");
    return assignment;
  },

  async create(
    lessonId: string,
    requester: { id: string; role: string },
    data: {
      title: string;
      description: string;
      instructions?: string;
      dueDate: string;
      maxScore: number;
    }
  ) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { course: true } } },
    });
    if (!lesson) throw new ApiError(404, "Lesson not found");
    if (requester.role !== "ADMIN" && lesson.module.course.instructorId !== requester.id) {
      throw new ApiError(403, "You do not own this course");
    }
    return prisma.assignment.create({
      data: { ...data, dueDate: new Date(data.dueDate), lessonId },
    });
  },

  async update(
    id: string,
    requester: { id: string; role: string },
    data: Partial<{
      title: string;
      description: string;
      instructions: string;
      dueDate: string;
      maxScore: number;
    }>
  ) {
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: { lesson: { include: { module: { include: { course: true } } } } },
    });
    if (!assignment) throw new ApiError(404, "Assignment not found");
    if (requester.role !== "ADMIN" && assignment.lesson.module.course.instructorId !== requester.id) {
      throw new ApiError(403, "You do not own this course");
    }
    return prisma.assignment.update({
      where: { id },
      data: { ...data, ...(data.dueDate ? { dueDate: new Date(data.dueDate) } : {}) },
    });
  },

  async remove(id: string, requester: { id: string; role: string }) {
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: { lesson: { include: { module: { include: { course: true } } } } },
    });
    if (!assignment) throw new ApiError(404, "Assignment not found");
    if (requester.role !== "ADMIN" && assignment.lesson.module.course.instructorId !== requester.id) {
      throw new ApiError(403, "You do not own this course");
    }
    await prisma.assignment.delete({ where: { id } });
  },
};