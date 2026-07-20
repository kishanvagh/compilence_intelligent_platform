import express from "express";
import { searchVectors } from "../services/core/fastapi.service.js";

const router = express.Router();

router.get("/test-embedding", async (req, res) => {
  try {
    // Call FastAPI search endpoint as a test
    const response = await searchVectors(
      "GDPR requires organizations to protect user data.",
      []
    );

    res.json({
      success: true,
      results: response,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;