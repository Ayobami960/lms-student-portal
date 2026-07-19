import 'dotenv/config'
import path from "path";
import fs from "fs";

const isVercelRuntime = process.env.VERCEL === "1";

// Local disk storage only makes sense outside serverless (e.g. local dev).
// On Vercel, use Cloudinary/S3 — local disk is read-only and ephemeral.
const UPLOAD_DIR = isVercelRuntime
  ? "/tmp/uploads"
  : path.join(process.cwd(), "uploads");

if (!isVercelRuntime && !fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const storage = {
  uploadDir: UPLOAD_DIR,
  provider: process.env.STORAGE_PROVIDER ?? "local",
  getFileUrl(filename: string): string {
    return `/uploads/${filename}`;
  },
};