import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess, sendPaginated } from "../utils/apiResponse.js";
import { userService } from "../services/user.service.js";
import { storage } from "../config/storage.js";
import { ApiError } from "../utils/ApiError.js";

export const userController = {
  me: asyncHandler(async (req, res) => {
    const user = await userService.getById(req.user!.sub);
    sendSuccess(res, user);
  }),

  updateMe: asyncHandler(async (req, res) => {
    // Explicitly pick allowed fields to prevent mass-assignment exploits
    const { name, avatar } = req.body;
    const user = await userService.updateProfile(req.user!.sub, { name, avatar });
    sendSuccess(res, user, "Profile updated");
  }),

  uploadAvatar: asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequest("No file uploaded");
    const url = storage.getFileUrl(req.file.filename);
    const user = await userService.setAvatar(req.user!.sub, url);
    sendSuccess(res, user, "Avatar updated");
  }),

  listUsers: asyncHandler(async (req, res) => {
    const page = parseInt((req.query.page as string) ?? "1", 10);
    const limit = parseInt((req.query.limit as string) ?? "20", 10);
    const pendingOnly = req.query.pending === "true";
    const roleString = typeof req.query.role === 'string' ? req.query.role : undefined;

    const { items, total } = await userService.listAll(page, limit, roleString, pendingOnly);
    sendPaginated(res, items, { page, limit, total });
  }),

  approveInstructor: asyncHandler(async (req, res) => {
    const user = await userService.approveInstructor(req.params.id as string);
    sendSuccess(res, user, "Instructor approved");
  }),

  setActive: asyncHandler(async (req, res) => {
    const user = await userService.setActive(req.params.id as string, req.body.isActive);
    sendSuccess(res, user, req.body.isActive ? "Account activated" : "Account deactivated");
  }),

  updateRole: asyncHandler(async (req, res) => {
    const roleInput = req.body.role;

    // Strict runtime type guard to satisfy TypeScript constraints and Prisma Enums
    if (roleInput !== "STUDENT" && roleInput !== "INSTRUCTOR" && roleInput !== "ADMIN") {
      throw ApiError.badRequest("Invalid user role provided");
    }

    const user = await userService.updateRole(req.params.id as string, roleInput);
    sendSuccess(res, user, "Role updated");
  }),

  deleteUser: asyncHandler(async (req, res) => {
    await userService.deleteUser(req.params.id as string);
    sendSuccess(res, null, "User deleted");
  }),
};