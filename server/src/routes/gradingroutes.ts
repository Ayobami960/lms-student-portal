import { Router } from "express";
import { gradingController } from "../controllers/grading.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { gradeSubmissionSchema } from "../validations/grading.validation.js";

const router = Router();

router.get("/submissions", authenticate, authorize("INSTRUCTOR", "ADMIN"), gradingController.list);
router.get("/submissions/:id", authenticate, authorize("INSTRUCTOR", "ADMIN"), gradingController.getById);
router.patch("/submissions/:id", authenticate, authorize("INSTRUCTOR", "ADMIN"), validate(gradeSubmissionSchema), gradingController.grade);

export default router;
