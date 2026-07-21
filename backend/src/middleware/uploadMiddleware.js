import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure uploads/ directory exists (required on Render's ephemeral filesystem)
const UPLOAD_DIR = "uploads";
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, UPLOAD_DIR);
  },

  filename(req, file, cb) {
    cb(
      null,
      `${Date.now()}-${file.originalname}`
    );
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [".pdf"];

  const ext = path.extname(file.originalname);

  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files allowed"));
  }
};

export const upload = multer({
  storage,
  fileFilter,
});