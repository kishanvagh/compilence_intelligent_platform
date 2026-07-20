import axios from "axios";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://127.0.0.1:8000";

const client = axios.create({
  baseURL: FASTAPI_URL,
  timeout: 180000, // 3 minutes timeout for heavy Gemini/Qdrant batches
});

export const processPDF = async (filePath) => {
  const response = await client.post("/ai/document/process", { filePath });
  return response.data;
};

export const embedDocument = async (documentId, chunks) => {
  const response = await client.post("/ai/document/embed", { documentId, chunks });
  return response.data;
};

export const deleteDocumentVectors = async (documentId) => {
  const response = await client.post("/ai/document/delete", { documentId });
  return response.data;
};

export const analyzeCompliance = async (documentId, framework, frameworkControls, fallbackChunks = null) => {
  const response = await client.post("/ai/compliance/analyze", {
    documentId,
    framework,
    frameworkControls,
    fallbackChunks,
  });
  return response.data;
};

export const evaluateControl = async (control, context, framework, documentName) => {
  const response = await client.post("/ai/compliance/evaluate-control", {
    control,
    context,
    framework,
    documentName,
  });
  return response.data;
};

export const generateRecommendations = async (framework, failedControls) => {
  const response = await client.post("/ai/compliance/recommendations", {
    framework,
    failedControls,
  });
  return response.data;
};

export const analyzeChangeImpact = async (oldAssessment, newAssessment) => {
  const response = await client.post("/ai/compliance/change-impact", {
    oldAssessment,
    newAssessment,
  });
  return response.data;
};

export const searchVectors = async (query, documentIds, limit = 20) => {
  const response = await client.post("/ai/search", {
    query,
    documentIds,
    limit,
  });
  return response.data;
};

export const chatRAG = async (query, documentId, fallbackChunks = null) => {
  const response = await client.post("/ai/chat", {
    query,
    documentId,
    fallbackChunks,
  });
  return response.data;
};

export const generateReport = async (assessment) => {
  const response = await client.post("/ai/report/generate", { assessment });
  return response.data;
};

export const classifyText = async (extractedText, fileName = "") => {
  const response = await client.post("/ai/classify", {
    extractedText,
    fileName,
  });
  return response.data;
};
