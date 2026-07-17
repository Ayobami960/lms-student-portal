import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { assignmentService } from "../services/assignment.service";

export const assignmentController = {
  list: asyncHandler(async (req, res) => {
    const assignments = await assignmentService.listForUser(
      { id: req.user!.sub, role: req.user!.role },
      req.query.courseId as string | undefined
    );
    sendSuccess(res, assignments);
  }),
  getById: asyncHandler(async (req, res) => {
    const assignment = await assignmentService.getById(req.params.id as string);
    sendSuccess(res, assignment);
  }),
  create: asyncHandler(async (req, res) => {
    const assignment = await assignmentService.create(req.params.lessonId as string, { id: req.user!.sub, role: req.user!.role }, req.body);
    sendSuccess(res, assignment, "Assignment created", 201);
  }),
  update: asyncHandler(async (req, res) => {
    const assignment = await assignmentService.update(req.params.id as string, { id: req.user!.sub, role: req.user!.role }, req.body);
    sendSuccess(res, assignment, "Assignment updated");
  }),
  remove: asyncHandler(async (req, res) => {
    await assignmentService.remove(req.params.id as string, { id: req.user!.sub, role: req.user!.role });
    sendSuccess(res, null, "Assignment deleted");
  }),
};
