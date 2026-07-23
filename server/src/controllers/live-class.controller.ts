import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { liveClassService } from "../services/live-class.service.js";
import { ApiError } from "../utils/ApiError.js";

export const liveClassController = {
  create: asyncHandler(async (req, res) => {
    const liveClass = await liveClassService.create(req.params.courseId as any, { id: req.user!.sub, role: req.user!.role }, req.body);
    sendSuccess(res, liveClass, "Class scheduled", 201);
  }),
  listForCourse: asyncHandler(async (req, res) => {
    const classes = await liveClassService.listForCourse(req.params.courseId as any);
    sendSuccess(res, classes);
  }),
  start: asyncHandler(async (req, res) => {
    const liveClass = await liveClassService.start(req.params.id as any, { id: req.user!.sub, role: req.user!.role });
    sendSuccess(res, liveClass, "Class started");
  }),
  end: asyncHandler(async (req, res) => {
    const liveClass = await liveClassService.end(req.params.id as any, { id: req.user!.sub, role: req.user!.role });
    sendSuccess(res, liveClass, "Class ended");
  }),
  join: asyncHandler(async (req, res) => {
    const result = await liveClassService.join(req.params.id as any, { id: req.user!.sub, role: req.user!.role }, req.body.studentId);
    sendSuccess(res, result, "Access granted");
  }),
  leave: asyncHandler(async (req, res) => {
    if (req.user!.role !== "STUDENT") throw ApiError.badRequest("Only students have attendance tracked");
    const result = await liveClassService.leave(req.params.id as any, req.user!.sub);
    sendSuccess(res, result, "Left class");
  }),
  attendance: asyncHandler(async (req, res) => {
    const records = await liveClassService.getAttendance(req.params.id as any, { id: req.user!.sub, role: req.user!.role });
    sendSuccess(res, records);
  }),
  listChat: asyncHandler(async (req, res) => {
    const messages = await liveClassService.listChat(req.params.id as any);
    sendSuccess(res, messages);
  }),
  sendChat: asyncHandler(async (req, res) => {
    const message = await liveClassService.sendChat(req.params.id as any, req.user!.sub, req.body.content);
    sendSuccess(res, message, "Message sent", 201);
  }),
};
