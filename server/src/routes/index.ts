import { Router } from "express";
import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import courseRoutes from "./courseRoutes.js";
import moduleRoutes from "./moduleRoutes.js";
import lessonRoutes from "./lessonRoutes.js";
import assignmentRoutes from "./assignmentRoutes.js";
import submissionRoutes from "./submissionRoutes.js";


const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/courses", courseRoutes);
router.use("/", moduleRoutes);       
router.use("/", lessonRoutes);      
router.use("/", assignmentRoutes);  
router.use("/", submissionRoutes);   
// router.use("/grading", gradingRoutes);
// router.use("/certificates", certificateRoutes);
// router.use("/analytics", analyticsRoutes);
// router.use("/ai", aiRoutes);

export default router;
