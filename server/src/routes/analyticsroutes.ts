import { Router } from "express";
import { analyticsController } from "../controllers/analytics.controller.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

router.get("/dashboard", authenticate, analyticsController.dashboard);
router.get("/progress", authenticate, analyticsController.progress);
router.get("/performance", authenticate, analyticsController.performance);

export default router;
