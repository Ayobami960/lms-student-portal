import { Router } from "express";
import { auditLogController } from "../controllers/audit-log.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

const auditLogRoutes = Router();

auditLogRoutes.get("/", authenticate, authorize("ADMIN"), auditLogController.list);
auditLogRoutes.get("/actions", authenticate, authorize("ADMIN"), auditLogController.actions);

export default auditLogRoutes;
