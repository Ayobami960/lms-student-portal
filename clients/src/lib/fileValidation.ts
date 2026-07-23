// Shared client-side file validation for assignment submissions — mirrors
// the backend's Multer rules (middleware/upload.ts) so the user gets instant
// feedback instead of waiting on a round trip to hit the same check server-side.
export const ALLOWED_ASSIGNMENT_EXTENSIONS = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".zip", ".png", ".jpg", ".jpeg"];
export const MAX_ASSIGNMENT_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateAssignmentFile(file: File): FileValidationResult {
  const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase();
  if (!ALLOWED_ASSIGNMENT_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `Unsupported file type: ${ext}` };
  }
  if (file.size > MAX_ASSIGNMENT_FILE_SIZE) {
    return { valid: false, error: "File exceeds 25MB limit" };
  }
  return { valid: true };
}
