import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, sendPaginated } from "../utils/apiResponse";
import { userService } from "../services/user.service";
import { storage } from "../config/storage";
import { ApiError } from "../utils/ApiError";

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
    // Type guards to ensure query keys are strings before parsing
    const queryPage = typeof req.query.page === 'string' ? req.query.page : "1";
    const queryLimit = typeof req.query.limit === 'string' ? req.query.limit : "20";

    const page = parseInt(queryPage, 10);
    const limit = parseInt(queryLimit, 10);
    
    const roleString = typeof req.query.role === 'string' ? req.query.role : undefined;
    
    const { items, total } = await userService.listAll(page, limit, roleString);
    sendPaginated(res, items, { page, limit, total });
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
