import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { storage } from "../config/storage.js";

export const submissionService = {
  async submit(assignmentId: string, studentId: string, file: Express.Multer.File | undefined, comment?: string) {
    const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
    
    // FIXED: Instantiated ApiError using 'new' keywords
    if (!assignment) throw new ApiError(404, "Assignment not found");
    if (!file) throw new ApiError(400, "A file upload is required");
    const isLate = new Date() > assignment.dueDate;
    const fileUrl = storage.getFileUrl(file.filename);

    return prisma.submission.upsert({
      where: { assignmentId_studentId: { assignmentId, studentId } },
      update: {
        fileUrl,
        fileName: file.originalname,
        // FIXED: Coerced undefined to null to comply with exactOptionalPropertyTypes
        comment: comment ?? null,
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
        // FIXED: Coerced undefined to null to comply with exactOptionalPropertyTypes
        comment: comment ?? null,
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
      include: { 
        assignment: { include: { lesson: { include: { module: { include: { course: true } } } } } }, 
        student: { select: { id: true, name: true, email: true } } 
      },
    });
    
    // FIXED: Instantiated ApiError using 'new' keywords
    if (!submission) throw new ApiError(404, "Submission not found");
    
    const isOwner = submission.studentId === user.id;
    const isCourseInstructor = submission.assignment.lesson.module.course.instructorId === user.id;
    
    if (!isOwner && !isCourseInstructor && user.role !== "ADMIN") {
      throw new ApiError(403, "You cannot view this submission");
    }
    return submission;
  },
};
