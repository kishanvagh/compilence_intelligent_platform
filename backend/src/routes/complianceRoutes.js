import express
from "express";

import {
  analyzeDocument,
  getAssessments,
  getAssessmentDetails,
}
from "../controllers/complianceController.js";
import authMiddleware from "../middleware/authMiddleware.js"
const router =
  express.Router();

router.post(
  "/analyze",
  authMiddleware,
  analyzeDocument
);

router.get(
  "/assessments",
  authMiddleware,
  getAssessments
);

router.get(
  "/assessments/:id",
  authMiddleware,
  getAssessmentDetails
);

export default router;