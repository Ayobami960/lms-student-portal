import type { NextFunction, Request, Response } from "express";
import { ZodObject, ZodError } from "zod"; 
import { ApiError } from "../utils/ApiError";


export function validate(schema: ZodObject<any, any>) { 
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({ body: req.body, query: req.query, params: req.params });
      req.body = parsed.body ?? req.body;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.issues.map((e) => ({ 
          field: e.path.join("."), 
          message: e.message 
        }));
        return next(ApiError.badRequest("Validation failed", errors));
      }

      const safeErrors = err && typeof err === "object" && Array.isArray((err as any).errors) ? (err as any).errors : undefined;
      if (Array.isArray(safeErrors)) {
        const errors = safeErrors.map((e: any) => ({ field: String(e?.path?.join?.(".") ?? ""), message: String(e?.message ?? "" ) }));
        return next(ApiError.badRequest("Validation failed", errors));
      }

      next(err);
    }
  };
}
