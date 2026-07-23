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
import liveClassRoutes from "./liveClassRoutes.js";
import auditLogRoutes from "./auditLogRoutes.js";
import conversationRoutes from "./conversationRoutes.js";


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
router.use("/", lessonRoutes);       // /modules/:moduleId/lessons, /lessons/:id
router.use("/", liveClassRoutes); 
router.use("/audit-logs", auditLogRoutes);
router.use("/conversations", conversationRoutes);

export default router;
