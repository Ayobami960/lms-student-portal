import { Router } from "express";
import { todoController } from "../controllers/todo.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { createTodoSchema, updateTodoSchema } from "../validations/todo.validation.js";

const todoRoutes = Router();

todoRoutes.get("/", authenticate, todoController.list);
todoRoutes.post("/", authenticate, validate(createTodoSchema), todoController.create);
todoRoutes.patch("/:id", authenticate, validate(updateTodoSchema), todoController.update);
todoRoutes.delete("/:id", authenticate, todoController.remove);

export default todoRoutes;
