import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

import {
  uploadDocument,
  getDocuments,
  deleteDocument,
} from "../controllers/documentController.js";

const router = express.Router();

router.post(
  "/upload",
  authMiddleware,
  upload.single("file"),
  uploadDocument
);

router.get(
  "/",
  authMiddleware,
  getDocuments
);

router.delete(
  "/:id",
  authMiddleware,
  deleteDocument
);

export default router;