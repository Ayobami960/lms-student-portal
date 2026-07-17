import { z } from "zod";

export const chatSchema = z.object({
  body: z.object({
    message: z.string().min(1),
    conversationId: z.string().uuid().optional(),
    courseId: z.string().uuid().optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});
