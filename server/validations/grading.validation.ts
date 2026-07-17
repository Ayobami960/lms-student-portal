import { z } from "zod";

export const gradeSubmissionSchema = z.object({
  body: z.object({
    score: z.number().int().min(0),
    feedback: z.string().optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
});
