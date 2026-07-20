import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Assessment from "../models/Assessment.js";

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

    console.log("LAST ASSESSMENT REPORT:");
    console.log(JSON.stringify(lastAssessment.report, null, 2));

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
