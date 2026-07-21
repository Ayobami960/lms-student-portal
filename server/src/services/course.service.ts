import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { slugify } from "../utils/slugify.js";
import { emailService } from "./email.service.js";
import { emailTemplates } from "../../emails/templates.js";
import { notificationService } from "./notification.service.js";

interface ListCoursesParams {
  search?: string;
  category?: string;
  level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  sort?: "newest" | "popular" | "rating" | "alphabetical";
  page: number;
  limit: number;
  publishedOnly: boolean;
  studentId?: string;
  instructorId?: string;
}

export const courseService = {
  async list(params: ListCoursesParams) {
    const { search, category, level, sort, page, limit, publishedOnly, studentId, instructorId } = params;

    const where: Prisma.CourseWhereInput = {
      ...(publishedOnly ? { published: true } : {}),
      ...(category ? { category } : {}),
      ...(level ? { level } : {}),
      ...(instructorId ? { instructorId } : {}),
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


    const includeConfig: any = {
      instructor: { select: { id: true, name: true, avatar: true } },
      _count: { select: { enrollments: true, modules: true } },
    };

    // Only inject enrollments filter if studentId is actually defined, rather than passing explicit undefined
    if (studentId) {
      includeConfig.enrollments = {
        where: { studentId },
        take: 1,
      };
    }

    const [items, total] = await Promise.all([
      prisma.course.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: includeConfig,
      }),
      prisma.course.count({ where }),
    ]);

    const mappedItems = items.map((course: any) => ({
      ...course,
      enrollment: course.enrollments?.[0] ?? null,
    }));

    return { items: mappedItems, total };
  },

  async getById(id: string, requester?: { id: string; role: string }) {
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

    if (!course) throw new ApiError(404, "Course not found");

    const isOwner = requester?.role === "ADMIN" || (!!requester && course.instructorId === requester.id);
    if (!course.published && !isOwner) {
      throw new ApiError(404, "Course not found");
    }

    let enrollment = null;
    if (requester?.role === "STUDENT") {
      enrollment = await prisma.enrollment.findUnique({
        where: { studentId_courseId: { studentId: requester.id, courseId: id } },
      });
    }

    return { ...course, enrollment };
  },

  async create(instructorId: string, data: {
    title: string; description: string; category: string;
    level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"; duration: number;
    thumbnail?: string; published?: boolean; // NEW
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
    const course = await prisma.course.findUnique({ where: { id }, include: { instructor: true } });

    if (!course) throw new ApiError(404, "Course not found");
    if (requester.role !== "ADMIN" && course.instructorId !== requester.id) {
      throw new ApiError(403, "You can only update your own courses");
    }

    const updated = await prisma.course.update({ where: { id }, data });

    if (data.published === true && !course.published) {
      const enrollments = await prisma.enrollment.findMany({ where: { courseId: id }, include: { student: true } });
      for (const e of enrollments) {
        const { subject, html } = emailTemplates.newCoursePublished(e.student.name, updated.title, course.instructor.name, updated.id);
        void emailService.send({ to: e.student.email, subject, html });
      }
      void notificationService.createMany(
        enrollments.map((e: any) => e.studentId),
        "COURSE_PUBLISHED",
        `${updated.title} is now live`,
        `A course you're enrolled in has just been published by ${course.instructor.name}.`,
        `/courses/${updated.id}`
      );
    }

    return updated;
  },

  async remove(id: string, requester: { id: string; role: string }) {
    const course = await prisma.course.findUnique({ where: { id } });

    if (!course) throw new ApiError(404, "Course not found");
    if (requester.role !== "ADMIN" && course.instructorId !== requester.id) {
      throw new ApiError(403, "You can only delete your own courses");
    }
    await prisma.course.delete({ where: { id } });
  },

  async enroll(courseId: string, studentId: string) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new ApiError(404, "Course not found");
    if (!course.published) throw new ApiError(404, "Course not found");

    const existing = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (existing) throw new ApiError(409, "You are already enrolled in this course");

    const enrollment = await prisma.enrollment.create({ data: { studentId, courseId } });

    const student = await prisma.user.findUnique({ where: { id: studentId } });
    if (student) {
      const { subject, html } = emailTemplates.enrollmentConfirmation(student.name, course.title, course.id);
      void emailService.send({ to: student.email, subject, html });
      void notificationService.create(studentId, "ENROLLMENT", "Enrollment confirmed", `You're enrolled in ${course.title}.`, `/courses/${course.id}`);
    }

    return enrollment;
  },
};