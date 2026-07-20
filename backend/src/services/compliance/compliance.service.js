import { analyzeCompliance as analyzeComplianceFastAPI } from "../core/fastapi.service.js";
import { getFrameworkControls } from "./framework.service.js";
import DocumentChunk from "../../models/DocumentChunk.js";

export const analyzeCompliance = async (documentId, framework = "SOC2") => {
  try {
    const frameworkControls = getFrameworkControls(framework);

    // Retrieve chunks from MongoDB as a fallback context in case Qdrant is unreachable
    const fallbackChunks = await DocumentChunk.find({ documentId })
      .select("chunkIndex text pageNumber")
      .sort({ chunkIndex: 1 })
      .limit(20)
      .lean();

    const result = await analyzeComplianceFastAPI(
      documentId.toString(),
      framework,
      frameworkControls,
      fallbackChunks.map((c) => ({
        chunkIndex: c.chunkIndex,
        pageNumber: c.pageNumber || 1,
        text: c.text,
      }))
    );

    return result;
  } catch (error) {
    console.error("Compliance Analysis Error via FastAPI:", error);
    throw error;
  }
};
