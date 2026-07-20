import { generateReport } from "../core/fastapi.service.js";

export const generateComplianceReport = async (assessment) => {
  try {
    const report = await generateReport(assessment);
    return report;
  } catch (error) {
    console.error("Executive Report Generation via FastAPI failed:", error.message);
    throw error;
  }
};
