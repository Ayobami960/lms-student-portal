import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";

const isProduction = process.env.NODE_ENV === "production";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    if (err.statusCode >= 500) logger.error({ err }, "Internal error");
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors ? { errors: err.errors } : {}),
    });
  }

  logger.error({ err }, "Unhandled error");
  return res.status(500).json({
    success: false,
    message: isProduction ? "Internal server error" : (err as Error)?.message ?? "Internal server error",
  });
}