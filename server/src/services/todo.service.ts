import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";

export const todoService = {
  async listForUser(userId: string) {
    return prisma.todo.findMany({ where: { userId }, orderBy: [{ completed: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }] });
  },

 async create(userId: string, data: { title: string; category?: string; dueAt?: string }) {
  return prisma.todo.create({
    data: {
      userId,
      title: data.title,
      category: data.category ?? null,
      dueAt: data.dueAt ? new Date(data.dueAt) : null,
    },
  });
},

 async update(
  id: string,
  userId: string,
  data: Partial<{ title: string; category: string | null; dueAt: string | null; completed: boolean }>
) {
  const todo = await prisma.todo.findUnique({ where: { id } });
  if (!todo || todo.userId !== userId) throw ApiError.notFound("Todo not found");

  const { dueAt, ...rest } = data;

  return prisma.todo.update({
    where: { id },
    data: {
      ...rest,
      ...(dueAt !== undefined ? { dueAt: dueAt ? new Date(dueAt) : null } : {}),
    },
  });
},
  async remove(id: string, userId: string) {
    const todo = await prisma.todo.findUnique({ where: { id } });
    if (!todo || todo.userId !== userId) throw ApiError.notFound("Todo not found");
    await prisma.todo.delete({ where: { id } });
  },
};
