import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { certificateService } from "../services/certificate.service.js";
import { ApiError } from "../utils/ApiError.js";
import path from "path";
import { storage } from "../config/storage.js";

export const certificateController = {
  list: asyncHandler(async (req, res) => {
    const certs = await certificateService.listForUser(req.user!.sub);
    sendSuccess(res, certs);
  }),
  getById: asyncHandler(async (req, res) => {
    const cert = await certificateService.getById(req.params.id as string, { id: req.user!.sub, role: req.user!.role });
    sendSuccess(res, cert);
  }),
  generate: asyncHandler(async (req, res) => {
    const cert = await certificateService.generate(req.body.courseId, req.user!.sub);
    sendSuccess(res, cert, "Certificate generated", 201);
  }),
  download: asyncHandler(async (req, res) => {
    const cert = await certificateService.getById(req.params.id as string, { id: req.user!.sub, role: req.user!.role });
    if (!cert.certificateUrl) throw ApiError.notFound("Certificate file not available");
    const filename = path.basename(cert.certificateUrl);
    res.download(path.join(storage.uploadDir, filename));
  }),
};
