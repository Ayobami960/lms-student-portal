import { Router } from "express";
import { gradingController } from "../controllers/grading.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { gradeSubmissionSchema } from "../validations/grading.validation.js";

const gradingRoutes = Router();

gradingRoutes.get("/submissions", authenticate, authorize("INSTRUCTOR", "ADMIN"), gradingController.list);
gradingRoutes.get("/submissions/:id", authenticate, authorize("INSTRUCTOR", "ADMIN"), gradingController.getById);
gradingRoutes.patch("/submissions/:id", authenticate, authorize("INSTRUCTOR", "ADMIN"), validate(gradeSubmissionSchema), gradingController.grade);

export default gradingRoutes;
