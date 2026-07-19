import { Router } from "express"; 
import { userController } from "../controllers/user.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { upload } from "../middleware/upload";

const userRoutes = Router();

userRoutes.get("/me", authenticate, userController.me);
userRoutes.patch("/me", authenticate, userController.updateMe);
userRoutes.post("/avatar", authenticate, upload.single("avatar"), userController.uploadAvatar);

// Admin user management
userRoutes.get("/", authenticate, authorize("ADMIN"), userController.listUsers);
userRoutes.patch("/:id/role", authenticate, authorize("ADMIN"), userController.updateRole);
userRoutes.delete("/:id", authenticate, authorize("ADMIN"), userController.deleteUser);

export default userRoutes;
