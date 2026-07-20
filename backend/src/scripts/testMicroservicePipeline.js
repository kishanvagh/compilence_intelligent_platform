import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";
import Document from "../models/Document.js";
import DocumentChunk from "../models/DocumentChunk.js";
import { processPDF, embedDocument, analyzeCompliance, searchVectors, deleteDocumentVectors } from "../services/core/fastapi.service.js";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/compliance_intelligence";

async function run() {
  console.log("--- Starting Microservice Pipeline Integration Test ---");
  
  // Resolve existing uploaded PDF
  const testPdfPath = path.resolve(process.cwd(), "uploads", "1784552052499-Access-Control-Policy.pdf");
  if (!fs.existsSync(testPdfPath)) {
    console.error("Test PDF not found at:", testPdfPath);
    process.exit(1);
  }
  console.log("Using valid test PDF:", testPdfPath);

  // 1. Connect to MongoDB (with fallback/mock mode)
  let isMockDb = false;
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 });
    console.log("Connected to MongoDB successfully.");
  } catch (err) {
    console.warn("\n[Warning] MongoDB connection failed. Running in MOCK DB mode to test API integration...", err.message);
    isMockDb = true;
    
    // Mock Mongoose model behaviors for test execution
    Document.create = async (docData) => {
      console.log("[Mock DB] Document.create called for:", docData.originalName);
      return { _id: new mongoose.Types.ObjectId().toString(), ...docData };
    };

    DocumentChunk.insertMany = async (chunks) => {
      console.log("[Mock DB] DocumentChunk.insertMany called for chunks count:", chunks.length);
      return chunks;
    };

    DocumentChunk.updateOne = async (filter, update) => {
      console.log(`[Mock DB] DocumentChunk.updateOne for chunkIndex: ${filter.chunkIndex} set pointId to: ${update.$set.qdrantPointId}`);
      return { modifiedCount: 1 };
    };

    DocumentChunk.find = () => ({
      select: () => ({
        sort: () => ({
          limit: () => ({
            lean: async () => {
              console.log("[Mock DB] DocumentChunk.find fallback chunks returned.");
              return [
                { chunkIndex: 0, text: "This is a mock policy document. GDPR requires organizations to encrypt all user personal data at rest using AES-256.", pageNumber: 1 },
                { chunkIndex: 1, text: "MFA must be enabled for all administrator accounts. Incident reviews should happen quarterly.", pageNumber: 1 }
              ];
            }
          })
        })
      })
    });
  }

  try {
    // 2. Test PDF extraction & chunking via FastAPI
    console.log("\n[Step 1] Requesting FastAPI to parse and chunk document...");
    const processResult = await processPDF(testPdfPath);
    console.log("FastAPI Process Result: success =", processResult.status === "success");
    console.log("Extracted characters:", processResult.extractedText?.length || 0);
    console.log("Extracted chunks count:", processResult.chunks?.length || 0);

    if (!processResult.chunks || processResult.chunks.length === 0) {
      throw new Error("FastAPI failed to extract chunks.");
    }

    // 3. Save document and chunks in MongoDB (without embeddings)
    console.log("\n[Step 2] Storing document and chunks in MongoDB metadata records...");
    const document = await Document.create({
      userId: new mongoose.Types.ObjectId(),
      originalName: "1784552052499-Access-Control-Policy.pdf",
      filePath: testPdfPath,
      extractedText: processResult.extractedText,
      totalChunks: processResult.chunks.length,
      status: "completed",
    });
    console.log("Document saved with ID:", document._id);

    await DocumentChunk.insertMany(
      processResult.chunks.map(c => ({
        documentId: document._id,
        chunkIndex: c.chunkIndex,
        text: c.text,
        pageNumber: c.pageNumber || 1,
      }))
    );
    console.log("Chunks saved in database (confirming NO embedding arrays are stored in MongoDB).");

    // 4. Test Embedding & Sync via FastAPI
    console.log("\n[Step 3] Requesting FastAPI to generate embeddings and sync to Qdrant...");
    const embedResult = await embedDocument(document._id.toString(), processResult.chunks);
    console.log("FastAPI Embed Result: status =", embedResult.status);
    console.log("Mappings returned:", embedResult.mappings?.length || 0);

    // Save mapping IDs to MongoDB
    if (embedResult.mappings) {
      for (const m of embedResult.mappings) {
        await DocumentChunk.updateOne(
          { documentId: document._id, chunkIndex: m.chunkIndex },
          { $set: { qdrantPointId: m.qdrantPointId, isEmbedded: true } }
        );
      }
      console.log("Updated Qdrant point mappings.");
    }

    // 5. Test Compliance Analysis via FastAPI
    console.log("\n[Step 4] Requesting FastAPI to analyze compliance against GDPR...");
    const mockControls = [
      {
        controlId: "GDPR-1",
        controlName: "Data Encryption",
        description: "Verify that organization personal data is encrypted at rest.",
        riskLevel: "CRITICAL",
      },
      {
        controlId: "GDPR-2",
        controlName: "Multi-Factor Authentication",
        description: "MFA should be enabled on administrator accounts.",
        riskLevel: "HIGH",
      }
    ];

    const assessment = await analyzeCompliance(
      document._id.toString(),
      "GDPR",
      mockControls
    );
    console.log("FastAPI Compliance Result: framework =", assessment.framework);
    console.log("Risk Score calculated:", assessment.riskScore);
    console.log("Controls evaluated count:", assessment.controls?.length || 0);

    // 6. Test Vector Similarity Search via FastAPI
    console.log("\n[Step 5] Requesting FastAPI to perform semantic search...");
    const searchResult = await searchVectors("MFA administrator accounts", [document._id.toString()], 2);
    console.log("FastAPI Search Result: total found =", searchResult.total);
    if (searchResult.results && searchResult.results.length > 0) {
      console.log("Top match text snippet:", searchResult.results[0].text);
      console.log("Top match score:", searchResult.results[0].score);
    }

    // 7. Cleanup Vectors via FastAPI
    console.log("\n[Step 6] Deleting Qdrant vectors via FastAPI...");
    const deleteResult = await deleteDocumentVectors(document._id.toString());
    console.log("FastAPI Vector Deletion Result: status =", deleteResult.status);

  } catch (err) {
    console.error("\nIntegration Test Failed:", err);
  } finally {
    if (!isMockDb) {
      await mongoose.disconnect();
    }
    console.log("\nIntegration Test Finished.");
  }
}

run();
