import { z } from "zod";

export const createLiveClassSchema = z.object({
  body: z.object({
    title: z.string().min(2),
    description: z.string().optional(),
    scheduledAt: z.string().datetime(),
  }),
  query: z.object({}).optional(),
  params: z.object({ courseId: z.string().uuid() }),
});

export const joinLiveClassSchema = z.object({
  body: z.object({
    studentId: z.string().optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
});

export const classChatSchema = z.object({
  body: z.object({ content: z.string().min(1) }),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
});
