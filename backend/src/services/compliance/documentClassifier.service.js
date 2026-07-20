import { classifyText } from "../core/fastapi.service.js";
import logger from "../core/logger.service.js";

/**
 * Classify a document based on its extracted text content
 */
export const classifyDocument = async (extractedText, fileName = "") => {
  try {
    const result = await classifyText(extractedText, fileName);
    return result;
  } catch (error) {
    logger.error("Document classification failed via FastAPI", {
      error: error.message,
      fileName,
    });
    return {
      documentType: "UNKNOWN",
      confidence: 0,
      reasoning: "Classification failed: " + error.message,
    };
  }
};

/**
 * Batch classify multiple documents
 */
export const batchClassifyDocuments = async (documents) => {
  const results = [];
  for (const doc of documents) {
    const classification = await classifyDocument(
      doc.extractedText,
      doc.originalName
    );
    results.push({
      documentId: doc._id,
      ...classification,
    });
  }
  return results;
};

export default classifyDocument;