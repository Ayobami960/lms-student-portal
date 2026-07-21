import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { emailService } from "./email.service.js";
import { emailTemplates } from "../../emails/templates.js";
import { notificationService } from "./notification.service.js";

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

    if (!submission) throw new ApiError(404, "Submission not found");
    if (instructor.role !== "ADMIN" && submission.assignment.lesson.module.course.instructorId !== instructor.id) {
      throw new ApiError(403, "You do not teach this course");
    }
    return submission;
  },

  async grade(id: string, instructor: { id: string; role: string }, score: number, feedback: string | undefined, approved: boolean) {
    const submission = await gradingService.getSubmission(id, instructor);

    if (score < 0 || score > submission.assignment.maxScore) {
      throw new ApiError(400, `Score must be between 0 and ${submission.assignment.maxScore}`);
    }

    const updated = await prisma.submission.update({
      where: { id },
      data: {
        score,
        feedback: feedback ?? null,
        approved,
        status: "GRADED",
        gradedAt: new Date(),
      },
    });

    const student = await prisma.user.findUnique({ where: { id: submission.studentId } });
    if (student) {
      if (approved) {
        const { subject, html } = emailTemplates.assignmentApproved(student.name, submission.assignment.title, score, submission.assignment.maxScore, feedback);
        void emailService.send({ to: student.email, subject, html });
        void notificationService.create(student.id, "ASSIGNMENT_APPROVED", "Assignment approved ✅", `${submission.assignment.title} was approved.`, "/assignments");
      } else {
        const { subject, html } = emailTemplates.assignmentRejected(student.name, submission.assignment.title, feedback ?? "Please review and resubmit.");
        void emailService.send({ to: student.email, subject, html });
        void notificationService.create(student.id, "ASSIGNMENT_REJECTED", "Revision requested", `${submission.assignment.title} needs revision.`, "/assignments");
      }
    }

    return updated;
  },
};