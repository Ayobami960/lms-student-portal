import { Router } from "express"; 
import { userController } from "../controllers/user.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { upload } from "../middleware/upload.js";

const userRoutes = Router();

userRoutes.get("/me", authenticate, userController.me);
userRoutes.patch("/me", authenticate, userController.updateMe);
userRoutes.post("/avatar", authenticate, upload.single("avatar"), userController.uploadAvatar);




userRoutes.get("/", authenticate, authorize("ADMIN"), userController.listUsers);
userRoutes.patch("/:id/role", authenticate, authorize("ADMIN"), userController.updateRole);
userRoutes.patch("/:id/approve", authenticate, authorize("ADMIN"), userController.approveInstructor);
userRoutes.patch("/:id/activate", authenticate, authorize("ADMIN"), userController.activateUser);
userRoutes.patch("/:id/deactivate", authenticate, authorize("ADMIN"), userController.deactivateUser);

userRoutes.delete("/:id", authenticate, authorize("ADMIN"), userController.deleteUser);






export default userRoutes;