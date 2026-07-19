import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { gradingService } from "../services/grading.service.js";

export const gradingController = {
  list: asyncHandler(async (req, res) => {
    const submissions = await gradingService.listSubmissions(
      { id: req.user!.sub, role: req.user!.role },
      req.query.courseId as string | undefined
    );
    sendSuccess(res, submissions);
  }),
  getById: asyncHandler(async (req, res) => {
    const submission = await gradingService.getSubmission(req.params.id as string, { id: req.user!.sub, role: req.user!.role });
    sendSuccess(res, submission);
  }),
  grade: asyncHandler(async (req, res) => {
    const submission = await gradingService.grade(req.params.id as string, { id: req.user!.sub, role: req.user!.role }, req.body.score, req.body.feedback);
    sendSuccess(res, submission, "Submission graded");
  }),
};
