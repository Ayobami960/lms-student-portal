import { type Request, type Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { liveClassService } from "../services/live-class.service.js";
import { ApiError } from "../utils/ApiError.js";

export const liveClassController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const liveClass = await liveClassService.create(req.params.courseId as string, { id: req.user!.sub, role: req.user!.role }, req.body);
    sendSuccess(res, liveClass, "Class scheduled", 201);
  }),
  listForCourse: asyncHandler(async (req: Request, res: Response) => {
    const classes = await liveClassService.listForCourse(req.params.courseId as string);
    sendSuccess(res, classes);
  }),
  start: asyncHandler(async (req: Request, res: Response) => {
    const liveClass = await liveClassService.start(req.params.id as string, { id: req.user!.sub, role: req.user!.role });
    sendSuccess(res, liveClass, "Class started");
  }),
  end: asyncHandler(async (req: Request, res: Response) => {
    const liveClass = await liveClassService.end(req.params.id as string, { id: req.user!.sub, role: req.user!.role });
    sendSuccess(res, liveClass, "Class ended");
  }),
  join: asyncHandler(async (req: Request, res: Response) => {
    const result = await liveClassService.join(req.params.id as string, { id: req.user!.sub, role: req.user!.role }, req.body.studentId);
    sendSuccess(res, result, "Access granted");
  }),
  leave: asyncHandler(async (req: Request, res: Response) => {
    if (req.user!.role !== "STUDENT") throw ApiError.badRequest("Only students have attendance tracked");
    const result = await liveClassService.leave(req.params.id as string, req.user!.sub);
    sendSuccess(res, result, "Left class");
  }),
  attendance: asyncHandler(async (req: Request, res: Response) => {
    const records = await liveClassService.getAttendance(req.params.id as string, { id: req.user!.sub, role: req.user!.role });
    sendSuccess(res, records);
  }),
  listChat: asyncHandler(async (req: Request, res: Response) => {
    const messages = await liveClassService.listChat(req.params.id as string);
    sendSuccess(res, messages);
  }),
  sendChat: asyncHandler(async (req: Request, res: Response) => {
    const message = await liveClassService.sendChat(req.params.id as string, req.user!.sub, req.body.content);
    sendSuccess(res, message, "Message sent", 201);
  }),
};