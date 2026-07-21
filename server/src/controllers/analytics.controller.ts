import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { analyticsService } from "../services/analytics.service.js";

export const analyticsController = {
  dashboard: asyncHandler(async (req, res) => {
    const role = req.user!.role;
    const data =
      role === "STUDENT"
        ? await analyticsService.studentDashboard(req.user!.sub)
        : role === "INSTRUCTOR"
        ? await analyticsService.instructorDashboard(req.user!.sub)
        : await analyticsService.platformDashboard();
    sendSuccess(res, data);
  }),
  adminDashboard: asyncHandler(async (req, res) => {
  const data = await analyticsService.platformDashboard();
  sendSuccess(res, data);
}),
  progress: asyncHandler(async (req, res) => {
    const data = await analyticsService.studentProgress(req.user!.sub);
    sendSuccess(res, data);
  }),
  performance: asyncHandler(async (req, res) => {
    const data = await analyticsService.studentPerformance(req.user!.sub);
    sendSuccess(res, data);
  }),
};
