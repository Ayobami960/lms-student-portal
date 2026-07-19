import { Router } from "express";
import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import courseRoutes from "./courseRoutes.js";
import moduleRoutes from "./moduleRoutes.js";


const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/courses", courseRoutes);
router.use("/", moduleRoutes);       // /courses/:courseId/modules, /modules/:id
// router.use("/", lessonRoutes);       // /modules/:moduleId/lessons, /lessons/:id
// router.use("/", assignmentRoutes);   // /assignments, /lessons/:lessonId/assignments
// router.use("/", submissionRoutes);   // /assignments/:id/submit, /submissions
// router.use("/grading", gradingRoutes);
// router.use("/certificates", certificateRoutes);
// router.use("/analytics", analyticsRoutes);
// router.use("/ai", aiRoutes);

export default router;
