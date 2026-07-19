import { Router } from "express";
import { moduleController } from "../controllers/module.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { createModuleSchema, updateModuleSchema } from "../validations/module.validation.js";

const moduleRoutes = Router({ mergeParams: true });

moduleRoutes.get("/courses/:courseId/modules", moduleController.list);
moduleRoutes.post("/courses/:courseId/modules", authenticate, authorize("INSTRUCTOR", "ADMIN"), validate(createModuleSchema), moduleController.create);
moduleRoutes.patch("/modules/:id", authenticate, authorize("INSTRUCTOR", "ADMIN"), validate(updateModuleSchema), moduleController.update);
moduleRoutes.delete("/modules/:id", authenticate, authorize("INSTRUCTOR", "ADMIN"), moduleController.remove);

export default moduleRoutes;
