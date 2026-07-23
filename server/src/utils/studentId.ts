import { prisma } from "../config/db.js";

// Generates sequential IDs like STD-2026-000001. Not perfectly race-safe under
// extreme concurrent registrations (two requests could both count N existing
// students and collide), so the caller retries on a unique-constraint error —
// see auth.service.ts. Good enough at LMS registration volumes.
export async function generateStudentId(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.user.count({ where: { role: "STUDENT" } });
  const sequence = (count + 1).toString().padStart(6, "0");
  return `STD-${year}-${sequence}`;
}
