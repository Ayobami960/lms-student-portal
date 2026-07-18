import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { aiService } from "../services/ai.service";

export const aiController = {
  chat: asyncHandler(async (req, res) => {
    const result = await aiService.chat(req.user!.sub, req.body.message, req.body.conversationId, req.body.courseId);
    sendSuccess(res, result, "Message sent");
  }),
  listConversations: asyncHandler(async (req, res) => {
    const conversations = await aiService.listConversations(req.user!.sub);
    sendSuccess(res, conversations);
  }),
  getConversation: asyncHandler(async (req, res) => {
    const conversation = await aiService.getConversation(req.params.id as string, req.user!.sub);
    sendSuccess(res, conversation);
  }),
  deleteConversation: asyncHandler(async (req, res) => {
    await aiService.deleteConversation(req.params.id as string, req.user!.sub);
    sendSuccess(res, null, "Conversation deleted");
  }),
};
