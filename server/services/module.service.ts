import { prisma } from "../config/db";
import { ApiError } from "../utils/ApiError";

async function assertCourseOwnership(courseId: string, requester: { id: string; role: string }) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw ApiError.notFound("Course not found");
  if (requester.role !== "ADMIN" && course.instructorId !== requester.id) {
    throw ApiError.forbidden("You do not own this course");
  }
  return course;
}

export const moduleService = {
  async listByCourse(courseId: string) {
    return prisma.module.findMany({
      where: { courseId },
      orderBy: { order: "asc" },
      include: { lessons: { orderBy: { order: "asc" } } },
    });
  },

  async create(courseId: string, requester: { id: string; role: string }, data: { title: string; description?: string; order?: number }) {
    await assertCourseOwnership(courseId, requester);
    const count = await prisma.module.count({ where: { courseId } });
    return prisma.module.create({
      data: { ...data, courseId, order: data.order ?? count },
    });
  },

  async update(id: string, requester: { id: string; role: string }, data: Partial<{ title: string; description: string; order: number }>) {
    const mod = await prisma.module.findUnique({ where: { id }, include: { course: true } });
    if (!mod) throw ApiError.notFound("Module not found");
    if (requester.role !== "ADMIN" && mod.course.instructorId !== requester.id) {
      throw ApiError.forbidden("You do not own this course");
    }
    return prisma.module.update({ where: { id }, data });
  },

  async remove(id: string, requester: { id: string; role: string }) {
    const mod = await prisma.module.findUnique({ where: { id }, include: { course: true } });
    if (!mod) throw ApiError.notFound("Module not found");
    if (requester.role !== "ADMIN" && mod.course.instructorId !== requester.id) {
      throw ApiError.forbidden("You do not own this course");
    }
    await prisma.module.delete({ where: { id } });
  },
};
