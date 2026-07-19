import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // FIX: Fallback to an empty string to satisfy exactOptionalPropertyTypes
    url: process.env["DATABASE_URL"] ?? "", 
  },
});
