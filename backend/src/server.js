import "dotenv/config";
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0" || process.env.BYPASS_TLS === "true") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}
import app from "./app.js";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import {
  collectionExists,
  createVectorCollection,
} from "./services/core/vectorCollection.service.js";
import qdrantRoutes from "./routes/qdrantRoutes.js";
import retrievalRoutes from "./routes/retrievalRoutes.js";
import ragRoutes from "./routes/ragRoutes.js";
import complianceRoutes from "./routes/complianceRoutes.js";
import reportRouter from "./routes/reportRoutes.js";
import trendRoutes from "./routes/trendRoutes.js";
import workspaceRoutes from "./routes/workspaceRoutes.js";
import enterpriseRoutes from "./routes/enterpriseRoutes.js";
import jobQueue from "./services/core/jobQueue.service.js";
import logger from "./services/core/logger.service.js";
import { analyzeMultiDocumentCompliance } from "./services/compliance/enterpriseCompliance.service.js";
import Assessment from "./models/Assessment.js";
import { generateComplianceReport } from "./services/compliance/report.service.js";

const PORT = process.env.PORT || 5000;

/*
|--------------------------------------------------------------------------
| Register Routes (MUST be before app.listen)
|--------------------------------------------------------------------------
*/

app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/test", testRoutes);
app.use("/api/qdrant", qdrantRoutes);
app.use("/api/retrieval", retrievalRoutes);
app.use("/api/rag", ragRoutes);
app.use("/api/compliance", complianceRoutes);
app.use("/api/reports", reportRouter);
app.use("/api/trends", trendRoutes);

// Enterprise routes
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/enterprise", enterpriseRoutes);

/*
|--------------------------------------------------------------------------
| Register Background Job Handler
|--------------------------------------------------------------------------
*/

jobQueue.registerHandler("compliance_audit", async (job) => {
  const result = await analyzeMultiDocumentCompliance(
    job.documentIds,
    job.framework,
    job.workspaceId,
    async (completed, total) => {
      await jobQueue.updateProgress(job._id, completed, total);
    }
  );

  // Save assessment results
  for (const docId of job.documentIds) {
    try {
      const report = await generateComplianceReport(result);
      await Assessment.create({
        userId: job.userId,
        documentId: docId,
        workspaceId: job.workspaceId,
        framework: result.framework,
        documentType: "MULTI_DOCUMENT",
        assessmentStatus: "APPLICABLE",
        riskScore: result.riskScore,
        compliantControls: result.compliantControls,
        partialControls: result.partialControls,
        nonCompliantControls: result.nonCompliantControls,
        notApplicableControls: result.notApplicableControls,
        totalControls: result.totalControls,
        controls: result.controls,
        report,
      });
    } catch (err) {
      logger.error("Failed to save assessment for document", {
        documentId: docId,
        error: err.message,
      });
    }
  }

  return result;
});

/*
|--------------------------------------------------------------------------
| Startup
|--------------------------------------------------------------------------
*/

connectDB();

// Initialize Qdrant collection — but don't crash the server if it fails
(async () => {
  try {
    const exists = await collectionExists();
    if (!exists) {
      await createVectorCollection();
    } else {
      logger.info("Qdrant collection already exists.");
    }
  } catch (error) {
    logger.warn("Qdrant collection setup failed (server will continue without it):", error.message);
  }
})();

// Start the job queue
jobQueue.start();

app.listen(PORT, () => {
  logger.info(`Server Running On Port ${PORT}`);
});

