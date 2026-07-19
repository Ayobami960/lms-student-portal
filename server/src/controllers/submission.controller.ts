import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { submissionService } from "../services/submission.service.js";

export const submissionController = {
  submit: asyncHandler(async (req, res) => {
    const submission = await submissionService.submit(req.params.id as string, req.user!.sub, req.file, req.body.comment);
    sendSuccess(res, submission, "Assignment submitted", 201);
  }),
  list: asyncHandler(async (req, res) => {
    const submissions = await submissionService.listForUser(
      { id: req.user!.sub, role: req.user!.role },
      req.query.assignmentId as string | undefined
    );
    sendSuccess(res, submissions);
  }),
  getById: asyncHandler(async (req, res) => {
    const submission = await submissionService.getById(req.params.id as string, { id: req.user!.sub, role: req.user!.role });
    sendSuccess(res, submission);
  }),
};
