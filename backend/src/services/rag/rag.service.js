import { chatRAG } from "../core/fastapi.service.js";
import DocumentChunk from "../../models/DocumentChunk.js";

export const generateRagAnswer = async (query, documentId) => {
  try {
    // Retrieve fallback chunks from MongoDB to ensure high availability if Qdrant is offline
    const fallbackChunks = await DocumentChunk.find({ documentId })
      .select("chunkIndex text pageNumber")
      .sort({ chunkIndex: 1 })
      .lean();

    const response = await chatRAG(
      query,
      documentId.toString(),
      fallbackChunks.map((c) => ({
        chunkIndex: c.chunkIndex,
        pageNumber: c.pageNumber || 1,
        text: c.text,
      }))
    );

    return response;
  } catch (error) {
    console.error("RAG Chat Error via FastAPI:", error.message);
    throw error;
  }
};
