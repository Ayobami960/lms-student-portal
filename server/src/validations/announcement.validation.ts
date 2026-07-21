import { z } from "zod";

export const createAnnouncementSchema = z.object({
  body: z.object({
    title: z.string().min(2),
    message: z.string().min(2),
    audience: z.enum(["ALL", "STUDENT", "INSTRUCTOR", "ADMIN"]).default("ALL"),
    sendEmail: z.boolean().default(false),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});
