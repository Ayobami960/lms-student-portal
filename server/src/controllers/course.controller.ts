import { type Request, type Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess, sendPaginated } from "../utils/apiResponse.js";
import { courseService } from "../services/course.service.js";

export const courseController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt((req.query.page as string) ?? "1", 10);
    const limit = parseInt((req.query.limit as string) ?? "12", 10);
    const isPrivileged = req.user?.role === "ADMIN" || req.user?.role === "INSTRUCTOR";

    // 1. Build the base params with guaranteed defined fields
    const listParams: any = {
      page,
      limit,
      publishedOnly: !isPrivileged,
    };

    // 2. Conditionally append optional fields ONLY if they are populated 
    // This cleanly bypasses 'exactOptionalPropertyTypes' strict errors
    if (req.query.search) {
      listParams.search = req.query.search as string;
    }
    if (req.query.category) {
      listParams.category = req.query.category as string;
    }
    if (req.query.level) {
      listParams.level = req.query.level as any;
    }
    if (req.query.sort) {
      listParams.sort = req.query.sort as any;
    }
    if (req.user?.role === "STUDENT" && req.user.sub) {
      listParams.studentId = req.user.sub;
    }

    // 3. Dispatch the sanitized arguments object
    const { items, total } = await courseService.list(listParams);
    sendPaginated(res, items, { page, limit, total });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const studentId = req.user?.role === "STUDENT" ? req.user.sub : undefined;
    const course = await courseService.getById(req.params.id as string, studentId);
    sendSuccess(res, course);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const course = await courseService.create(req.user!.sub, req.body);
    sendSuccess(res, course, "Course created", 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const course = await courseService.update(req.params.id as string, { id: req.user!.sub, role: req.user!.role }, req.body);
    sendSuccess(res, course, "Course updated");
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await courseService.remove(req.params.id as string, { id: req.user!.sub, role: req.user!.role });
    sendSuccess(res, null, "Course deleted");
  }),

  enroll: asyncHandler(async (req: Request, res: Response) => {
    const enrollment = await courseService.enroll(req.params.id as string, req.user!.sub);
    sendSuccess(res, enrollment, "Enrolled successfully", 201);
  }),
};
