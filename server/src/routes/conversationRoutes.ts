import { Router } from "express";
import { conversationController } from "../controllers/conversation.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { createConversationSchema, sendMessageSchema, updateConversationStatusSchema } from "../validations/conversation.validation.js";

const conversationRoutes = Router();

conversationRoutes.post("/", authenticate, validate(createConversationSchema), conversationController.create);
conversationRoutes.get("/", authenticate, conversationController.list);
conversationRoutes.get("/:id", authenticate, conversationController.getById);
conversationRoutes.post("/:id/messages", authenticate, validate(sendMessageSchema), conversationController.sendMessage);
conversationRoutes.patch("/:id/status", authenticate, validate(updateConversationStatusSchema), conversationController.updateStatus);

export default conversationRoutes;
