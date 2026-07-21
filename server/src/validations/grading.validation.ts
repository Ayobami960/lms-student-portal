import { z } from "zod";

export const gradeSubmissionSchema = z.object({
  body: z
    .object({
      score: z.number().int().min(0),
      feedback: z.string().optional(),
      approved: z.boolean(),
    })
    .refine((d) => d.approved || (d.feedback && d.feedback.trim().length > 0), {
      message: "Feedback is required when requesting revision so the student knows what to fix",
      path: ["feedback"],
    }),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
});
