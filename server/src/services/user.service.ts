import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";

export const userService = {
  async getById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, avatar: true, isVerified: true, createdAt: true, updatedAt: true },
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

  async listAll(page: number, limit: number, role?: string) {
    const where = role ? { role: role as any } : {};
    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, email: true, role: true, isVerified: true, createdAt: true },
      }),
      prisma.user.count({ where }),
    ]);
    return { items, total };
  },

  async updateRole(id: string, role: "STUDENT" | "INSTRUCTOR" | "ADMIN") {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw ApiError.notFound("User not found");
    return prisma.user.update({ where: { id }, data: { role }, select: { id: true, name: true, role: true } });
  },

  async deleteUser(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw ApiError.notFound("User not found");
    await prisma.user.delete({ where: { id } });
  },
};
