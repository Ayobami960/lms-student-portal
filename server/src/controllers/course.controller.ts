import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, sendPaginated } from "../utils/apiResponse";
import { courseService } from "../services/course.service";

export const courseController = {
  list: asyncHandler(async (req, res) => {
    const page = parseInt((req.query.page as string) ?? "1", 10);
    const limit = parseInt((req.query.limit as string) ?? "12", 10);
    const isPrivileged = req.user?.role === "ADMIN" || req.user?.role === "INSTRUCTOR";
    const studentId = req.user?.role === "STUDENT" ? req.user.sub : undefined;

    const { items, total } = await courseService.list({
      search: req.query.search as string | undefined,
      category: req.query.category as string | undefined,
      level: req.query.level as any,
      sort: req.query.sort as any,
      page,
      limit,
      publishedOnly: !isPrivileged,
      studentId,
    });
    sendPaginated(res, items, { page, limit, total });
  }),

  getById: asyncHandler(async (req, res) => {
    const studentId = req.user?.role === "STUDENT" ? req.user.sub : undefined;
    const course = await courseService.getById(req.params.id as string, studentId);
    sendSuccess(res, course);
  }),

  create: asyncHandler(async (req, res) => {
    const course = await courseService.create(req.user!.sub, req.body);
    sendSuccess(res, course, "Course created", 201);
  }),

  update: asyncHandler(async (req, res) => {
    const course = await courseService.update(req.params.id as string, { id: req.user!.sub, role: req.user!.role }, req.body);
    sendSuccess(res, course, "Course updated");
  }),

  remove: asyncHandler(async (req, res) => {
    await courseService.remove(req.params.id as string, { id: req.user!.sub, role: req.user!.role });
    sendSuccess(res, null, "Course deleted");
  }),

  enroll: asyncHandler(async (req, res) => {
    const enrollment = await courseService.enroll(req.params.id as string, req.user!.sub);
    sendSuccess(res, enrollment, "Enrolled successfully", 201);
  }),
};
