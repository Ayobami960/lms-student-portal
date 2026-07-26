import { emailTemplates } from "../../emails/templates.js";
import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { emailService } from "./email.service.js";
import { notificationService } from "./notification.service.js";
import { auditLogService } from "./audit-log.service.js";
import { generateStudentId } from "../utils/studentId.js";

type Actor = { id: string; name: string; role: string };

export const userService = {
  async getById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, role: true, avatar: true,
        isVerified: true, isApproved: true, isActive: true, studentId: true,
        createdAt: true, updatedAt: true,
      },
    });
    if (!user) throw ApiError.notFound("User not found");
    return user;
  },

  async updateProfile(id: string, data: { name?: string; avatar?: string }) {
    return prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, avatar: true },
    });
  },

  async setAvatar(id: string, avatarUrl: string) {
    return prisma.user.update({ where: { id }, data: { avatar: avatarUrl }, select: { id: true, avatar: true } });
  },

  async listAll(page: number, limit: number, role?: string, pendingOnly?: boolean, search?: string) {
    const where: any = {
      ...(role ? { role: role as any } : {}),
      ...(pendingOnly ? { isApproved: false } : {}),
      ...(search
        ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }] }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, email: true, role: true, isVerified: true, isApproved: true, isActive: true, studentId: true, createdAt: true },
      }),
      prisma.user.count({ where }),
    ]);
    return { items, total };
  },

 
  
  async getActivity(id: string) {
    const user = await this.getById(id);
    const [enrollments, submissions, certificates, coursesTaught] = await Promise.all([
      prisma.enrollment.findMany({
        where: { studentId: id },
        include: { course: { select: { id: true, title: true } } },
        orderBy: { enrolledAt: "desc" },
        take: 50,
      }),
      prisma.submission.findMany({
        where: { studentId: id },
        include: { assignment: { select: { title: true, maxScore: true } } },
        orderBy: { submittedAt: "desc" },
        take: 20,
      }),
      prisma.certificate.findMany({
        where: { studentId: id },
        select: { id: true, courseName: true, issueDate: true },
      }),
      user.role === "INSTRUCTOR"
        ? prisma.course.findMany({
            where: { instructorId: id },
            select: { id: true, title: true, published: true, createdAt: true, _count: { select: { enrollments: true } } },
          })
        : Promise.resolve([]),
    ]);

    const summary = {
      totalCourses: enrollments.length,
      completedCourses: enrollments.filter((e) => e.completed).length,
      averageProgress: enrollments.length
        ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length)
        : 0,
      certificatesEarned: certificates.length,
    };

    return { user, summary, enrollments, submissions, certificates, coursesTaught };
  },

  async approveInstructor(id: string, actor: Actor) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw ApiError.notFound("User not found");
    if (user.role !== "INSTRUCTOR") throw ApiError.badRequest("Only instructor accounts require approval");

    const updated = await prisma.user.update({
      where: { id },
      data: { isApproved: true },
      select: { id: true, name: true, email: true, isApproved: true },
    });

    const { subject, html } = emailTemplates.instructorApproved(updated.name);
    void emailService.send({ to: updated.email, subject, html });
    void notificationService.create(id, "INSTRUCTOR_APPROVED", "Account approved", "Your instructor account has been approved by an admin.", "/dashboard");
    void auditLogService.log(actor, "INSTRUCTOR_APPROVED", `Approved instructor ${updated.name}`, "User", id);

    return updated;
  },

  async activateUser(id: string, actor: Actor) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw ApiError.notFound("User not found");
    if (user.isActive) throw ApiError.badRequest("Account is already active");

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: true },
      select: { id: true, name: true, email: true, isActive: true },
    });

    const { subject, html } = emailTemplates.accountActivated(updated.name);
    void emailService.send({ to: updated.email, subject, html });
    void notificationService.create(id, "ACCOUNT_ACTIVATED", "Account reactivated", "Your account has been reactivated.");
    void auditLogService.log(actor, "USER_ACTIVATED", `Activated ${updated.name}'s account`, "User", id);

    return updated;
  },

  async deactivateUser(id: string, actor: Actor, reason?: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw ApiError.notFound("User not found");
    if (user.role === "ADMIN") throw ApiError.badRequest("Admin accounts can't be deactivated");
    if (id === actor.id) throw ApiError.badRequest("You cannot deactivate your own account");
    if (!user.isActive) throw ApiError.badRequest("Account is already deactivated");

    const [updated] = await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: { isActive: false },
        select: { id: true, name: true, email: true, isActive: true },
      }),
      // Deactivating must kill existing sessions immediately, not wait for token expiry.
      prisma.refreshToken.updateMany({ where: { userId: id }, data: { revoked: true } }),
    ]);

    const { subject, html } = emailTemplates.accountDeactivated(updated.name, reason);
    void emailService.send({ to: updated.email, subject, html });
    void notificationService.create(
      id,
      "ACCOUNT_DEACTIVATED",
      "Account deactivated",
      reason || "Your account has been deactivated by an administrator."
    );
    void auditLogService.log(actor, "USER_DEACTIVATED", `Deactivated ${updated.name}'s account${reason ? ` (${reason})` : ""}`, "User", id);

    return updated;
  },

  async updateRole(id: string, role: "STUDENT" | "INSTRUCTOR" | "ADMIN", actor: Actor) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw ApiError.notFound("User not found");
    if (id === actor.id) throw ApiError.badRequest("You cannot change your own role");

    const [updated] = await prisma.$transaction([
      prisma.user.update({ where: { id }, data: { role }, select: { id: true, name: true, role: true } }),
      // Force logout everywhere — old tokens carry the stale role claim
      prisma.refreshToken.updateMany({ where: { userId: id }, data: { revoked: true } }),
    ]);

    void auditLogService.log(actor, "USER_ROLE_CHANGED", `Changed ${user.name}'s role from ${user.role} to ${role}`, "User", id);

    return updated;
  },

  // Admin-assigned: students register with studentId = null; an admin gives
  // them one from here — either auto-generated (STD-2026-000001 style) or a
  // custom value. Required before a student can join a live classroom.
  async assignStudentId(id: string, actor: Actor, customId?: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw ApiError.notFound("User not found");
    if (user.role !== "STUDENT") throw ApiError.badRequest("Only student accounts can have a Student ID");
    if (user.studentId) throw ApiError.conflict(`This student already has an ID (${user.studentId})`);

    let studentId = customId?.trim();
    if (studentId) {
      const taken = await prisma.user.findUnique({ where: { studentId } });
      if (taken) throw ApiError.conflict("That Student ID is already in use");
    } else {
      // Retry a few times in the rare case of a collision on the generated sequence.
      let attempts = 0;
      while (true) {
        const candidate = await generateStudentId();
        const taken = await prisma.user.findUnique({ where: { studentId: candidate } });
        if (!taken) { studentId = candidate; break; }
        attempts++;
        if (attempts >= 5) throw ApiError.internal("Could not generate a unique Student ID, try again");
      }
    }

    const updated = await prisma.user.update({ where: { id }, data: { studentId }, select: { id: true, name: true, email: true, studentId: true } });

    void notificationService.create(id, "GENERAL", "Your Student ID is ready", `Your Student ID is ${studentId}. You'll need it to join live classes.`, "/dashboard");
    void auditLogService.log(actor, "STUDENT_ID_ASSIGNED", `Assigned Student ID ${studentId} to ${updated.name}`, "User", id);

    return updated;
  },

  async deleteUser(id: string, actor: Actor) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw ApiError.notFound("User not found");
    if (user.role === "ADMIN") throw ApiError.badRequest("Admin accounts can't be deleted");
    if (id === actor.id) throw ApiError.badRequest("You cannot delete your own account");

    await prisma.user.delete({ where: { id } });
    void auditLogService.log(actor, "USER_DELETED", `Deleted user ${user.name} (${user.email})`, "User", id);
  },
};