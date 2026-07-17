import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { upload } from "../middleware/upload";

const router = Router();

router.get("/me", authenticate, userController.me);
router.patch("/me", authenticate, userController.updateMe);
router.post("/avatar", authenticate, upload.single("avatar"), userController.uploadAvatar);

// Admin user management
router.get("/", authenticate, authorize("ADMIN"), userController.listUsers);
router.patch("/:id/role", authenticate, authorize("ADMIN"), userController.updateRole);
router.delete("/:id", authenticate, authorize("ADMIN"), userController.deleteUser);

export default router;
