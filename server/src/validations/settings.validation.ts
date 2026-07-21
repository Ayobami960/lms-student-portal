import { z } from "zod";

export const setMaintenanceSchema = z.object({
  body: z.object({ enabled: z.boolean(), message: z.string().optional() }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});
