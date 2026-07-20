import { z } from "zod";


export const createCourseSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    description: z.string().min(10),
    category: z.string().min(2),
    level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).default("BEGINNER"),
    duration: z.number().int().nonnegative().default(0),
    thumbnail: z.string().url().optional(),
    published: z.boolean().default(false), // NEW — defaults to draft
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const updateCourseSchema = z.object({
  body: createCourseSchema.shape.body.partial().extend({
    published: z.boolean().optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
});

export const listCoursesQuerySchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    search: z.string().optional(),
    category: z.string().optional(),
    level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
    sort: z.enum(["newest", "popular", "rating", "alphabetical"]).optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  
    mine: z.string().optional(),
  }),
  params: z.object({}).optional(),
});