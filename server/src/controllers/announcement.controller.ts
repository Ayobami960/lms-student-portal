import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { announcementService } from "../services/announcement.service.js";

export const announcementController = {
  create: asyncHandler(async (req, res) => {
    const announcement = await announcementService.create(req.user!.sub, req.body.title, req.body.message, req.body.audience, req.body.sendEmail);
    sendSuccess(res, announcement, "Announcement published", 201);
  }),
  list: asyncHandler(async (req, res) => {
    const announcements = await announcementService.listForUser(req.user!.role);
    sendSuccess(res, announcements);
  }),
};
