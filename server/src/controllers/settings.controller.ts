import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { settingsService } from "../services/settings.service.js";

export const settingsController = {
  getMaintenance: asyncHandler(async (_req, res) => {
    const status = await settingsService.getMaintenanceMode();
    sendSuccess(res, status);
  }),
  setMaintenance: asyncHandler(async (req, res) => {
    const status = await settingsService.setMaintenanceMode(req.body.enabled, req.body.message);
    sendSuccess(res, status, status.enabled ? "Maintenance mode enabled" : "Maintenance mode disabled");
  }),
};
