import { emailTemplates } from "../../emails/templates.js";
import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { emailService } from "./email.service.js";
import { notificationService } from "./notification.service.js";

type Actor = { id: string; name: string; role: string };

export const userService = {
  async getById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, role: true, avatar: true,
        isVerified: true, isApproved: true, isActive: true,
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
        select: { id: true, name: true, email: true, role: true, isVerified: true, isApproved: true, isActive: true, createdAt: true },
      }),
      prisma.user.count({ where }),
    ]);
    return { items, total };
  },

  // Full activity snapshot for the admin "view user activity" screen: recent
  // enrollments, submissions, and (for instructors) courses taught.
  async getActivity(id: string) {
    const user = await this.getById(id);
    const [enrollments, submissions, coursesTaught] = await Promise.all([
      prisma.enrollment.findMany({
        where: { studentId: id },
        include: { course: { select: { title: true } } },
        orderBy: { enrolledAt: "desc" },
        take: 10,
      }),
      prisma.submission.findMany({
        where: { studentId: id },
        include: { assignment: { select: { title: true } } },
        orderBy: { submittedAt: "desc" },
        take: 10,
      }),
      user.role === "INSTRUCTOR"
        ? prisma.course.findMany({
            where: { instructorId: id },
            select: { id: true, title: true, published: true, createdAt: true },
          })
        : Promise.resolve([]),
    ]);
    return { user, enrollments, submissions, coursesTaught };
  },

  async approveInstructor(id: string, _actor: Actor) {
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

    return updated;
  },

  async deleteUser(id: string, actor: Actor) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw ApiError.notFound("User not found");
    if (user.role === "ADMIN") throw ApiError.badRequest("Admin accounts can't be deleted");
    if (id === actor.id) throw ApiError.badRequest("You cannot delete your own account");

    await prisma.user.delete({ where: { id } });
  },
};