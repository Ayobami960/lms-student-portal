import { z } from "zod";

export const createTodoSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required"),
    category: z.string().optional(),
    dueAt: z.string().datetime().optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const updateTodoSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    category: z.string().optional(),
    dueAt: z.string().datetime().optional(),
    completed: z.boolean().optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
});
