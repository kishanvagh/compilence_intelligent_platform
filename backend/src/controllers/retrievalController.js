// src/controllers/retrievalController.js

import {
  retrieveRelevantChunks,
} from "../services/rag/retrieval.service.js";

export const searchDocuments =
  async (req, res) => {

    try {

      const {
        query,
        documentId,
      } = req.body;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: "Query is required",
        });
      }

      if (!documentId) {
        return res.status(400).json({
          success: false,
          message:
            "Document ID is required",
        });
      }

      const results =
        await retrieveRelevantChunks(
          query,
          documentId
        );

      res.status(200).json({
        success: true,
        results,
      });

    } catch (error) {

      res.status(500).json({
        success: false,
        message: error.message,
      });

    }
};