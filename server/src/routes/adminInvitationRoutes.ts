import { Router } from "express";
import { adminInvitationController } from "../controllers/admin-invitation.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { inviteAdminSchema, acceptInviteSchema } from "../validations/admin-invitation.validation.js";

const adminInvitationRoutes = Router();

adminInvitationRoutes.post("/", authenticate, authorize("ADMIN"), validate(inviteAdminSchema), adminInvitationController.invite);
adminInvitationRoutes.get("/", authenticate, authorize("ADMIN"), adminInvitationController.listPending);
adminInvitationRoutes.get("/:token", adminInvitationController.verify); // public — the invited user isn't logged in yet
adminInvitationRoutes.post("/:token/accept", validate(acceptInviteSchema), adminInvitationController.accept); // public

export default adminInvitationRoutes;
