import { Router } from "express";
import { aiController } from "../controllers/ai.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { chatSchema } from "../validations/ai.validation.js";

const aiRoutes = Router();

aiRoutes.post("/chat", authenticate, validate(chatSchema), aiController.chat);
aiRoutes.get("/conversations", authenticate, aiController.listConversations);
aiRoutes.get("/conversations/:id", authenticate, aiController.getConversation);
aiRoutes.delete("/conversations/:id", authenticate, aiController.deleteConversation);

export default aiRoutes;
