import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { todoService } from "../services/todo.service.js";

export const todoController = {
  list: asyncHandler(async (req, res) => {
    const todos = await todoService.listForUser(req.user!.sub);
    sendSuccess(res, todos);
  }),
  create: asyncHandler(async (req, res) => {
    const todo = await todoService.create(req.user!.sub, req.body);
    sendSuccess(res, todo, "Todo added", 201);
  }),
  update: asyncHandler(async (req, res) => {
    const todo = await todoService.update(req.params.id as string, req.user!.sub, req.body);
    sendSuccess(res, todo, "Todo updated");
  }),
  remove: asyncHandler(async (req, res) => {
    await todoService.remove(req.params.id as string, req.user!.sub);
    sendSuccess(res, null, "Todo removed");
  }),
};
