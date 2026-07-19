import { Router } from "express";
import { courseController } from "../controllers/course.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import { createCourseSchema, updateCourseSchema, listCoursesQuerySchema } from "../validations/course.validation";

// Optional auth: attaches req.user if a valid token is present, but doesn't require one
import type { Request, Response, NextFunction } from 'express';

import { verifyAccessToken } from "../utils/tokens";
function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (token) {
    try { req.user = verifyAccessToken(token); } catch { /* ignore invalid token for public routes */ }
  }
  next();
}

const router = Router();

router.get("/", optionalAuth, validate(listCoursesQuerySchema), courseController.list);
router.post("/", authenticate, authorize("INSTRUCTOR", "ADMIN"), validate(createCourseSchema), courseController.create);
router.get("/:id", optionalAuth, courseController.getById);
router.patch("/:id", authenticate, authorize("INSTRUCTOR", "ADMIN"), validate(updateCourseSchema), courseController.update);
router.delete("/:id", authenticate, authorize("INSTRUCTOR", "ADMIN"), courseController.remove);
router.post("/:id/enroll", authenticate, authorize("STUDENT"), courseController.enroll);

export default router;
