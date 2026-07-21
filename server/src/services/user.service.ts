import { emailTemplates } from "../../emails/templates.js";
import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { emailService } from "./email.service.js";
import { notificationService } from "./notification.service.js";

export const userService = {
  async getById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, avatar: true, isVerified: true, isApproved: true, createdAt: true, updatedAt: true },
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

  async listAll(page: number, limit: number, role?: string, pending?: boolean) {
    const where: any = role ? { role: role as any } : {};
    if (pending) {
      where.isApproved = false;
    }
    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, email: true, role: true, isVerified: true, isApproved: true, createdAt: true },
      }),
      prisma.user.count({ where }),
    ]);
    return { items, total };
  },

  async approveInstructor(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw ApiError.notFound("User not found");
    if (user.role !== "INSTRUCTOR") throw ApiError.badRequest("Only instructor accounts require approval");
    const updated = await prisma.user.update({ where: { id }, data: { isApproved: true }, select: { id: true, name: true, email: true, isApproved: true } });

    const { subject, html } = emailTemplates.instructorApproved(updated.name);
    void emailService.send({ to: updated.email, subject, html });
    void notificationService.create(id, "INSTRUCTOR_APPROVED", "Account approved", "Your instructor account has been approved by an admin.", "/dashboard");

    return updated;
  },

  async setActive(id: string, isActive: boolean) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw ApiError.notFound("User not found");
    const updated = await prisma.user.update({ where: { id }, data: { isActive }, select: { id: true, name: true, email: true, isActive: true } });

    const { subject, html } = isActive ? emailTemplates.accountActivated(updated.name) : emailTemplates.accountDeactivated(updated.name);
    void emailService.send({ to: updated.email, subject, html });
    void notificationService.create(
      id,
      isActive ? "ACCOUNT_ACTIVATED" : "ACCOUNT_DEACTIVATED",
      isActive ? "Account reactivated" : "Account deactivated",
      isActive ? "Your account has been reactivated." : "Your account has been deactivated by an administrator."
    );

    return updated;
  },

  async updateRole(id: string, role: "STUDENT" | "INSTRUCTOR" | "ADMIN") {
    const [user] = await prisma.$transaction([
      prisma.user.update({ where: { id }, data: { role } }),
      // Force logout everywhere — old tokens carry the stale role claim
      prisma.refreshToken.updateMany({ where: { userId: id }, data: { revoked: true } }),
    ]);
    return user;
  },

  async deleteUser(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw ApiError.notFound("User not found");
    await prisma.user.delete({ where: { id } });
  },
};