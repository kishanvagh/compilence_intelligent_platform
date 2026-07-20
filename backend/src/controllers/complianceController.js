import {
  analyzeCompliance,
} from "../services/compliance/compliance.service.js";
import {
  saveAssessment,
} from "../services/compliance/assessment.service.js";
import {
  generateComplianceReport,
} from "../services/compliance/report.service.js";
const SUPPORTED_FRAMEWORKS = [
  "SOC2",
  "ISO27001",
  "GDPR",
  "NIST",
  "PCI",
  "NIST CSF",
  "PCI DSS",
];

export const analyzeDocument =
  async (req, res) => {

    try {

      const {
        documentId,
        framework,
      } = req.body;

      if (!documentId) {

        return res.status(400).json({
          success: false,
          message:
            "Document ID is required",
        });

      }

      if (!framework) {

        return res.status(400).json({
          success: false,
          message:
            "Framework is required",
        });

      }

      if (
        !SUPPORTED_FRAMEWORKS.includes(
          framework
        )
      ) {

        return res.status(400).json({
          success: false,
          message:
            `Unsupported framework. Supported frameworks: ${SUPPORTED_FRAMEWORKS.join(
              ", "
            )}`,
        });

      }

      const result =
        await analyzeCompliance(
          documentId,
          framework
        );
      const report =
        await generateComplianceReport(
          result
        );
      await saveAssessment({
        userId:
          req.user._id,
        documentId,
        assessment:
          result,
        report,
      });

      return res.status(200).json({
        success: true,
        assessment: result,
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

export const getAssessments = async (req, res) => {
  try {
    const assessments = await Assessment.find({ userId: req.user._id })
      .select("framework documentType assessmentStatus riskScore compliantControls partialControls nonCompliantControls notApplicableControls totalControls documentId createdAt")
      .populate("documentId", "originalName")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      assessments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAssessmentDetails = async (req, res) => {
  try {
    const assessment = await Assessment.findOne({ _id: req.params.id, userId: req.user._id })
      .populate("documentId", "originalName");

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found",
      });
    }

    res.json({
      success: true,
      assessment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};