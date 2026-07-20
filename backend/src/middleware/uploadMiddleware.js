import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/");
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