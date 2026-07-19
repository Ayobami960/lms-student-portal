import { Router } from "express";
import { submissionController } from "../controllers/submission.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { upload } from "../middleware/upload";

const router = Router();

router.post("/assignments/:id/submit", authenticate, authorize("STUDENT"), upload.single("file"), submissionController.submit);
router.get("/submissions", authenticate, submissionController.list);
router.get("/submissions/:id", authenticate, submissionController.getById);

export default router;
