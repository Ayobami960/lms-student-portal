import { Router } from "express";
import { aiController } from "../controllers/ai.controller";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { chatSchema } from "../validations/ai.validation";

const router = Router();

router.post("/chat", authenticate, validate(chatSchema), aiController.chat);
router.get("/conversations", authenticate, aiController.listConversations);
router.get("/conversations/:id", authenticate, aiController.getConversation);
router.delete("/conversations/:id", authenticate, aiController.deleteConversation);

export default router;
