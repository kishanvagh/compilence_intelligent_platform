import axios from "axios";
import fs from "fs";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://127.0.0.1:8000";

const client = axios.create({
  baseURL: FASTAPI_URL,
  timeout: 180000, // 3 minutes timeout for heavy Gemini/Qdrant batches
});

/**
 * Pings the AI service health endpoint and waits for it to wake up.
 * Render free tier spins down after 15 min — this gives it time to cold-start.
 * @param {number} maxWaitMs - Maximum ms to wait for the service to come online
 */
const waitForAIService = async (maxWaitMs = 60000) => {
  const pollInterval = 3000; // poll every 3 seconds
  const start = Date.now();

  while (Date.now() - start < maxWaitMs) {
    try {
      await axios.get(`${FASTAPI_URL}/`, { timeout: 5000 });
      return; // Service is up
    } catch {
      console.log(`AI service not ready yet, retrying in ${pollInterval / 1000}s...`);
      await new Promise((r) => setTimeout(r, pollInterval));
    }
  }
  throw new Error(`AI service did not come online within ${maxWaitMs / 1000}s. It may be starting up — please try again.`);
};

/**
 * Wraps an AI service call with cold-start handling:
 * 1. If the first attempt fails with ECONNREFUSED / stream aborted / 502,
 *    wait for the service to wake up, then retry.
 * @param {Function} fn - Async function that makes the actual axios request
 * @param {number} retries - Number of retries
 */
const withColdStartRetry = async (fn, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isColdStart =
        err.code === "ECONNREFUSED" ||
        err.code === "ECONNRESET" ||
        err.message?.includes("stream has been aborted") ||
        err.message?.includes("socket hang up") ||
        err.response?.status === 502 ||
        err.response?.status === 503;

      if (isColdStart && attempt < retries) {
        console.warn(
          `AI service cold-start detected (attempt ${attempt}/${retries}): ${err.message}. Waiting for service to wake up...`
        );
        await waitForAIService(60000); // wait up to 60s for it to boot
        console.log("AI service is up. Retrying request...");
      } else {
        throw err; // Final attempt or non-cold-start error — rethrow
      }
    }
  }
};

export const processPDF = async (filePath) => {
  // Read file as base64 and send via JSON (avoids FormData/Blob compatibility issues)
  const fileBuffer = fs.readFileSync(filePath);
  const base64Content = fileBuffer.toString("base64");
  const fileName = filePath.split(/[/\\]/).pop();

  return withColdStartRetry(() =>
    client.post("/ai/document/process", {
      fileName,
      fileBase64: base64Content,
    }).then((r) => r.data)
  );
};

export const embedDocument = async (documentId, chunks) => {
  return withColdStartRetry(() =>
    client.post("/ai/document/embed", { documentId, chunks }).then((r) => r.data)
  );
};

export const deleteDocumentVectors = async (documentId) => {
  return withColdStartRetry(() =>
    client.post("/ai/document/delete", { documentId }).then((r) => r.data)
  );
};

export const analyzeCompliance = async (documentId, framework, frameworkControls, fallbackChunks = null) => {
  return withColdStartRetry(() =>
    client.post("/ai/compliance/analyze", {
      documentId,
      framework,
      frameworkControls,
      fallbackChunks,
    }).then((r) => r.data)
  );
};

export const evaluateControl = async (control, context, framework, documentName) => {
  return withColdStartRetry(() =>
    client.post("/ai/compliance/evaluate-control", {
      control,
      context,
      framework,
      documentName,
    }).then((r) => r.data)
  );
};

export const generateRecommendations = async (framework, failedControls) => {
  return withColdStartRetry(() =>
    client.post("/ai/compliance/recommendations", {
      framework,
      failedControls,
    }).then((r) => r.data)
  );
};

export const analyzeChangeImpact = async (oldAssessment, newAssessment) => {
  return withColdStartRetry(() =>
    client.post("/ai/compliance/change-impact", {
      oldAssessment,
      newAssessment,
    }).then((r) => r.data)
  );
};

export const searchVectors = async (query, documentIds, limit = 20) => {
  return withColdStartRetry(() =>
    client.post("/ai/search", {
      query,
      documentIds,
      limit,
    }).then((r) => r.data)
  );
};

export const chatRAG = async (query, documentId, fallbackChunks = null) => {
  return withColdStartRetry(() =>
    client.post("/ai/chat", {
      query,
      documentId,
      fallbackChunks,
    }).then((r) => r.data)
  );
};

export const generateReport = async (assessment) => {
  return withColdStartRetry(() =>
    client.post("/ai/report/generate", { assessment }).then((r) => r.data)
  );
};

export const classifyText = async (extractedText, fileName = "") => {
  return withColdStartRetry(() =>
    client.post("/ai/classify", {
      extractedText,
      fileName,
    }).then((r) => r.data)
  );
};