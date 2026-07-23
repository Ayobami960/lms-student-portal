import { prisma } from "../config/db.js";

interface Actor {
  id: string;
  name: string;
  role: string;
}

// Fire-and-forget logging: audit trail writes should never block or fail the
// request that triggered them. Callers use `void auditLogService.log(...)`.
export const auditLogService = {
  async log(actor: Actor | null, action: string, description: string, targetType?: string, targetId?: string, metadata?: Record<string, unknown>) {
    try {
      await prisma.auditLog.create({
        data: {
          action,
          actorId: actor?.id ?? null,
          actorName: actor?.name ?? "System",
          actorRole: actor?.role ?? null,
          targetType: targetType ?? null,
          targetId: targetId ?? null,
          description,
          metadata: metadata ? (metadata as any) : undefined,
        },
      });
    } catch {
      // Never let audit logging break the calling operation.
    }
  },

  async list(page: number, limit: number, filters: { action?: string; actorId?: string; from?: string; to?: string }) {
    const where: any = {
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.actorId ? { actorId: filters.actorId } : {}),
      ...(filters.from || filters.to
        ? { createdAt: { ...(filters.from ? { gte: new Date(filters.from) } : {}), ...(filters.to ? { lte: new Date(filters.to) } : {}) } }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      prisma.auditLog.count({ where }),
    ]);
    return { items, total };
  },

  async distinctActions() {
    const rows = await prisma.auditLog.findMany({ distinct: ["action"], select: { action: true }, orderBy: { action: "asc" } });
    return rows.map((r) => r.action);
  },
};