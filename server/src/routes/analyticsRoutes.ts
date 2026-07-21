import { Router } from "express";
import { analyticsController } from "../controllers/analytics.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

const analyticsRoutes = Router();

analyticsRoutes.get("/dashboard", authenticate, analyticsController.dashboard);
analyticsRoutes.get("/progress", authenticate, analyticsController.progress);
analyticsRoutes.get("/admin/dashboard", authenticate, authorize("ADMIN"), analyticsController.adminDashboard);
analyticsRoutes.get("/performance", authenticate, analyticsController.performance);

export default analyticsRoutes;
