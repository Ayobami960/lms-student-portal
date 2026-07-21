import crypto from "crypto";
import bcrypt from "bcrypt";
import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { emailService } from "./email.service.js";
import { emailTemplates } from "../../emails/templates.js";

import { notificationService } from "./notification.service.js";

const INVITE_EXPIRY_MS = 48 * 60 * 60 * 1000; // 48 hours, matches the email copy

export const adminInvitationService = {
  async invite(email: string, invitedById: string, inviterName: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw ApiError.conflict("A user with this email already exists");

    const token = crypto.randomBytes(32).toString("hex");
    await prisma.adminInvitation.create({
      data: { email, token, invitedById, expiresAt: new Date(Date.now() + INVITE_EXPIRY_MS) },
    });

    const inviteUrl = `${process.env.adminAppUrl}/accept-invite?token=${token}`;
    const { subject, html } = emailTemplates.adminInvitation(inviterName, inviteUrl);
    await emailService.send({ to: email, subject, html });

    return { email, expiresAt: new Date(Date.now() + INVITE_EXPIRY_MS) };
  },

  async verify(token: string) {
    const invite = await prisma.adminInvitation.findUnique({ where: { token } });
    if (!invite || invite.accepted || invite.expiresAt < new Date()) {
      throw ApiError.badRequest("This invitation link is invalid or has expired");
    }
    return { email: invite.email };
  },

  async accept(token: string, name: string, password: string) {
    const invite = await prisma.adminInvitation.findUnique({ where: { token } });
    if (!invite || invite.accepted || invite.expiresAt < new Date()) {
      throw ApiError.badRequest("This invitation link is invalid or has expired");
    }

    const existing = await prisma.user.findUnique({ where: { email: invite.email } });
    if (existing) throw ApiError.conflict("A user with this email already exists");

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { name, email: invite.email, password: hashed, role: "ADMIN", isVerified: true, isApproved: true },
      });
      await tx.adminInvitation.update({ where: { id: invite.id }, data: { accepted: true } });
      return created;
    });

    await notificationService.create(user.id, "GENERAL", "Welcome to the admin team", "Your admin account is now active.");
    return user;
  },

  async listPending(invitedById?: string) {
    return prisma.adminInvitation.findMany({
      where: { accepted: false, expiresAt: { gt: new Date() }, ...(invitedById ? { invitedById } : {}) },
      orderBy: { createdAt: "desc" },
    });
  },
};
