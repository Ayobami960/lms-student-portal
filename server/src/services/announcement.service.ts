import { prisma } from "../config/db.js";
import { emailService } from "./email.service.js";
import { emailTemplates } from "../../emails/templates.js";
import { notificationService } from "./notification.service.js";

export const announcementService = {
  async create(createdById: string, title: string, message: string, audience: "ALL" | "STUDENT" | "INSTRUCTOR" | "ADMIN", sendEmail: boolean) {
    const announcement = await prisma.announcement.create({ data: { title, message, audience, createdById } });

    const recipients = await prisma.user.findMany({
      where: audience === "ALL" ? {} : { role: audience },
      select: { id: true, email: true },
    });

    void notificationService.createMany(recipients.map((r) => r.id), "ANNOUNCEMENT", title, message);

    if (sendEmail) {
      const { subject, html } = emailTemplates.announcement(title, message);
      void emailService.sendBulk(recipients.map((r) => r.email), subject, html);
    }

    return announcement;
  },

  async listForUser(role: "STUDENT" | "INSTRUCTOR" | "ADMIN") {
    return prisma.announcement.findMany({
      where: { OR: [{ audience: "ALL" }, { audience: role }] },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { createdBy: { select: { name: true } } },
    });
  },
};
