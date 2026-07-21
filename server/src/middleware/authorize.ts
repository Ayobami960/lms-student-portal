import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError.js";

export function authorize(...roles: Array<"STUDENT" | "INSTRUCTOR" | "ADMIN">) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role as any)) {
      return next(ApiError.forbidden("You do not have permission to perform this action"));
    }
    next();
  };
}