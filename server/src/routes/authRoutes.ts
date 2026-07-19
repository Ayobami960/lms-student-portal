import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";

const authRoutes = Router();

authRoutes.post("/register",  authController.register);
authRoutes.post("/login", authController.login);
// authRoutes.post("/logout", authController.logout);
// authRoutes.post("/refresh", authController.refresh);
// authRoutes.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
// authRoutes.post("/reset-password", authLimiter, validate(resetPasswordSchema), authController.resetPassword);
// authRoutes.get("/me", authenticate, authController.me);

export default authRoutes;
