import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Assessment from "../models/Assessment.js";
import { generateComplianceReport } from "../services/compliance/report.service.js";

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const lastAssessment = await Assessment.findOne({}).sort({ createdAt: -1 });
    if (!lastAssessment) {
      console.log("No assessments found.");
      await mongoose.disconnect();
      return;
    }

    console.log(`Generating report for assessment ID: ${lastAssessment._id}`);
    
    // Construct the assessment object in the format report.service expects
    const assessmentData = lastAssessment.toObject();

    const report = await generateComplianceReport(assessmentData);
    console.log("\n--- GENERATED REPORT ---");
    console.log(JSON.stringify(report, null, 2));

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error generating report:", error);
    try {
      await mongoose.disconnect();
    } catch (_) {}
  }
}

main();
