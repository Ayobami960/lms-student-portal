import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { lessonService } from "../services/lesson.service";

export const lessonController = {
  list: asyncHandler(async (req, res) => {
    const lessons = await lessonService.listByModule(req.params.moduleId as string);
    sendSuccess(res, lessons);
  }),
  getById: asyncHandler(async (req, res) => {
    const studentId = req.user?.role === "STUDENT" ? req.user.sub : undefined;
    const lesson = await lessonService.getById(req.params.id as string, studentId);
    sendSuccess(res, lesson);
  }),
  create: asyncHandler(async (req, res) => {
    const lesson = await lessonService.create(req.params.moduleId as string, { id: req.user!.sub, role: req.user!.role }, req.body);
    sendSuccess(res, lesson, "Lesson created", 201);
  }),
  update: asyncHandler(async (req, res) => {
    const lesson = await lessonService.update(req.params.id as string, { id: req.user!.sub, role: req.user!.role }, req.body);
    sendSuccess(res, lesson, "Lesson updated");
  }),
  remove: asyncHandler(async (req, res) => {
    await lessonService.remove(req.params.id as string, { id: req.user!.sub, role: req.user!.role });
    sendSuccess(res, null, "Lesson deleted");
  }),
  complete: asyncHandler(async (req, res) => {
    const result = await lessonService.completeLesson(req.params.id as string, req.user!.sub);
    sendSuccess(res, result, "Lesson marked complete");
  }),
};
