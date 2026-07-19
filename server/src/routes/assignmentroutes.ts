import { Router } from "express";
import { assignmentController } from "../controllers/assignment.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { createAssignmentSchema, updateAssignmentSchema } from "../validations/assignment.validation.js";

const router = Router();

router.get("/assignments", authenticate, assignmentController.list);
router.get("/assignments/:id", authenticate, assignmentController.getById);
router.post("/lessons/:lessonId/assignments", authenticate, authorize("INSTRUCTOR", "ADMIN"), validate(createAssignmentSchema), assignmentController.create);
router.patch("/assignments/:id", authenticate, authorize("INSTRUCTOR", "ADMIN"), validate(updateAssignmentSchema), assignmentController.update);
router.delete("/assignments/:id", authenticate, authorize("INSTRUCTOR", "ADMIN"), assignmentController.remove);

export default router;
