import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Assessment from "../models/Assessment.js";

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Retrieve the most recent assessment
    const lastAssessment = await Assessment.findOne({}).sort({ createdAt: -1 });
    if (!lastAssessment) {
      console.log("No assessments found in the database.");
      await mongoose.disconnect();
      return;
    }

    console.log(`Last Assessment ID: ${lastAssessment._id}`);
    console.log(`Document ID: ${lastAssessment.documentId}`);
    console.log(`Framework: ${lastAssessment.framework}`);
    console.log(`Risk Score: ${lastAssessment.riskScore}`);
    console.log("\n--- Assessment JSON ---");
    console.log(JSON.stringify(lastAssessment, null, 2));

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
