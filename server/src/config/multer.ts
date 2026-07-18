import {type Request } from "express";
import multer, { type FileFilterCallback, type StorageEngine } from "multer";
import path from "path";

// 1. Set storage engine (temporary storage)
const storage: StorageEngine = multer.diskStorage({});

// 2. File filter (Only allow images)
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  const filetypes = /jpe?g|png|webp/;
  const mime_files = /image\/jpe?g|image\/png|image\/webp/;

  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = mime_files.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only images (jpeg, png, webp) are allowed!"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

export default upload;
