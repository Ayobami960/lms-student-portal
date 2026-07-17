import { Router } from "express";
import { lessonController } from "../controllers/lesson.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import { createLessonSchema, updateLessonSchema } from "../validations/lesson.validation";

const router = Router();

router.get("/modules/:moduleId/lessons", lessonController.list);
router.post("/modules/:moduleId/lessons", authenticate, authorize("INSTRUCTOR", "ADMIN"), validate(createLessonSchema), lessonController.create);
router.get("/lessons/:id", authenticate, lessonController.getById);
router.patch("/lessons/:id", authenticate, authorize("INSTRUCTOR", "ADMIN"), validate(updateLessonSchema), lessonController.update);
router.delete("/lessons/:id", authenticate, authorize("INSTRUCTOR", "ADMIN"), lessonController.remove);
router.post("/lessons/:id/complete", authenticate, authorize("STUDENT"), lessonController.complete);

export default router;
