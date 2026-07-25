import { type Request, type Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess, sendPaginated } from "../utils/apiResponse.js";
import { userService } from "../services/user.service.js";
import { storage } from "../config/storage.js";
import { ApiError } from "../utils/ApiError.js";

function actorFrom(req: Request) {
  return { id: req.user!.sub, name: req.user!.email ?? "Admin", role: req.user!.role };
}

export const userController = {
  me: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.getById(req.user!.sub);
    sendSuccess(res, user);
  }),

  updateMe: asyncHandler(async (req: Request, res: Response) => {
    // Explicitly pick allowed fields to prevent mass-assignment exploits
    const { name, avatar } = req.body;
    const user = await userService.updateProfile(req.user!.sub, { name, avatar });
    sendSuccess(res, user, "Profile updated");
  }),

  uploadAvatar: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw ApiError.badRequest("No file uploaded");
    const url = storage.getFileUrl(req.file.filename);
    const user = await userService.setAvatar(req.user!.sub, url);
    sendSuccess(res, user, "Avatar updated");
  }),

  listUsers: asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt((req.query.page as string) ?? "1", 10);
    const limit = parseInt((req.query.limit as string) ?? "20", 10);
    const pendingOnly = req.query.pending === "true";
    const roleString = typeof req.query.role === "string" ? req.query.role : undefined;
    const search = typeof req.query.search === "string" ? req.query.search : undefined;

    const { items, total } = await userService.listAll(page, limit, roleString, pendingOnly, search);
    sendPaginated(res, items, { page, limit, total });
  }),

  getActivity: asyncHandler(async (req: Request, res: Response) => {
    const activity = await userService.getActivity(req.params.id as string);
    sendSuccess(res, activity);
  }),

  approveInstructor: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.approveInstructor(req.params.id as string, actorFrom(req));
    sendSuccess(res, user, "Instructor approved");
  }),

  activateUser: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.activateUser(req.params.id as string, actorFrom(req));
    sendSuccess(res, user, "Account activated");
  }),

  deactivateUser: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.deactivateUser(req.params.id as string, actorFrom(req), req.body?.reason);
    sendSuccess(res, user, "Account deactivated");
  }),


  assignStudentId: asyncHandler(async (req, res) => {
      const user = await userService.assignStudentId(req.params.id as string, actorFrom(req), req.body.studentId);
      sendSuccess(res, user, "Student ID assigned");
  }),

  updateRole: asyncHandler(async (req: Request, res: Response) => {
    const roleInput = req.body.role;

    if (roleInput !== "STUDENT" && roleInput !== "INSTRUCTOR" && roleInput !== "ADMIN") {
      throw ApiError.badRequest("Invalid user role provided");
    }

    const user = await userService.updateRole(req.params.id as string, roleInput, actorFrom(req));
    sendSuccess(res, user, "Role updated");
  }),

  deleteUser: asyncHandler(async (req: Request, res: Response) => {
    await userService.deleteUser(req.params.id as string, actorFrom(req));
    sendSuccess(res, null, "User deleted");
  }),
};