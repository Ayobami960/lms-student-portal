import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/authenticate.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "../validations/auth.validation.js";

const authRoutes = Router();

authRoutes.post("/register", authLimiter, validate(registerSchema), authController.register);
authRoutes.post("/login", authLimiter, validate(loginSchema), authController.login);
authRoutes.post("/logout", authController.logout);
authRoutes.post("/refresh", authController.refresh);
authRoutes.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
authRoutes.post("/reset-password", authLimiter, validate(resetPasswordSchema), authController.resetPassword);
authRoutes.get("/me", authenticate, authController.me);



export default authRoutes;
