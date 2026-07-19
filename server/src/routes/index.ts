import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import courseRoutes from "./course.routes";
import moduleRoutes from "./module.routes";
import lessonRoutes from "./lesson.routes";
import assignmentRoutes from "./assignment.routes";
import submissionRoutes from "./submission.routes";
import gradingRoutes from "./grading.routes";
import certificateRoutes from "./certificate.routes";
import analyticsRoutes from "./analytics.routes";
import aiRoutes from "./ai.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/courses", courseRoutes);
router.use("/", moduleRoutes);       // /courses/:courseId/modules, /modules/:id
router.use("/", lessonRoutes);       // /modules/:moduleId/lessons, /lessons/:id
router.use("/", assignmentRoutes);   // /assignments, /lessons/:lessonId/assignments
router.use("/", submissionRoutes);   // /assignments/:id/submit, /submissions
router.use("/grading", gradingRoutes);
router.use("/certificates", certificateRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/ai", aiRoutes);

export default router;
