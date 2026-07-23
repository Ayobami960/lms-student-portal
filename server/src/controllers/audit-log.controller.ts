import { type Request, type Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendPaginated, sendSuccess } from "../utils/apiResponse.js";
import { auditLogService } from "../services/audit-log.service.js";

export const auditLogController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt((req.query.page as string) ?? "1", 10);
    const limit = parseInt((req.query.limit as string) ?? "25", 10);

    const filters: { action?: string; actorId?: string; from?: string; to?: string } = {};
    if (typeof req.query.action === "string") filters.action = req.query.action;
    if (typeof req.query.actorId === "string") filters.actorId = req.query.actorId;
    if (typeof req.query.from === "string") filters.from = req.query.from;
    if (typeof req.query.to === "string") filters.to = req.query.to;

    const { items, total } = await auditLogService.list(page, limit, filters);
    sendPaginated(res, items, { page, limit, total });
  }),

  actions: asyncHandler(async (_req: Request, res: Response) => {
    const actions = await auditLogService.distinctActions();
    sendSuccess(res, actions);
  }),
};