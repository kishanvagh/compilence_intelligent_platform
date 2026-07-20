import {
  analyzeMultiDocumentCompliance,
  analyzeSingleDocumentCompliance,
  generateRecommendations,
  analyzeChangeImpact,
  semanticSearch,
} from "../services/compliance/enterpriseCompliance.service.js";
import { classifyDocument } from "../services/compliance/documentClassifier.service.js";
import { getExecutiveDashboard } from "../services/compliance/dashboard.service.js";
import { getAvailableFrameworks, getFrameworkMetadata, seedFrameworkToDB } from "../services/compliance/framework.service.js";
import jobQueue from "../services/core/jobQueue.service.js";
import Document from "../models/Document.js";
import Assessment from "../models/Assessment.js";
import { logAudit } from "../services/core/logger.service.js";

/**
 * Multi-document compliance audit
 */
export const runMultiDocumentAudit = async (req, res) => {
  try {
    const { documentIds, framework, workspaceId } = req.body;

    if (!documentIds || !documentIds.length) {
      return res.status(400).json({ success: false, message: "Document IDs are required" });
    }
    if (!framework) {
      return res.status(400).json({ success: false, message: "Framework is required" });
    }

    // Enqueue as background job
    const job = await jobQueue.enqueue({
      userId: req.user._id,
      workspaceId: workspaceId || null,
      documentIds,
      framework,
      metadata: { initiatedBy: req.user.email },
    });

    logAudit("MULTI_DOCUMENT_AUDIT_STARTED", req.user._id, null, {
      documentCount: documentIds.length,
      framework,
      jobId: job._id,
    });

    res.status(202).json({
      success: true,
      message: "Audit job queued",
      jobId: job._id,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get audit job status
 */
export const getAuditJobStatus = async (req, res) => {
  try {
    const job = await jobQueue.getJobStatus(req.params.jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }
    res.json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all audit jobs for user
 */
export const getAuditJobs = async (req, res) => {
  try {
    const { limit, skip } = req.query;
    const jobs = await jobQueue.getUserJobs(
      req.user._id,
      parseInt(limit) || 20,
      parseInt(skip) || 0
    );
    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Cancel an audit job
 */
export const cancelAuditJob = async (req, res) => {
  try {
    const job = await jobQueue.cancelJob(req.params.jobId, req.user._id);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found or already completed" });
    }
    res.json({ success: true, message: "Job cancelled", job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Classify a document
 */
export const classifyDocumentHandler = async (req, res) => {
  try {
    const { documentId } = req.body;
    if (!documentId) {
      return res.status(400).json({ success: false, message: "Document ID is required" });
    }

    const doc = await Document.findById(documentId);
    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    const classification = await classifyDocument(doc.extractedText, doc.originalName);

    // Update document with classification
    doc.documentType = classification.documentType;
    doc.classificationConfidence = classification.confidence;
    await doc.save();

    res.json({ success: true, classification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get executive dashboard
 */
export const getDashboard = async (req, res) => {
  try {
    const { workspaceId } = req.query;
    const dashboard = await getExecutiveDashboard(req.user._id, workspaceId || null);
    res.json({ success: true, dashboard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get available frameworks
 */
export const getFrameworks = async (req, res) => {
  try {
    const frameworks = getAvailableFrameworks();
    res.json({ success: true, frameworks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get framework details
 */
export const getFrameworkDetails = async (req, res) => {
  try {
    const { framework } = req.params;
    const metadata = getFrameworkMetadata(framework);
    res.json({ success: true, metadata });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Seed framework to database
 */
export const seedFramework = async (req, res) => {
  try {
    const { frameworkId } = req.body;
    if (!frameworkId) {
      return res.status(400).json({ success: false, message: "Framework ID is required" });
    }
    const result = await seedFrameworkToDB(frameworkId);
    res.json({ success: true, framework: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Generate AI recommendations for an assessment
 */
export const getRecommendations = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const assessment = await Assessment.findById(assessmentId).lean();
    if (!assessment) {
      return res.status(404).json({ success: false, message: "Assessment not found" });
    }

    const recommendations = await generateRecommendations(assessment);
    res.json({ success: true, recommendations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Change impact analysis between document versions
 */
export const getChangeImpact = async (req, res) => {
  try {
    const { oldDocumentId, newDocumentId } = req.body;
    if (!oldDocumentId || !newDocumentId) {
      return res.status(400).json({ success: false, message: "Both old and new document IDs are required" });
    }

    const impact = await analyzeChangeImpact(oldDocumentId, newDocumentId);
    res.json({ success: true, impact });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Semantic search across documents
 */
export const searchDocuments = async (req, res) => {
  try {
    const {
      query,
      workspaceId,
      framework,
      tags,
      department,
      riskLevel,
      startDate,
      endDate,
      limit,
      offset,
    } = req.query;

    const results = await semanticSearch({
      query,
      workspaceId: workspaceId || null,
      framework: framework || null,
      tags: tags ? tags.split(",") : [],
      department: department || null,
      riskLevel: riskLevel || null,
      startDate: startDate || null,
      endDate: endDate || null,
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0,
    });

    res.json({ success: true, ...results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};