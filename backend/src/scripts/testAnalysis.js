import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import { analyzeCompliance } from "../services/compliance/compliance.service.js";
import { generateRagAnswer } from "../services/rag/rag.service.js";

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const documentId = "6a2bedfa40433ea85303e85c"; // HDFC Life Policy
    console.log(`\n--- Testing Compliance Analysis on Doc ${documentId} ---`);
    try {
      const assessmentResult = await analyzeCompliance(documentId, "SOC2");
      console.log("Compliance analysis completed successfully!");
      console.log("Assessment Result keys:", Object.keys(assessmentResult));
      console.log("Risk Score:", assessmentResult.riskScore);
    } catch (err) {
      console.error("Compliance Analysis Failed with error:", err);
    }

    console.log(`\n--- Testing RAG Q&A on Doc ${documentId} ---`);
    try {
      const qaResult = await generateRagAnswer("What is the name of the policy?", documentId);
      console.log("RAG Q&A completed successfully!");
      console.log("Answer:", qaResult.answer);
      console.log("Number of sources:", qaResult.sources.length);
    } catch (err) {
      console.error("RAG Q&A Failed with error:", err);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error("Main Error:", error);
  }
}

main();
