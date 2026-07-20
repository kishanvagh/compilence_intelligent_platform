import { syncDocumentToQdrant }
from "../services/indexing/qdrantSync.service.js";
export const syncDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    const syncedChunks =
      await syncDocumentToQdrant(documentId);

    res.status(200).json({
      success: true,
      syncedChunks,
    });

  } catch (error) {

    console.error("Qdrant Sync Error:");
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};