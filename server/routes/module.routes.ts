import { Router } from "express";
import { moduleController } from "../controllers/module.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import { createModuleSchema, updateModuleSchema } from "../validations/module.validation";

const router = Router({ mergeParams: true });

router.get("/courses/:courseId/modules", moduleController.list);
router.post("/courses/:courseId/modules", authenticate, authorize("INSTRUCTOR", "ADMIN"), validate(createModuleSchema), moduleController.create);
router.patch("/modules/:id", authenticate, authorize("INSTRUCTOR", "ADMIN"), validate(updateModuleSchema), moduleController.update);
router.delete("/modules/:id", authenticate, authorize("INSTRUCTOR", "ADMIN"), moduleController.remove);

export default router;
