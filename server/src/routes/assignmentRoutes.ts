import { Router } from "express";
import { assignmentController } from "../controllers/assignment.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { createAssignmentSchema, updateAssignmentSchema } from "../validations/assignment.validation.js";

const assignmentRoutes = Router();

assignmentRoutes.get("/assignments", authenticate, assignmentController.list);
assignmentRoutes.get("/assignments/:id", authenticate, assignmentController.getById);
assignmentRoutes.post("/lessons/:lessonId/assignments", authenticate, authorize("INSTRUCTOR", "ADMIN"), validate(createAssignmentSchema), assignmentController.create);
assignmentRoutes.patch("/assignments/:id", authenticate, authorize("INSTRUCTOR", "ADMIN"), validate(updateAssignmentSchema), assignmentController.update);
assignmentRoutes.delete("/assignments/:id", authenticate, authorize("INSTRUCTOR", "ADMIN"), assignmentController.remove);

export default assignmentRoutes;
