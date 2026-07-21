import { Router } from "express";
import { notificationController } from "../controllers/notification.controller.js";
import { authenticate } from "../middleware/authenticate.js";

const notificationRoutes = Router();

notificationRoutes.get("/", authenticate, notificationController.list);
notificationRoutes.patch("/:id/read", authenticate, notificationController.markRead);
notificationRoutes.patch("/read-all", authenticate, notificationController.markAllRead);
notificationRoutes.delete("/:id", authenticate, notificationController.remove);

export default notificationRoutes;
