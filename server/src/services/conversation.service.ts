import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { notificationService } from "./notification.service.js";

async function firstAdminId(): Promise<string | null> {
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" } });
  return admin?.id ?? null;
}

export const conversationService = {
  // Students start a SUPPORT thread (goes to any/all admins). Instructors start
  // an INSTRUCTOR_DM to one specific student, and it must be for a student
  // actually enrolled in one of that instructor's courses.
  async create(sender: { id: string; role: string }, input: {
    subject: string; message: string; type: "SUPPORT" | "INSTRUCTOR_DM"; recipientId?: string; courseId?: string;
  }) {
    let participantIds: string[] = [sender.id];

    if (input.type === "SUPPORT") {
      if (sender.role !== "STUDENT") throw ApiError.forbidden("Only students can open a support conversation");
      const adminId = await firstAdminId();
      if (adminId) participantIds.push(adminId);
      // All current admins get added as participants so any of them can reply
      const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
      participantIds = [sender.id, ...admins.map((a) => a.id)];
    } else {
      if (sender.role !== "INSTRUCTOR") throw ApiError.forbidden("Only instructors can message a student directly");
      if (!input.recipientId) throw ApiError.badRequest("recipientId is required for a direct message");

      const enrolled = await prisma.enrollment.findFirst({
        where: { studentId: input.recipientId, course: { instructorId: sender.id, ...(input.courseId ? { id: input.courseId } : {}) } },
      });
      if (!enrolled) throw ApiError.forbidden("You can only message students enrolled in your own courses");
      participantIds = [sender.id, input.recipientId];
    }

    const conversation = await prisma.conversation.create({
      data: {
        type: input.type,
        subject: input.subject,
        courseId: input.courseId,
        participants: { create: participantIds.map((userId) => ({ userId })) },
        messages: { create: { senderId: sender.id, content: input.message } },
      },
      include: { messages: true, participants: { include: { user: { select: { id: true, name: true, role: true } } } } },
    });

    for (const p of conversation.participants) {
      if (p.userId !== sender.id) {
        void notificationService.create(p.userId, "MESSAGE", `New message: ${input.subject}`, input.message.slice(0, 120), "/messages");
      }
    }

    return conversation;
  },

  async listForUser(userId: string) {
    return prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      include: {
        participants: { include: { user: { select: { id: true, name: true, role: true } } } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
  },

  async getById(id: string, userId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        participants: { include: { user: { select: { id: true, name: true, role: true } } } },
        messages: { orderBy: { createdAt: "asc" }, include: { sender: { select: { id: true, name: true, role: true } } } },
      },
    });
    if (!conversation) throw ApiError.notFound("Conversation not found");
    if (!conversation.participants.some((p) => p.userId === userId)) throw ApiError.forbidden("You are not part of this conversation");
    return conversation;
  },

  async sendMessage(conversationId: string, senderId: string, content: string) {
    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId }, include: { participants: true } });
    if (!conversation) throw ApiError.notFound("Conversation not found");
    if (!conversation.participants.some((p) => p.userId === senderId)) throw ApiError.forbidden("You are not part of this conversation");

    const message = await prisma.chatMessage.create({
      data: { conversationId, senderId, content },
      include: { sender: { select: { id: true, name: true, role: true } } },
    });
    await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date(), status: "OPEN" } });

    for (const p of conversation.participants) {
      if (p.userId !== senderId) {
        void notificationService.create(p.userId, "MESSAGE", `New reply: ${conversation.subject}`, content.slice(0, 120), "/messages");
      }
    }

    return message;
  },

  async updateStatus(conversationId: string, userId: string, status: "OPEN" | "RESOLVED" | "ARCHIVED") {
    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId }, include: { participants: true } });
    if (!conversation) throw ApiError.notFound("Conversation not found");
    if (!conversation.participants.some((p) => p.userId === userId)) throw ApiError.forbidden("You are not part of this conversation");
    return prisma.conversation.update({ where: { id: conversationId }, data: { status } });
  },
};
