import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Document from "../models/Document.js";
import DocumentChunk from "../models/DocumentChunk.js";

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const docs = await Document.find({});
    console.log(`Documents count: ${docs.length}`);
    for (const doc of docs) {
      console.log(`- ID: ${doc._id}, name: ${doc.originalName || doc.name}, status: ${doc.status}`);
    }

    const chunksCount = await DocumentChunk.countDocuments({});
    console.log(`DocumentChunks count: ${chunksCount}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
