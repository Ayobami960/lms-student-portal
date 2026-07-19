import { Router } from "express";
import { lessonController } from "../controllers/lesson.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { createLessonSchema, updateLessonSchema } from "../validations/lesson.validation.js";

const lessonRoutes = Router();

lessonRoutes.get("/modules/:moduleId/lessons", lessonController.list);
lessonRoutes.post("/modules/:moduleId/lessons", authenticate, authorize("INSTRUCTOR", "ADMIN"), validate(createLessonSchema), lessonController.create);
lessonRoutes.get("/lessons/:id", authenticate, lessonController.getById);
lessonRoutes.patch("/lessons/:id", authenticate, authorize("INSTRUCTOR", "ADMIN"), validate(updateLessonSchema), lessonController.update);
lessonRoutes.delete("/lessons/:id", authenticate, authorize("INSTRUCTOR", "ADMIN"), lessonController.remove);
lessonRoutes.post("/lessons/:id/complete", authenticate, authorize("STUDENT"), lessonController.complete);

export default lessonRoutes;
