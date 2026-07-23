import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { notificationService } from "./notification.service.js";
import { emailService } from "./email.service.js";
import { emailTemplates } from "../../emails/templates.js";


export const liveClassService = {
  async create(courseId: string, instructor: { id: string; role: string }, data: { title: string; description?: string; scheduledAt: string }) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw ApiError.notFound("Course not found");
    if (instructor.role !== "ADMIN" && course.instructorId !== instructor.id) {
      throw ApiError.forbidden("You do not teach this course");
    }

    const liveClass = await prisma.liveClass.create({
      data: { courseId, instructorId: course.instructorId, title: data.title, description: data.description, scheduledAt: new Date(data.scheduledAt) },
    });

    // Notify every enrolled student a class was scheduled.
    const enrollments = await prisma.enrollment.findMany({ where: { courseId }, include: { student: true } });
    for (const e of enrollments) {
      void notificationService.create(e.studentId, "CLASS_STARTING", `New class scheduled: ${data.title}`, `${course.title} — ${new Date(data.scheduledAt).toLocaleString()}`, `/courses/${courseId}`);
    }

    return liveClass;
  },

  async listForCourse(courseId: string) {
    return prisma.liveClass.findMany({ where: { courseId }, orderBy: { scheduledAt: "desc" } });
  },

  async start(id: string, instructor: { id: string; role: string }) {
    const liveClass = await this.assertOwnership(id, instructor);
    const updated = await prisma.liveClass.update({ where: { id }, data: { status: "LIVE", startedAt: new Date() } });

    const enrollments = await prisma.enrollment.findMany({ where: { courseId: liveClass.courseId }, include: { student: true } });
    for (const e of enrollments) {
      void notificationService.create(e.studentId, "CLASS_STARTING", `${liveClass.title} is live now`, "Your class has started — join now.", `/courses/${liveClass.courseId}`);
      const { subject, html } = emailTemplates.classStarting(e.student.name, liveClass.title);
      void emailService.send({ to: e.student.email, subject, html });
    }

    return updated;
  },

  async end(id: string, instructor: { id: string; role: string }) {
    await this.assertOwnership(id, instructor);
    // Close out anyone who never explicitly left.
    await prisma.classAttendance.updateMany({
      where: { liveClassId: id, leftAt: null },
      data: { leftAt: new Date() },
    });
    return prisma.liveClass.update({ where: { id }, data: { status: "ENDED", endedAt: new Date() } });
  },

  async assertOwnership(id: string, instructor: { id: string; role: string }) {
    const liveClass = await prisma.liveClass.findUnique({ where: { id } });
    if (!liveClass) throw ApiError.notFound("Class not found");
    if (instructor.role !== "ADMIN" && liveClass.instructorId !== instructor.id) {
      throw ApiError.forbidden("You do not own this class");
    }
    return liveClass;
  },

  
  async join(id: string, user: { id: string; role: string }, suppliedStudentId?: string) {
    const liveClass = await prisma.liveClass.findUnique({ where: { id } });
    if (!liveClass) throw ApiError.notFound("Class not found");

    if (user.role === "INSTRUCTOR" || user.role === "ADMIN") {
      return { liveClass, verified: true };
    }

    const student = await prisma.user.findUnique({ where: { id: user.id } });
    if (!student?.studentId) throw ApiError.forbidden("No Student ID is associated with your account");
    if (!suppliedStudentId || suppliedStudentId.trim().toUpperCase() !== student.studentId.toUpperCase()) {
      throw ApiError.forbidden("The Student ID you entered doesn't match your account");
    }

    const enrolled = await prisma.enrollment.findUnique({ where: { studentId_courseId: { studentId: user.id, courseId: liveClass.courseId } } });
    if (!enrolled) throw ApiError.forbidden("You are not enrolled in this course");

    // Record attendance — upsert so rejoining doesn't create duplicate rows.
    const existing = await prisma.classAttendance.findFirst({ where: { liveClassId: id, studentId: user.id, leftAt: null } });
    if (!existing) {
      await prisma.classAttendance.create({
        data: { liveClassId: id, studentId: user.id, studentName: student.name, studentCode: student.studentId },
      });
    }

    return { liveClass, verified: true };
  },

  async leave(id: string, studentId: string) {
    const record = await prisma.classAttendance.findFirst({ where: { liveClassId: id, studentId, leftAt: null }, orderBy: { joinedAt: "desc" } });
    if (!record) return null;
    const leftAt = new Date();
    const durationSecs = Math.round((leftAt.getTime() - record.joinedAt.getTime()) / 1000);
    return prisma.classAttendance.update({ where: { id: record.id }, data: { leftAt, durationSecs } });
  },

  async getAttendance(id: string, instructor: { id: string; role: string }) {
    await this.assertOwnership(id, instructor);
    return prisma.classAttendance.findMany({ where: { liveClassId: id }, orderBy: { joinedAt: "asc" } });
  },

  async listChat(id: string) {
    return prisma.classChatMessage.findMany({ where: { liveClassId: id }, orderBy: { createdAt: "asc" }, take: 200 });
  },

  async sendChat(id: string, senderId: string, content: string) {
    const sender = await prisma.user.findUnique({ where: { id: senderId }, select: { name: true } });
    return prisma.classChatMessage.create({ data: { liveClassId: id, senderId, senderName: sender?.name ?? "Unknown", content } });
  },
};
