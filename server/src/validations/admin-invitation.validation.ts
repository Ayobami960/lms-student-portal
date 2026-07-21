import { z } from "zod";

export const inviteAdminSchema = z.object({
  body: z.object({ email: z.string().email("Invalid email address") }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[0-9]/, "Password must contain a number");

export const acceptInviteSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name is required"),
    password: passwordSchema,
  }),
  query: z.object({}).optional(),
  params: z.object({ token: z.string().min(1) }),
});
