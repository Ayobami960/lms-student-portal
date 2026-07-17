import { z } from "zod";

export const createLessonSchema = z.object({
  body: z.object({
    title: z.string().min(2),
    description: z.string().optional(),
    content: z.string().optional(),
    videoUrl: z.string().url().optional(),
    order: z.number().int().nonnegative().optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({ moduleId: z.string().uuid() }),
});

export const updateLessonSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    description: z.string().optional(),
    content: z.string().optional(),
    videoUrl: z.string().url().optional(),
    order: z.number().int().nonnegative().optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
});
