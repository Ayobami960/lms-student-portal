import { type Request, type Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess, sendPaginated } from "../utils/apiResponse.js";
import { courseService } from "../services/course.service.js";

export const courseController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt((req.query.page as string) ?? "1", 10);
    const limit = parseInt((req.query.limit as string) ?? "12", 10);
    const role = req.user?.role;
    const isAdmin = role === "ADMIN";

    const wantsMine = req.query.mine === "true";
    const isOwnerView = role === "INSTRUCTOR" && wantsMine;

    // 1. Build the base params with guaranteed defined fields
    const listParams: any = {
      page,
      limit,
      publishedOnly: !isAdmin && !isOwnerView,
    };


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

    if (isOwnerView && req.user?.sub) {
      listParams.instructorId = req.user.sub;
    }

    // 3. Dispatch the sanitized arguments object
    const { items, total } = await courseService.list(listParams);
    sendPaginated(res, items, { page, limit, total });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const requester = req.user ? { id: req.user.sub, role: req.user.role } : undefined;
    const course = await courseService.getById(req.params.id as string, requester);
    sendSuccess(res, course);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const isAdmin = req.user!.role === "ADMIN";
    const { instructorId: bodyInstructorId, ...courseData } = req.body;
    const instructorId = isAdmin && bodyInstructorId ? bodyInstructorId : req.user!.sub;

    const course = await courseService.create(instructorId, courseData);
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

  enroll: asyncHandler(async (req, res) => {
    const targetStudentId = req.user!.role === "ADMIN" && req.body?.studentId ? req.body.studentId : req.user!.sub;
    const actor = { id: req.user!.sub, name: req.user!.email, role: req.user!.role };
    const enrollment = await courseService.enroll(req.params.id as string, targetStudentId, actor);
    sendSuccess(res, enrollment, "Enrolled successfully", 201);
  }),

  unenroll: asyncHandler(async (req, res) => {
    const actor = { id: req.user!.sub, name: req.user!.email, role: req.user!.role };
    await courseService.unenroll(req.params.enrollmentId as string, actor);
    sendSuccess(res, null, "Student removed from course");
  }),

  roster: asyncHandler(async (req, res) => {
    const roster = await courseService.getCourseRoster(req.params.id as string, { id: req.user!.sub, role: req.user!.role });
    sendSuccess(res, roster);
  }),
};