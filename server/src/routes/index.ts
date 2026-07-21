import { Router } from "express";
import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import courseRoutes from "./courseRoutes.js";
import moduleRoutes from "./moduleRoutes.js";
import lessonRoutes from "./lessonRoutes.js";
import assignmentRoutes from "./assignmentRoutes.js";
import submissionRoutes from "./submissionRoutes.js";
import gradingRoutes from "./gradingRoutes.js";
import certificateRoutes from "./certificateRoutes.js";
import analyticsRoutes from "./analyticsRoutes.js";
import aiRoutes from "./aiRoutes.js";
import settingsRoutes from "./submissionRoutes.js";
import adminInvitationRoutes from "./adminInvitationRoutes.js";
import announcementRoutes from "./announcementRoutes.js";
import notificationRoutes from "./notificationRoutes.js";


const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/courses", courseRoutes);
router.use("/", moduleRoutes);       
router.use("/", lessonRoutes);      
router.use("/", assignmentRoutes);  
router.use("/", submissionRoutes);   
router.use("/grading", gradingRoutes);
router.use("/certificates", certificateRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/notifications", notificationRoutes);
router.use("/ai", aiRoutes);
router.use("/admin/invitations", adminInvitationRoutes);
router.use("/settings", settingsRoutes);
router.use("/announcements", announcementRoutes);

export default router;
