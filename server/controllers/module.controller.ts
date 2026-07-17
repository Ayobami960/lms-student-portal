import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { moduleService } from "../services/module.service";

export const moduleController = {
  list: asyncHandler(async (req, res) => {
    const modules = await moduleService.listByCourse(req.params.courseId as string);
    sendSuccess(res, modules);
  }),
  create: asyncHandler(async (req, res) => {
    const mod = await moduleService.create(req.params.courseId as string, { id: req.user!.sub, role: req.user!.role }, req.body);
    sendSuccess(res, mod, "Module created", 201);
  }),
  update: asyncHandler(async (req, res) => {
    const mod = await moduleService.update(req.params.id as string, { id: req.user!.sub, role: req.user!.role }, req.body);
    sendSuccess(res, mod, "Module updated");
  }),
  remove: asyncHandler(async (req, res) => {
    await moduleService.remove(req.params.id as string, { id: req.user!.sub, role: req.user!.role });
    sendSuccess(res, null, "Module deleted");
  }),
};
