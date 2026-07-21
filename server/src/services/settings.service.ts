import { prisma } from "../config/db.js";
import { emailService } from "./email.service.js";
import { emailTemplates } from "../../emails/templates.js";
import { notificationService } from "./notification.service.js";

const MAINTENANCE_KEY = "maintenance_mode";
const MAINTENANCE_MESSAGE_KEY = "maintenance_message";

export const settingsService = {
  async getMaintenanceMode() {
    const [enabled, message] = await Promise.all([
      prisma.setting.findUnique({ where: { key: MAINTENANCE_KEY } }),
      prisma.setting.findUnique({ where: { key: MAINTENANCE_MESSAGE_KEY } }),
    ]);
    return { enabled: enabled?.value === "true", message: message?.value ?? "" };
  },

  async setMaintenanceMode(enabled: boolean, message: string | undefined) {
    await prisma.$transaction([
      prisma.setting.upsert({
        where: { key: MAINTENANCE_KEY },
        create: { key: MAINTENANCE_KEY, value: String(enabled) },
        update: { value: String(enabled) },
      }),
      prisma.setting.upsert({
        where: { key: MAINTENANCE_MESSAGE_KEY },
        create: { key: MAINTENANCE_MESSAGE_KEY, value: message ?? "" },
        update: { value: message ?? "" },
      }),
    ]);

    // Broadcast to everyone — best-effort, doesn't block the response.
    const users = await prisma.user.findMany({ select: { id: true, email: true } });
    const { subject, html } = enabled ? emailTemplates.maintenanceStarting(message) : emailTemplates.maintenanceOver();

    void emailService.sendBulk(users.map((u) => u.email), subject, html);
    void notificationService.createMany(
      users.map((u) => u.id),
      "MAINTENANCE",
      enabled ? "Scheduled maintenance" : "We're back online",
      enabled ? message || "The platform is temporarily undergoing maintenance." : "Maintenance is complete — everything is back to normal."
    );

    return { enabled, message: message ?? "" };
  },
};
