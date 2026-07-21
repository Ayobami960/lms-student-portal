import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { adminInvitationService } from "../services/admin-invitation.service.js";
import { authService } from "../services/auth.service.js";

export const adminInvitationController = {
  invite: asyncHandler(async (req, res) => {
    const inviter = await authService.me(req.user!.sub);
    const result = await adminInvitationService.invite(req.body.email, req.user!.sub, inviter.name);
    sendSuccess(res, result, "Invitation sent", 201);
  }),
  listPending: asyncHandler(async (req, res) => {
    const invites = await adminInvitationService.listPending();
    sendSuccess(res, invites);
  }),
  verify: asyncHandler(async (req, res) => {
    const result = await adminInvitationService.verify(req.params.token as string);
    sendSuccess(res, result);
  }),
  accept: asyncHandler(async (req, res) => {
    const user = await adminInvitationService.accept(req.params.token as string, req.body.name, req.body.password);
    // Reuse the normal login token-issuing flow so accepting an invite logs you straight in.
    const tokens = await authService.issueTokens(user.id, user.role, user.email);
    sendSuccess(res, { ...tokens, user: { id: user.id, name: user.name, email: user.email, role: user.role } }, "Admin account activated", 201);
  }),
};