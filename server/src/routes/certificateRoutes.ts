import { Router } from "express";
import { certificateController } from "../controllers/certificate.controller.js";
import { authenticate } from "../middleware/authenticate.js";

const certificateRoutes = Router();

certificateRoutes.get("/", authenticate, certificateController.list);
certificateRoutes.get("/:id", authenticate, certificateController.getById);
certificateRoutes.post("/generate", authenticate, certificateController.generate);
certificateRoutes.get("/:id/download", authenticate, certificateController.download);

export default certificateRoutes;
