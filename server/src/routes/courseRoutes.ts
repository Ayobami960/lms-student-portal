import { Router } from "express";
import { courseController } from "../controllers/course.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { createCourseSchema, updateCourseSchema, listCoursesQuerySchema } from "../validations/course.validation.js";

// Optional auth: attaches req.user if a valid token is present, but doesn't require one
import type { Request, Response, NextFunction } from 'express';

import { verifyAccessToken } from "../utils/tokens.js";
function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (token) {
    try { req.user = verifyAccessToken(token); } catch { /* ignore invalid token for public routes */ }
  }
  next();
}

const courseRoutes = Router();

// FIX: this route is meant to be open to everyone (anonymous browsers,
// students, instructors viewing "my courses", and admins viewing the full
// catalog) — access control for it is handled inside courseController.list
// based on req.user?.role and the "mine" query flag, not by gating the
// route to a fixed role list. authorize("STUDENT", "ADMIN") was blocking
// INSTRUCTOR (and effectively anonymous users, since optionalAuth doesn't
// guarantee req.user exists) from this route entirely.
courseRoutes.get("/", optionalAuth, validate(listCoursesQuerySchema), courseController.list);
courseRoutes.post("/", authenticate, authorize("INSTRUCTOR", "ADMIN"), validate(createCourseSchema), courseController.create);
courseRoutes.get("/:id", optionalAuth, courseController.getById);
courseRoutes.patch("/:id", authenticate, authorize("INSTRUCTOR"), validate(updateCourseSchema), courseController.update);
courseRoutes.delete("/:id", authenticate, authorize("INSTRUCTOR", "ADMIN"), courseController.remove);
courseRoutes.post("/:id/enroll", authenticate, authorize("STUDENT"), courseController.enroll);

export default courseRoutes;