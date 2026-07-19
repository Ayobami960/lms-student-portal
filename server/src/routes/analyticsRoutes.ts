import { Router } from "express";
import { analyticsController } from "../controllers/analytics.controller.js";
import { authenticate } from "../middleware/authenticate.js";

const analyticsRoutes = Router();

analyticsRoutes.get("/dashboard", authenticate, analyticsController.dashboard);
analyticsRoutes.get("/progress", authenticate, analyticsController.progress);
analyticsRoutes.get("/performance", authenticate, analyticsController.performance);

export default analyticsRoutes;
