import multer from "multer";
import path from "path";
import crypto from "crypto";
import { storage } from "../config/storage";
import { ApiError } from "../utils/ApiError";

const ALLOWED_EXT = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".zip", ".png", ".jpg", ".jpeg"];
const MAX_SIZE = 25 * 1024 * 1024; // 25MB

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, storage.uploadDir),
  filename: (_req, file, cb) => {
    const unique = crypto.randomBytes(8).toString("hex");
    cb(null, `${Date.now()}-${unique}${path.extname(file.originalname)}`);
  },
});

export const upload = multer({
  storage: diskStorage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      return cb(ApiError.badRequest(`Unsupported file type: ${ext}. Allowed: ${ALLOWED_EXT.join(", ")}`) as unknown as Error);
    }
    cb(null, true);
  },
});
