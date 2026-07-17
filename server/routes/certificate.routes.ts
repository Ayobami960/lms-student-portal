import { Router } from "express";
import { certificateController } from "../controllers/certificate.controller";
import { authenticate } from "../middleware/authenticate";

const router = Router();

router.get("/", authenticate, certificateController.list);
router.get("/:id", authenticate, certificateController.getById);
router.post("/generate", authenticate, certificateController.generate);
router.get("/:id/download", authenticate, certificateController.download);

export default router;
