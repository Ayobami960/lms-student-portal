import { prisma } from "../config/db";
import { ApiError } from "../utils/ApiError";
import { storage } from "../config/storage";

export const submissionService = {
  async submit(assignmentId: string, studentId: string, file: Express.Multer.File | undefined, comment?: string) {
    const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) throw ApiError.notFound("Assignment not found");
    if (!file) throw ApiError.badRequest("A file upload is required");

    const isLate = new Date() > assignment.dueDate;
    const fileUrl = storage.getFileUrl(file.filename);

    // Allow replacing a submission before the deadline (or any time, admin discretion) via upsert
    return prisma.submission.upsert({
      where: { assignmentId_studentId: { assignmentId, studentId } },
      update: {
        fileUrl,
        fileName: file.originalname,
        comment,
        status: isLate ? "LATE" : "SUBMITTED",
        submittedAt: new Date(),
        score: null,
        feedback: null,
        gradedAt: null,
      },
      create: {
        assignmentId,
        studentId,
        fileUrl,
        fileName: file.originalname,
        comment,
        status: isLate ? "LATE" : "SUBMITTED",
      },
    });
  },

  async listForUser(user: { id: string; role: string }, assignmentId?: string) {
    if (user.role === "STUDENT") {
      return prisma.submission.findMany({
        where: { studentId: user.id, ...(assignmentId ? { assignmentId } : {}) },
        include: { assignment: true },
        orderBy: { submittedAt: "desc" },
      });
    }
    return prisma.submission.findMany({
      where: {
        ...(assignmentId ? { assignmentId } : {}),
        assignment: { lesson: { module: { course: user.role === "ADMIN" ? {} : { instructorId: user.id } } } },
      },
      include: { assignment: true, student: { select: { id: true, name: true, email: true, avatar: true } } },
      orderBy: { submittedAt: "desc" },
    });
  },

  async getById(id: string, user: { id: string; role: string }) {
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: { assignment: { include: { lesson: { include: { module: { include: { course: true } } } } } }, student: { select: { id: true, name: true, email: true } } },
    });
    if (!submission) throw ApiError.notFound("Submission not found");
    const isOwner = submission.studentId === user.id;
    const isCourseInstructor = submission.assignment.lesson.module.course.instructorId === user.id;
    if (!isOwner && !isCourseInstructor && user.role !== "ADMIN") {
      throw ApiError.forbidden("You cannot view this submission");
    }
    return submission;
  },
};
