import { Router } from "express";
import { gradingController } from "../controllers/grading.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import { gradeSubmissionSchema } from "../validations/grading.validation";

const router = Router();

router.get("/submissions", authenticate, authorize("INSTRUCTOR", "ADMIN"), gradingController.list);
router.get("/submissions/:id", authenticate, authorize("INSTRUCTOR", "ADMIN"), gradingController.getById);
router.patch("/submissions/:id", authenticate, authorize("INSTRUCTOR", "ADMIN"), validate(gradeSubmissionSchema), gradingController.grade);

export default router;
