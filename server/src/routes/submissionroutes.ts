import { Router } from "express";
import { submissionController } from "../controllers/submission.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.post("/assignments/:id/submit", authenticate, authorize("STUDENT"), upload.single("file"), submissionController.submit);
router.get("/submissions", authenticate, submissionController.list);
router.get("/submissions/:id", authenticate, submissionController.getById);

export default router;
