import DocumentChunk from "../../models/DocumentChunk.js";
import { embedDocument } from "../core/fastapi.service.js";

export const syncDocumentToQdrant = async (documentId) => {
  const chunks = await DocumentChunk.find({ documentId }).lean();

  console.log(`Syncing ${chunks.length} chunks to Qdrant via FastAPI`);

  const embedResult = await embedDocument(
    documentId.toString(),
    chunks.map((c) => ({
      chunkIndex: c.chunkIndex,
      pageNumber: c.pageNumber || 1,
      text: c.text,
    }))
  );

  if (embedResult && embedResult.mappings) {
    for (const mapping of embedResult.mappings) {
      await DocumentChunk.updateOne(
        { documentId, chunkIndex: mapping.chunkIndex },
        { $set: { qdrantPointId: mapping.qdrantPointId, isEmbedded: true } }
      );
    }
  }

  return chunks.length;
};
