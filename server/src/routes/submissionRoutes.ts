import { Router } from "express";
import { submissionController } from "../controllers/submission.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { upload } from "../middleware/upload.js";

const settingsRoutes = Router();

settingsRoutes.post("/assignments/:id/submit", authenticate, authorize("STUDENT"), upload.single("file"), submissionController.submit);
settingsRoutes.get("/submissions", authenticate, submissionController.list);
settingsRoutes.get("/submissions/:id", authenticate, submissionController.getById);



export default settingsRoutes;
