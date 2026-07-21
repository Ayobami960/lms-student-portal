import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { generateCertificateNumber } from "../utils/slugify.js";
import { generateCertificatePdf } from "./pdf.service.js";
import { emailService } from "./email.service.js";
import { emailTemplates } from "../../emails/templates.js";
import { notificationService } from "./notification.service.js";

export const certificateService = {
  async listForUser(userId: string) {
    return prisma.certificate.findMany({ where: { studentId: userId }, orderBy: { issueDate: "desc" } });
  },

  async getById(id: string, user: { id: string; role: string }) {
    const cert = await prisma.certificate.findUnique({ where: { id } });
    if (!cert) throw ApiError.notFound("Certificate not found");
    if (cert.studentId !== user.id && user.role !== "ADMIN") throw ApiError.forbidden();
    return cert;
  },

  async generate(courseId: string, studentId: string) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (!enrollment || !enrollment.completed) {
      throw ApiError.badRequest("Course must be 100% complete before a certificate can be generated");
    }

    // All assignments in the course must have been submitted AND approved by
    // the instructor. If any are missing, still pending, or sent back for
    // revision, block the certificate and tell the student exactly why.
    const assignments = await prisma.assignment.findMany({
      where: { lesson: { module: { courseId } } },
      include: { submissions: { where: { studentId } } },
    });

    const blockers: string[] = [];
    for (const assignment of assignments) {
      const submission = assignment.submissions[0];
      if (!submission) {
        blockers.push(`"${assignment.title}" has not been submitted yet.`);
      } else if (submission.status !== "GRADED" || !submission.approved) {
        blockers.push(
          submission.feedback
            ? `"${assignment.title}" needs revision — instructor feedback: ${submission.feedback}`
            : `"${assignment.title}" is still awaiting instructor approval.`
        );
      }
    }

    if (blockers.length > 0) {
      throw ApiError.badRequest(
        `Your certificate isn't ready yet. ${blockers.join(" ")} Please resolve this before requesting your certificate.`
      );
    }

    const existing = await prisma.certificate.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (existing) return existing;

    const [student, course] = await Promise.all([
      prisma.user.findUnique({ where: { id: studentId } }),
      prisma.course.findUnique({ where: { id: courseId }, include: { instructor: true } }),
    ]);
    if (!student || !course) throw ApiError.notFound("Student or course not found");

    const certificateNumber = generateCertificateNumber();

    const certificate = await prisma.certificate.create({
      data: {
        certificateNumber,
        studentId,
        courseId,
        studentName: student.name,
        courseName: course.title,
      },
    });

    const pdfPath = await generateCertificatePdf({
      certificateNumber,
      studentName: student.name,
      courseName: course.title,
      instructorName: course.instructor.name,
      issueDate: certificate.issueDate,
    });

    const finalCertificate = await prisma.certificate.update({ where: { id: certificate.id }, data: { certificateUrl: pdfPath } });

    const { subject, html } = emailTemplates.certificateApproved(student.name, course.title);
    void emailService.send({ to: student.email, subject, html });
    void notificationService.create(studentId, "CERTIFICATE_APPROVED", "Certificate ready 🏆", `Your certificate for ${course.title} is ready.`, "/certificates");

    return finalCertificate;
  },
};