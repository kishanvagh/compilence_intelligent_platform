import { searchVectors } from "../core/fastapi.service.js";
import DocumentChunk from "../../models/DocumentChunk.js";

export const retrieveRelevantChunks = async (query, documentId, limit = 10) => {
  try {
    const searchResponse = await searchVectors(
      query,
      [documentId.toString()],
      limit
    );
    const results = searchResponse.results || [];

    return results.map((hit) => ({
      score: hit.score,
      documentId: hit.documentId,
      chunkIndex: hit.chunkIndex,
      pageNumber: hit.pageNumber || 1,
      text: hit.text,
      snippet: hit.text.slice(0, 250),
    }));
  } catch (error) {
    console.warn(
      `FastAPI search failed: ${error.message}. Falling back to MongoDB text matching.`
    );
    // Fallback text matching
    const chunks = await DocumentChunk.find({ documentId }).lean();
    return chunks
      .filter((c) => c.text.toLowerCase().includes(query.toLowerCase()))
      .slice(0, limit)
      .map((c) => ({
        score: 0.5,
        documentId: c.documentId.toString(),
        chunkIndex: c.chunkIndex,
        pageNumber: c.pageNumber || 1,
        text: c.text,
        snippet: c.text.slice(0, 250),
      }));
  }
};
