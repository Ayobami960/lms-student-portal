import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/authenticate";
import { authLimiter } from "../middleware/rateLimit";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "../validations/auth.validation";

const authRoutes = Router();

authRoutes.post("/register", authLimiter, validate(registerSchema), authController.register);
authRoutes.post("/login", authLimiter, validate(loginSchema), authController.login);
authRoutes.post("/logout", authController.logout);
authRoutes.post("/refresh", authController.refresh);
authRoutes.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
authRoutes.post("/reset-password", authLimiter, validate(resetPasswordSchema), authController.resetPassword);
authRoutes.get("/me", authenticate, authController.me);

export default authRoutes;
