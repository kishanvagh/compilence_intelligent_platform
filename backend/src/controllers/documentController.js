import path from "path";
import fs from "fs";
import Document from "../models/Document.js";
import { processPDF, embedDocument, deleteDocumentVectors } from "../services/core/fastapi.service.js";
import DocumentChunk from "../models/DocumentChunk.js";
import Assessment from "../models/Assessment.js";

export const uploadDocument = async (req, res) => {
  try {
    const absolutePath = path.resolve(req.file.path);

    // Call FastAPI to parse, clean, and chunk the document
    const result = await processPDF(absolutePath);
    const chunksData = result.chunks || [];
    const extractedText = result.extractedText || "";

    console.log("Total Chunks:", chunksData.length);
    const document = await Document.create({
      userId: req.user._id,
      workspaceId: req.body.workspaceId || null,
      originalName: req.file.originalname,
      filePath: req.file.path,
      extractedText,
      totalChunks: chunksData.length,
      status: "completed",
    });

    await DocumentChunk.insertMany(
      chunksData.map((c) => ({
        documentId: document._id,
        chunkIndex: c.chunkIndex,
        text: c.text,
        pageNumber: c.pageNumber || 1,
      }))
    );

    // Call FastAPI to generate embeddings and upsert to Qdrant
    const embedResult = await embedDocument(document._id.toString(), chunksData);
    
    // Save Qdrant point IDs into MongoDB DocumentChunk records
    if (embedResult && embedResult.mappings) {
      for (const mapping of embedResult.mappings) {
        await DocumentChunk.updateOne(
          { documentId: document._id, chunkIndex: mapping.chunkIndex },
          { $set: { qdrantPointId: mapping.qdrantPointId, isEmbedded: true } }
        );
      }
    }

    res.status(201).json({
      success: true,
      document,
      analysis: {
        text: extractedText,
        pages: []
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({
      success: true,
      documents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // 1. Find document to verify ownership
    const document = await Document.findOne({ _id: id, userId });
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found or you do not have permission to delete it.",
      });
    }

    // 2. Delete local PDF file
    if (document.filePath) {
      const fullPath = path.resolve(document.filePath);
      fs.unlink(fullPath, (err) => {
        if (err) {
          console.error(`Failed to delete local file at ${fullPath}:`, err.message);
        } else {
          console.log(`Deleted local file at ${fullPath}`);
        }
      });
    }

    // 3. Delete DB Records
    await Document.findByIdAndDelete(id);
    await DocumentChunk.deleteMany({ documentId: id });
    await Assessment.deleteMany({ documentId: id });

    // 4. Delete vectors from Qdrant via FastAPI
    try {
      await deleteDocumentVectors(id.toString());
      console.log(`Deleted Qdrant vectors for document ${id} via FastAPI`);
    } catch (qdrantErr) {
      console.error(`Failed to clear Qdrant vectors for document ${id} via FastAPI:`, qdrantErr.message);
    }

    res.json({
      success: true,
      message: "Document, chunks, audits, and vector mappings deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};