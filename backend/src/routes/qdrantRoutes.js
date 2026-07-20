import express from "express";
import { syncDocument }
from "../controllers/qdrantController.js";

const router = express.Router();

router.post(
  "/sync/:documentId",
  syncDocument
);

export default router;