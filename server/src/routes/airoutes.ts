import { Router } from "express";
import { aiController } from "../controllers/ai.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { chatSchema } from "../validations/ai.validation.js";

const router = Router();

router.post("/chat", authenticate, validate(chatSchema), aiController.chat);
router.get("/conversations", authenticate, aiController.listConversations);
router.get("/conversations/:id", authenticate, aiController.getConversation);
router.delete("/conversations/:id", authenticate, aiController.deleteConversation);

export default router;
