import Assessment from "../../models/Assessment.js";
import Document from "../../models/Document.js";
import Workspace from "../../models/Workspace.js";
import AuditJob from "../../models/AuditJob.js";
import cache from "../core/cache.service.js";
import logger from "../core/logger.service.js";

/**
 * Executive Dashboard - aggregated compliance intelligence
 */
export const getExecutiveDashboard = async (userId, workspaceId = null) => {
  const cacheKey = `dashboard:${userId}:${workspaceId || "all"}`;

  return cache.getOrSet(cacheKey, async () => {
    const filter = { userId };
    if (workspaceId) filter.workspaceId = workspaceId;

    // Document statistics
    const documentStats = await getDocumentStats(filter);

    // Assessment statistics
    const assessmentStats = await getAssessmentStats(filter);

    // Risk distribution
    const riskDistribution = await getRiskDistribution(filter);

    // Framework distribution
    const frameworkDistribution = await getFrameworkDistribution(filter);

    // Missing controls
    const missingControls = await getMissingControls(filter);

    // Assessment timeline
    const assessmentTimeline = await getAssessmentTimeline(filter);

    // Evidence heatmap data
    const evidenceHeatmap = await getEvidenceHeatmap(filter);

    // Overall compliance score
    const complianceScore = assessmentStats.totalAssessments > 0
      ? Math.round(
          (assessmentStats.totalCompliant / assessmentStats.totalEvaluated) * 100
        )
      : 0;

    // Overall risk score
    const overallRisk = assessmentStats.totalAssessments > 0
      ? Math.round(
          assessmentStats.assessments.reduce((sum, a) => sum + (a.riskScore || 0), 0) /
            assessmentStats.totalAssessments
        )
      : 0;

    return {
      overallRisk,
      complianceScore,
      documentStats,
      assessmentStats,
      riskDistribution,
      frameworkDistribution,
      missingControls,
      assessmentTimeline,
      evidenceHeatmap,
      generatedAt: new Date().toISOString(),
    };
  }, 120); // Cache for 2 minutes
};

/**
 * Get document statistics
 */
const getDocumentStats = async (filter) => {
  const docs = await Document.find(filter).lean();

  return {
    total: docs.length,
    byType: groupBy(docs, "documentType"),
    byStatus: groupBy(docs, "status"),
    totalChunks: docs.reduce((sum, d) => sum + (d.totalChunks || 0), 0),
    recentlyUploaded: docs
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map((d) => ({
        id: d._id,
        name: d.originalName,
        type: d.documentType,
        date: d.createdAt,
      })),
  };
};

/**
 * Get assessment statistics
 */
const getAssessmentStats = async (filter) => {
  const assessments = await Assessment.find(filter)
    .populate("documentId", "originalName")
    .sort({ createdAt: -1 })
    .lean();

  const totalCompliant = assessments.reduce(
    (sum, a) => sum + (a.compliantControls || 0),
    0
  );
  const totalNonCompliant = assessments.reduce(
    (sum, a) => sum + (a.nonCompliantControls || 0),
    0
  );
  const totalPartial = assessments.reduce(
    (sum, a) => sum + (a.partialControls || 0),
    0
  );
  const totalEvaluated = totalCompliant + totalNonCompliant + totalPartial;

  return {
    totalAssessments: assessments.length,
    totalCompliant,
    totalNonCompliant,
    totalPartial,
    totalEvaluated,
    averageRiskScore:
      assessments.length > 0
        ? Math.round(
            assessments.reduce((sum, a) => sum + (a.riskScore || 0), 0) /
              assessments.length
          )
        : 0,
    assessments: assessments.slice(0, 10),
  };
};

/**
 * Get risk distribution across assessments
 */
const getRiskDistribution = async (filter) => {
  const assessments = await Assessment.find(filter).lean();

  const distribution = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  for (const a of assessments) {
    if (a.riskScore <= 25) distribution.low++;
    else if (a.riskScore <= 50) distribution.medium++;
    else if (a.riskScore <= 75) distribution.high++;
    else distribution.critical++;
  }

  return distribution;
};

/**
 * Get framework distribution
 */
const getFrameworkDistribution = async (filter) => {
  const assessments = await Assessment.find(filter).lean();

  const distribution = {};
  for (const a of assessments) {
    const fw = a.framework || "Unknown";
    if (!distribution[fw]) {
      distribution[fw] = {
        count: 0,
        totalRisk: 0,
        totalCompliant: 0,
        totalControls: 0,
      };
    }
    distribution[fw].count++;
    distribution[fw].totalRisk += a.riskScore || 0;
    distribution[fw].totalCompliant += a.compliantControls || 0;
    distribution[fw].totalControls += a.totalControls || 0;
  }

  return Object.entries(distribution).map(([framework, data]) => ({
    framework,
    assessmentCount: data.count,
    averageRisk: Math.round(data.totalRisk / data.count),
    complianceRate:
      data.totalControls > 0
        ? Math.round((data.totalCompliant / data.totalControls) * 100)
        : 0,
  }));
};

/**
 * Get missing controls across all assessments
 */
const getMissingControls = async (filter) => {
  const assessments = await Assessment.find(filter).lean();

  const controlFailures = {};
  for (const a of assessments) {
    const controls = a.controls || [];
    for (const c of controls) {
      if (c.status === "NON_COMPLIANT" || c.status === "PARTIALLY_COMPLIANT") {
        const key = c.controlId || c.controlName;
        if (!controlFailures[key]) {
          controlFailures[key] = {
            controlId: c.controlId,
            controlName: c.controlName,
            failureCount: 0,
            totalAssessments: 0,
            riskLevel: c.riskLevel || "MEDIUM",
          };
        }
        controlFailures[key].failureCount++;
      }
      if (c.controlId || c.controlName) {
        const key = c.controlId || c.controlName;
        if (!controlFailures[key]) {
          controlFailures[key] = {
            controlId: c.controlId,
            controlName: c.controlName,
            failureCount: 0,
            totalAssessments: 0,
            riskLevel: c.riskLevel || "MEDIUM",
          };
        }
        controlFailures[key].totalAssessments++;
      }
    }
  }

  return Object.values(controlFailures)
    .sort((a, b) => b.failureCount - a.failureCount)
    .slice(0, 20)
    .map((c) => ({
      ...c,
      failureRate:
        c.totalAssessments > 0
          ? Math.round((c.failureCount / c.totalAssessments) * 100)
          : 0,
    }));
};

/**
 * Get assessment timeline
 */
const getAssessmentTimeline = async (filter) => {
  const assessments = await Assessment.find(filter)
    .select("createdAt riskScore compliantControls totalControls framework")
    .sort({ createdAt: 1 })
    .lean();

  const timeline = {};
  for (const a of assessments) {
    const date = new Date(a.createdAt).toISOString().split("T")[0];
    if (!timeline[date]) {
      timeline[date] = {
        date,
        assessments: 0,
        averageRisk: 0,
        totalRisk: 0,
        frameworks: new Set(),
      };
    }
    timeline[date].assessments++;
    timeline[date].totalRisk += a.riskScore || 0;
    timeline[date].frameworks.add(a.framework);
  }

  return Object.values(timeline)
    .map((t) => ({
      ...t,
      averageRisk: Math.round(t.totalRisk / t.assessments),
      frameworks: Array.from(t.frameworks),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * Get evidence heatmap data
 */
const getEvidenceHeatmap = async (filter) => {
  const assessments = await Assessment.find(filter).lean();

  const heatmap = {};
  for (const a of assessments) {
    const controls = a.controls || [];
    for (const c of controls) {
      const citations = c.citations || [];
      const evidenceCount = citations.length;
      const key = `${a.framework || "Unknown"}-${c.controlId || c.controlName}`;

      heatmap[key] = {
        framework: a.framework,
        controlId: c.controlId,
        controlName: c.controlName,
        evidenceCount,
        status: c.status,
        confidence: c.confidence || 0,
      };
    }
  }

  return Object.values(heatmap).sort((a, b) => a.evidenceCount - b.evidenceCount);
};

/**
 * Utility: group array by key
 */
const groupBy = (arr, key) => {
  return arr.reduce((acc, item) => {
    const val = item[key] || "UNKNOWN";
    if (!acc[val]) acc[val] = 0;
    acc[val]++;
    return acc;
  }, {});
};

export default getExecutiveDashboard;