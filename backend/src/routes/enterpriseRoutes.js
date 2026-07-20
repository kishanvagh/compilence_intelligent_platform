import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  runMultiDocumentAudit,
  getAuditJobStatus,
  getAuditJobs,
  cancelAuditJob,
  classifyDocumentHandler,
  getDashboard,
  getFrameworks,
  getFrameworkDetails,
  seedFramework,
  getRecommendations,
  getChangeImpact,
  searchDocuments,
} from "../controllers/enterpriseController.js";

const router = Router();

router.use(authMiddleware);

// Dashboard
router.get("/dashboard", getDashboard);

// Frameworks
router.get("/frameworks", getFrameworks);
router.get("/frameworks/:framework", getFrameworkDetails);
router.post("/frameworks/seed", seedFramework);

// Multi-document audit
router.post("/audit/multi", runMultiDocumentAudit);
router.get("/audit/jobs", getAuditJobs);
router.get("/audit/jobs/:jobId", getAuditJobStatus);
router.post("/audit/jobs/:jobId/cancel", cancelAuditJob);

// Document classification
router.post("/classify", classifyDocumentHandler);

// Recommendations
router.get("/recommendations/:assessmentId", getRecommendations);

// Change impact analysis
router.post("/change-impact", getChangeImpact);

// Semantic search
router.get("/search", searchDocuments);

export default router;