import path from "path";
import fs from "fs";
import { env } from "./env";

// Minimal local-disk storage adapter. Swap for Cloudinary/S3 in production
// by implementing the same interface (uploadDir/getFileUrl).
const UPLOAD_DIR = path.join(process.cwd(), "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const storage = {
  uploadDir: UPLOAD_DIR,
  provider: env.storageProvider,
  getFileUrl(filename: string): string {
    return `/uploads/${filename}`;
  },
};
