import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { NotificationType } from "../../generated/prisma/client.js";

export const notificationService = {
  async create(userId: string, type: NotificationType, title: string, message: string, link?: string) {
    return prisma.notification.create({
      data: { userId, type, title, message, ...(link ? { link } : {}) },
    });
  },

  // Fan out the same notification to many users at once (course published,
  // maintenance mode, announcements) with a single bulk insert.
  async createMany(userIds: string[], type: NotificationType, title: string, message: string, link?: string) {
    if (userIds.length === 0) return;
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({ userId, type, title, message, ...(link ? { link } : {}) })),
    });
  },

  async listForUser(userId: string, unreadOnly: boolean) {
    return prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { read: false } : {}) },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  },

  async unreadCount(userId: string) {
    return prisma.notification.count({ where: { userId, read: false } });
  },

  async markRead(id: string, userId: string) {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) throw ApiError.notFound("Notification not found");
    if (notification.userId !== userId) throw ApiError.forbidden();
    return prisma.notification.update({ where: { id }, data: { read: true } });
  },

  async markAllRead(userId: string) {
    await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
  },

  async remove(id: string, userId: string) {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) throw ApiError.notFound("Notification not found");
    if (notification.userId !== userId) throw ApiError.forbidden();
    await prisma.notification.delete({ where: { id } });
  },
};