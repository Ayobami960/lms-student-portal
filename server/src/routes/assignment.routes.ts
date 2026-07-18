import { Router } from "express";
import { assignmentController } from "../controllers/assignment.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import { createAssignmentSchema, updateAssignmentSchema } from "../validations/assignment.validation";

const router = Router();

router.get("/assignments", authenticate, assignmentController.list);
router.get("/assignments/:id", authenticate, assignmentController.getById);
router.post("/lessons/:lessonId/assignments", authenticate, authorize("INSTRUCTOR", "ADMIN"), validate(createAssignmentSchema), assignmentController.create);
router.patch("/assignments/:id", authenticate, authorize("INSTRUCTOR", "ADMIN"), validate(updateAssignmentSchema), assignmentController.update);
router.delete("/assignments/:id", authenticate, authorize("INSTRUCTOR", "ADMIN"), assignmentController.remove);

export default router;
