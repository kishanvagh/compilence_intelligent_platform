import {
  analyzeCompliance,
} from "../services/compliance/compliance.service.js";

import {
  generateComplianceReport,
} from "../services/compliance/report.service.js";

import {
  saveAssessment,
}
from "../services/compliance/assessment.service.js";
export const generateReport =
  async (req, res) => {

    try {

      const { documentId } =
        req.body;

      if (!documentId) {

        return res.status(400).json({
          success: false,
          message:
            "Document ID is required",
        });

      }

      const assessment =
        await analyzeCompliance(
          documentId
        );

      const report =
        await generateComplianceReport(
          assessment
        );
      const savedAssessment =
        await saveAssessment({

          userId:
            req.user.id,

          documentId,

          assessment,

          report,

      });
      return res.status(200).json({

        success: true,

        assessmentId:
          savedAssessment._id,

        report: {
          ...report,
          assessment,
        },

      });

    } catch (error) {

      console.error(error);

      return res.status(500).json({
        success: false,
        message:
          error.message,
      });

    }

};

import Assessment from "../models/Assessment.js";

export const getReports = async (req, res) => {
  try {
    const reports = await Assessment.find({ 
      userId: req.user._id, 
      report: { $exists: true, $ne: null, $ne: {} } 
    })
    .select("framework documentId riskScore createdAt report")
    .populate("documentId", "originalName")
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      reports,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getReportDetails = async (req, res) => {
  try {
    const assessment = await Assessment.findOne({ 
      _id: req.params.id, 
      userId: req.user._id,
      report: { $exists: true, $ne: null, $ne: {} }
    })
    .populate("documentId", "originalName");

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    let reportData = assessment.report;
    if (!reportData || !reportData.executiveSummary) {
      reportData = await generateComplianceReport(assessment);
      assessment.report = reportData;
      assessment.markModified("report");
      await assessment.save();
    }

    res.json({
      success: true,
      report: {
        ...reportData,
        assessment,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

