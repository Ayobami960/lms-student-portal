import { z } from "zod";

export const createModuleSchema = z.object({
  body: z.object({
    title: z.string().min(2),
    description: z.string().optional(),
    order: z.number().int().nonnegative().optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({ courseId: z.string().uuid() }),
});

export const updateModuleSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    description: z.string().optional(),
    order: z.number().int().nonnegative().optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
});
