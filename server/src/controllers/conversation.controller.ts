import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { conversationService } from "../services/conversation.service.js";

export const conversationController = {
  create: asyncHandler(async (req, res) => {
    const conversation = await conversationService.create({ id: req.user!.sub, role: req.user!.role }, req.body);
    sendSuccess(res, conversation, "Conversation started", 201);
  }),
  list: asyncHandler(async (req, res) => {
    const conversations = await conversationService.listForUser(req.user!.sub);
    sendSuccess(res, conversations);
  }),
  getById: asyncHandler(async (req, res) => {
    const conversation = await conversationService.getById(req.params.id as any, req.user!.sub);
    sendSuccess(res, conversation);
  }),
  sendMessage: asyncHandler(async (req, res) => {
    const message = await conversationService.sendMessage(req.params.id as any, req.user!.sub, req.body.content);
    sendSuccess(res, message, "Message sent", 201);
  }),
  updateStatus: asyncHandler(async (req, res) => {
    const conversation = await conversationService.updateStatus(req.params.id as any, req.user!.sub, req.body.status);
    sendSuccess(res, conversation, "Conversation updated");
  }),
};
