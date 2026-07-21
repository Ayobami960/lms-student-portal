import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { notificationService } from "../services/notification.service.js";

export const notificationController = {
  list: asyncHandler(async (req, res) => {
    const unreadOnly = req.query.unread === "true";
    const [notifications, unreadCount] = await Promise.all([
      notificationService.listForUser(req.user!.sub, unreadOnly),
      notificationService.unreadCount(req.user!.sub),
    ]);
    sendSuccess(res, { notifications, unreadCount });
  }),
  markRead: asyncHandler(async (req, res) => {
    const notification = await notificationService.markRead(req.params.id as string, req.user!.sub);
    sendSuccess(res, notification);
  }),
  markAllRead: asyncHandler(async (req, res) => {
    await notificationService.markAllRead(req.user!.sub);
    sendSuccess(res, null, "All notifications marked as read");
  }),
  remove: asyncHandler(async (req, res) => {
    await notificationService.remove(req.params.id as string, req.user!.sub);
    sendSuccess(res, null, "Notification deleted");
  }),
};