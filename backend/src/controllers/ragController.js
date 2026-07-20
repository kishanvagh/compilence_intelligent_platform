import {
  generateRagAnswer,
} from "../services/rag/rag.service.js";

export const askQuestion =
  async (req, res) => {

    try {

      const {
        query,
        documentId,
      } = req.body;

      if (!query) {
        return res.status(400).json({
          success: false,
          message:
            "Query is required",
        });
      }

      if (!documentId) {
        return res.status(400).json({
          success: false,
          message:
            "Document ID is required",
        });
      }

      const result =
        await generateRagAnswer(
          query,
          documentId
        );

      return res.status(200).json({
        success: true,
        answer: result.answer,
        sources: result.sources,
      });

    } catch (error) {

      return res.status(500).json({
        success: false,
        message:
          error.message,
      });

    }
};