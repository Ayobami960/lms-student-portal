import type { NextFunction, Request, Response } from "express";
import { settingsService } from "../services/settings.service.js";
import { verifyAccessToken } from "../utils/tokens.js";

// Blocks everyone except admins while maintenance mode is on. Runs globally,
// before any route-level `authenticate` middleware, so it decodes the token
// itself (best-effort — an invalid/missing token just means "not an admin",
// it doesn't error here; the route's own `authenticate` will reject it properly
// if the route actually requires auth).
export async function maintenanceGate(req: Request, res: Response, next: NextFunction) {
  if (req.path.startsWith("/auth") || req.path.startsWith("/settings/maintenance")) return next();

  const { enabled, message } = await settingsService.getMaintenanceMode();
  if (!enabled) return next();

  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (token) {
    try {
      const payload = verifyAccessToken(token);
      if (payload.role === "ADMIN") return next();
    } catch {
      /* fall through to blocked response below */
    }
  }

  return res.status(503).json({
    success: false,
    message: message || "LMS Platform is currently undergoing scheduled maintenance. Please check back soon.",
    maintenance: true,
  });
}
