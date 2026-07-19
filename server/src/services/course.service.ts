import { PrismaClient } from "@prisma/client";

import { prisma } from "../config/db";
import { ApiError } from "../utils/ApiError";
import { slugify } from "../utils/slugify";
// import { Prisma } from "@prisma/client";

interface ListCoursesParams {
  search?: string;
  category?: string;
  level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  sort?: "newest" | "popular" | "rating" | "alphabetical";
  page: number;
  limit: number;
  publishedOnly: boolean;
  studentId?: string; // to attach enrollment/progress info
}

export const courseService = {
  async list(params: ListCoursesParams) {
    const { search, category, level, sort, page, limit, publishedOnly, studentId } = params;

    const where: Prisma.CourseWhereInput = {
      ...(publishedOnly ? { published: true } : {}),
      ...(category ? { category } : {}),
      ...(level ? { level } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
              { category: { contains: search, mode: "insensitive" } },
              { instructor: { name: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.CourseOrderByWithRelationInput =
      sort === "popular"
        ? { enrollments: { _count: "desc" } }
        : sort === "rating"
        ? { rating: "desc" }
        : sort === "alphabetical"
        ? { title: "asc" }
        : { createdAt: "desc" };

    const [items, total] = await Promise.all([
      prisma.course.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          instructor: { select: { id: true, name: true, avatar: true } },
          _count: { select: { enrollments: true, modules: true } },
          enrollments: studentId
            ? {
                where: { studentId },
                take: 1,
              }
            : undefined,
        },
      }),
      prisma.course.count({ where }),
    ]);

    const mappedItems = items.map((course: any) => ({
      ...course,
      enrollment: course.enrollments?.[0] ?? null,
    }));

    return { items: mappedItems, total };
  },

  async getById(id: string, studentId?: string) {
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        instructor: { select: { id: true, name: true, avatar: true } },
        modules: {
          orderBy: { order: "asc" },
          include: { lessons: { orderBy: { order: "asc" } } },
        },
        _count: { select: { enrollments: true } },
      },
    });
    if (!course) throw ApiError.notFound("Course not found");

    let enrollment = null;
    if (studentId) {
      enrollment = await prisma.enrollment.findUnique({
        where: { studentId_courseId: { studentId, courseId: id } },
      });
    }

    return { ...course, enrollment };
  },

  async create(instructorId: string, data: {
    title: string; description: string; category: string;
    level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"; duration: number; thumbnail?: string;
  }) {
    const baseSlug = slugify(data.title);
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.course.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    return prisma.course.create({
      data: { ...data, slug, instructorId, rating: 0 },
    });
  },

  async update(id: string, requester: { id: string; role: string }, data: Partial<{
    title: string; description: string; category: string; level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
    duration: number; thumbnail: string; published: boolean;
  }>) {
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) throw ApiError.notFound("Course not found");
    if (requester.role !== "ADMIN" && course.instructorId !== requester.id) {
      throw ApiError.forbidden("You can only update your own courses");
    }

    return prisma.course.update({ where: { id }, data });
  },

  async remove(id: string, requester: { id: string; role: string }) {
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) throw ApiError.notFound("Course not found");
    if (requester.role !== "ADMIN" && course.instructorId !== requester.id) {
      throw ApiError.forbidden("You can only delete your own courses");
    }
    await prisma.course.delete({ where: { id } });
  },

  async enroll(courseId: string, studentId: string) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw ApiError.notFound("Course not found");

    const existing = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (existing) throw ApiError.conflict("You are already enrolled in this course");

    return prisma.enrollment.create({ data: { studentId, courseId } });
  },
};
