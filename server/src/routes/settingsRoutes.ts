import { Router } from "express";
import { settingsController } from "../controllers/settings.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { setMaintenanceSchema } from "../validations/settings.validation.js";

const settingsRoutes = Router();

// Public read so every frontend can check maintenance status before rendering,
// even for logged-out visitors.
settingsRoutes.get("/maintenance", settingsController.getMaintenance);
settingsRoutes.patch("/maintenance", authenticate, authorize("ADMIN"), validate(setMaintenanceSchema), settingsController.setMaintenance);

export default settingsRoutes;
