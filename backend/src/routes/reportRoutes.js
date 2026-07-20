import express from "express";
import authMiddleware
from "../middleware/authMiddleware.js";
import {
  generateReport,
  getReports,
  getReportDetails,
} from "../controllers/reportController.js";

const router =
  express.Router();

router.post(
  "/generate",
  authMiddleware,
  generateReport
);

router.get(
  "/",
  authMiddleware,
  getReports
);

router.get(
  "/:id",
  authMiddleware,
  getReportDetails
);

export default router;