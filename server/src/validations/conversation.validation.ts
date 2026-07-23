import { z } from "zod";

export const createConversationSchema = z.object({
  body: z.object({
    subject: z.string().min(2, "Subject is required"),
    message: z.string().min(1, "Message is required"),
    type: z.enum(["SUPPORT", "INSTRUCTOR_DM"]).default("SUPPORT"),
    recipientId: z.string().uuid().optional(), // required for INSTRUCTOR_DM (the student being messaged)
    courseId: z.string().uuid().optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const sendMessageSchema = z.object({
  body: z.object({ content: z.string().min(1, "Message cannot be empty") }),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
});

export const updateConversationStatusSchema = z.object({
  body: z.object({ status: z.enum(["OPEN", "RESOLVED", "ARCHIVED"]) }),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
});
