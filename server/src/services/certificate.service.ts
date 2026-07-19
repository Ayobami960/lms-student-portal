import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { generateCertificateNumber } from "../utils/slugify.js";
import { generateCertificatePdf } from "./pdf.service.js";

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

    return prisma.certificate.update({ where: { id: certificate.id }, data: { certificateUrl: pdfPath } });
  },
};
