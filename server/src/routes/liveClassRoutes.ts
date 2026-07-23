import { Router } from "express";
import { liveClassController } from "../controllers/live-class.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { createLiveClassSchema, joinLiveClassSchema, classChatSchema } from "../validations/live-class.validation.js";

const liveClassRoutes = Router();

liveClassRoutes.post("/courses/:courseId/live-classes", authenticate, authorize("INSTRUCTOR", "ADMIN"), validate(createLiveClassSchema), liveClassController.create);
liveClassRoutes.get("/courses/:courseId/live-classes", authenticate, liveClassController.listForCourse);
liveClassRoutes.post("/live-classes/:id/start", authenticate, authorize("INSTRUCTOR", "ADMIN"), liveClassController.start);
liveClassRoutes.post("/live-classes/:id/end", authenticate, authorize("INSTRUCTOR", "ADMIN"), liveClassController.end);
liveClassRoutes.post("/live-classes/:id/join", authenticate, validate(joinLiveClassSchema), liveClassController.join);
liveClassRoutes.post("/live-classes/:id/leave", authenticate, liveClassController.leave);
liveClassRoutes.get("/live-classes/:id/attendance", authenticate, authorize("INSTRUCTOR", "ADMIN"), liveClassController.attendance);
liveClassRoutes.get("/live-classes/:id/chat", authenticate, liveClassController.listChat);
liveClassRoutes.post("/live-classes/:id/chat", authenticate, validate(classChatSchema), liveClassController.sendChat);

export default liveClassRoutes;
