import { z } from "zod";

export const createAssignmentSchema = z.object({
  body: z.object({
    title: z.string().min(2),
    description: z.string().min(5),
    instructions: z.string().optional(),
    dueDate: z.string().datetime(),
    maxScore: z.number().int().positive().default(100),
  }),
  query: z.object({}).optional(),
  params: z.object({ lessonId: z.string().uuid() }),
});

export const updateAssignmentSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    description: z.string().min(5).optional(),
    instructions: z.string().optional(),
    dueDate: z.string().datetime().optional(),
    maxScore: z.number().int().positive().optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
});
