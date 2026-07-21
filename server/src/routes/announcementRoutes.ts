import { Router } from "express";
import { announcementController } from "../controllers/announcement.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { createAnnouncementSchema } from "../validations/announcement.validation.js";

const announcementRoutes = Router();

announcementRoutes.get("/", authenticate, announcementController.list);
announcementRoutes.post("/", authenticate, authorize("ADMIN"), validate(createAnnouncementSchema), announcementController.create);

export default announcementRoutes;
