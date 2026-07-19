import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";

export const gradingService = {
  async listSubmissions(instructor: { id: string; role: string }, courseId?: string) {
    return prisma.submission.findMany({
      where: {
        assignment: {
          lesson: {
            module: {
              course: instructor.role === "ADMIN" ? (courseId ? { id: courseId } : {}) : { instructorId: instructor.id, ...(courseId ? { id: courseId } : {}) },
            },
          },
        },
      },
      include: {
        assignment: true,
        student: { select: { id: true, name: true, email: true, avatar: true } },
      },
      orderBy: { submittedAt: "desc" },
    });
  },

  async getSubmission(id: string, instructor: { id: string; role: string }) {
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        assignment: { include: { lesson: { include: { module: { include: { course: true } } } } } },
        student: { select: { id: true, name: true, email: true } },
      },
    });
    if (!submission) throw ApiError.notFound("Submission not found");
    if (instructor.role !== "ADMIN" && submission.assignment.lesson.module.course.instructorId !== instructor.id) {
      throw ApiError.forbidden("You do not teach this course");
    }
    return submission;
  },

  async grade(id: string, instructor: { id: string; role: string }, score: number, feedback?: string) {
    const submission = await gradingService.getSubmission(id, instructor);

    if (score < 0 || score > submission.assignment.maxScore) {
      throw ApiError.badRequest(`Score must be between 0 and ${submission.assignment.maxScore}`);
    }

    return prisma.submission.update({
      where: { id },
      data: { score, feedback, status: "GRADED", gradedAt: new Date() },
    });
  },
};
