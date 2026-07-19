import type { NextFunction, Request, Response } from 'express';

import { ApiError } from "../utils/ApiError.js";

type Role = "STUDENT" | "INSTRUCTOR" | "ADMIN";

// Usage: authorize("ADMIN", "INSTRUCTOR")
export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden("You do not have permission to perform this action"));
    }
    next();
  };
}
