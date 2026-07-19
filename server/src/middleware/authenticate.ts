import type { NextFunction, Request, Response } from 'express';
import { ApiError } from "../utils/ApiError.js";
import { verifyAccessToken } from "../utils/tokens.js";

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    return next(ApiError.unauthorized("Authentication token missing"));
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(ApiError.unauthorized("Invalid or expired token"));
  }
}
