import {
  searchVectors,
  evaluateControl,
  generateRecommendations as generateRecommendationsFastAPI,
  analyzeChangeImpact as analyzeChangeImpactFastAPI,
} from "../core/fastapi.service.js";
import logger from "../core/logger.service.js";
import { getFrameworkControls } from "./framework.service.js";
import Document from "../../models/Document.js";
import DocumentChunk from "../../models/DocumentChunk.js";

/*
|--------------------------------------------------------------------------
| Multi-Document Compliance Audit
|--------------------------------------------------------------------------
*/
export const analyzeMultiDocumentCompliance = async (
  documentIds,
  framework = "SOC2",
  workspaceId = null,
  onProgress = null
) => {
  const startTime = Date.now();
  logger.info(`Starting multi-document audit via FastAPI`, {
    documentCount: documentIds.length,
    framework,
    workspaceId,
  });

  // Get documents
  const documents = await Document.find({ _id: { $in: documentIds } })
    .select("_id originalName")
    .lean();

  if (!documents.length) {
    throw new Error("No valid documents found");
  }

  // Get framework controls
  const frameworkControls = getFrameworkControls(framework);
  if (!frameworkControls || !frameworkControls.length) {
    throw new Error(`No controls found for framework: ${framework}`);
  }

  const totalControls = frameworkControls.length;
  const controlResults = [];
  const allCitations = [];
  const failedControls = [];

  const CONCURRENCY_LIMIT = parseInt(process.env.CONTROL_CONCURRENCY || "5", 10);

  // Process in batches
  for (let i = 0; i < frameworkControls.length; i += CONCURRENCY_LIMIT) {
    const batch = frameworkControls.slice(i, i + CONCURRENCY_LIMIT);

    const batchResults = await Promise.allSettled(
      batch.map(async (control) => {
        // Step 1: Retrieve relevant chunks across all documents using FastAPI similarity search
        const searchQuery = `${control.controlName} ${control.description}`;
        const docIdStrings = documents.map((d) => d._id.toString());

        let topChunks = [];
        try {
          const searchResponse = await searchVectors(searchQuery, docIdStrings, 10);
          topChunks = (searchResponse.results || []).map((chunk) => ({
            ...chunk,
            documentName:
              documents.find((d) => d._id.toString() === chunk.documentId)
                ?.originalName || "Document",
          }));
        } catch (searchError) {
          console.warn(
            `Vector search failed for control ${control.controlId}: ${searchError.message}. Falling back to MongoDB text chunks.`
          );
          // Fallback to MongoDB chunks
          for (const doc of documents) {
            const chunks = await DocumentChunk.find({ documentId: doc._id })
              .limit(5)
              .lean();
            topChunks = topChunks.concat(
              chunks.map((c) => ({
                documentId: doc._id.toString(),
                documentName: doc.originalName,
                chunkIndex: c.chunkIndex,
                pageNumber: c.pageNumber || 1,
                text: c.text,
              }))
            );
          }
        }

        // Build context
        const context = topChunks
          .map(
            (chunk) =>
              `[Document: ${chunk.documentName}] [Chunk ${chunk.chunkIndex} (Page ${chunk.pageNumber || 1})]\n${chunk.text}`
          )
          .join("\n\n");

        // Step 2: Evaluate control via FastAPI
        const evaluation = await evaluateControl(
          control,
          context,
          framework,
          documents.map((d) => d.originalName).join(", ")
        );

        // Build citations
        const citations = [];
        if (evaluation.sourceChunkIndexes && Array.isArray(evaluation.sourceChunkIndexes)) {
          for (const idx of evaluation.sourceChunkIndexes) {
            const matchingChunk = topChunks.find((c) => c.chunkIndex === idx);
            if (matchingChunk) {
              citations.push({
                documentName: matchingChunk.documentName,
                pageNumber: matchingChunk.pageNumber || 1,
                chunkIndex: matchingChunk.chunkIndex,
                similarityScore: matchingChunk.score || null,
                evidenceSnippet: matchingChunk.text
                  ? matchingChunk.text.substring(0, 500)
                  : "",
              });
            }
          }
        }

        // Calculate confidence
        const evidenceCount = citations.length;
        const hasDirectEvidence = evidenceCount > 0;
        let evidenceQualityScore = 0;
        if (evidenceCount >= 5) evidenceQualityScore = 1.0;
        else if (evidenceCount >= 3) evidenceQualityScore = 0.8;
        else if (evidenceCount >= 1) evidenceQualityScore = 0.5;

        let confidence = 0.3;
        if (evaluation.status === "COMPLIANT") {
          confidence = hasDirectEvidence ? 0.5 + evidenceQualityScore * 0.45 : 0.4;
        } else if (evaluation.status === "PARTIALLY_COMPLIANT") {
          confidence = hasDirectEvidence ? 0.4 + evidenceQualityScore * 0.4 : 0.3;
        } else if (evaluation.status === "NON_COMPLIANT") {
          confidence = hasDirectEvidence ? 0.3 + evidenceQualityScore * 0.35 : 0.2;
        } else if (evaluation.status === "NOT_APPLICABLE") {
          confidence = 0.9;
        }

        return {
          controlId: control.controlId,
          controlName: control.controlName,
          description: control.description,
          riskLevel: control.riskLevel || "MEDIUM",
          status: evaluation.status || "NON_COMPLIANT",
          evidence: evaluation.evidence || "",
          gap: evaluation.gap || null,
          businessRisk: evaluation.businessRisk || null,
          recommendation: evaluation.recommendation || null,
          explanation: evaluation.explanation || "",
          limitations: evaluation.limitations || "",
          citations,
          confidence: Number(confidence.toFixed(2)),
        };
      })
    );

    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        controlResults.push(result.value);
        allCitations.push(...(result.value.citations || []));
      } else {
        failedControls.push(result.reason?.message || "Unknown error");
      }
    }

    const completed = Math.min(i + CONCURRENCY_LIMIT, totalControls);
    if (onProgress) {
      await onProgress(completed, totalControls);
    }
  }

  const compliantControls = controlResults.filter((c) => c.status === "COMPLIANT").length;
  const partialControls = controlResults.filter((c) => c.status === "PARTIALLY_COMPLIANT").length;
  const nonCompliantControls = controlResults.filter((c) => c.status === "NON_COMPLIANT").length;
  const notApplicableControls = controlResults.filter((c) => c.status === "NOT_APPLICABLE").length;

  let riskScore = 0;
  controlResults.forEach((c) => {
    if (c.status === "NON_COMPLIANT") riskScore += 20;
    else if (c.status === "PARTIALLY_COMPLIANT") riskScore += 10;
  });
  riskScore = Math.min(riskScore, 100);

  const duration = Date.now() - startTime;

  return {
    framework,
    workspaceId,
    riskScore,
    complianceScore:
      totalControls > 0
        ? Math.round((compliantControls / totalControls) * 100)
        : 0,
    compliantControls,
    partialControls,
    nonCompliantControls,
    notApplicableControls,
    totalControls,
    controls: controlResults,
    citations: allCitations,
    failedControls: failedControls.length,
    failedControlDetails: failedControls,
    duration,
    generatedAt: new Date().toISOString(),
  };
};

/*
|--------------------------------------------------------------------------
| Single Document Compliance (Enhanced)
|--------------------------------------------------------------------------
*/
export const analyzeSingleDocumentCompliance = async (documentId, framework = "SOC2") => {
  const result = await analyzeMultiDocumentCompliance([documentId], framework, null);
  return result;
};

/*
|--------------------------------------------------------------------------
| AI Recommendations Generator
|--------------------------------------------------------------------------
*/
export const generateRecommendations = async (assessmentResult) => {
  const failedControls = (assessmentResult.controls || []).filter(
    (c) => c.status === "NON_COMPLIANT" || c.status === "PARTIALLY_COMPLIANT"
  );

  if (!failedControls.length) {
    return [];
  }

  const result = await generateRecommendationsFastAPI(
    assessmentResult.framework,
    failedControls
  );
  return result;
};

/*
|--------------------------------------------------------------------------
| Change Impact Analysis
|--------------------------------------------------------------------------
*/
export const analyzeChangeImpact = async (oldDocumentId, newDocumentId) => {
  const oldAssessment = await analyzeSingleDocumentCompliance(oldDocumentId);
  const newAssessment = await analyzeSingleDocumentCompliance(newDocumentId);

  const result = await analyzeChangeImpactFastAPI(oldAssessment, newAssessment);
  return result;
};

/*
|--------------------------------------------------------------------------
| Semantic Search across documents
|--------------------------------------------------------------------------
*/
export const semanticSearch = async ({
  query,
  workspaceId = null,
  framework = null,
  tags = [],
  department = null,
  riskLevel = null,
  startDate = null,
  endDate = null,
  limit = 20,
  offset = 0,
}) => {
  const filter = {};

  if (workspaceId) filter.workspaceId = workspaceId;
  if (department) filter.department = department;
  if (tags.length) filter.tags = { $in: tags };

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const documents = await Document.find(filter)
    .select("_id originalName documentType tags department")
    .lean();

  if (!documents.length) {
    return { results: [], total: 0 };
  }

  const docIds = documents.map((d) => d._id.toString());
  let allResults = [];

  if (query) {
    try {
      const searchResponse = await searchVectors(query, docIds, limit * 2);
      const rawResults = searchResponse.results || [];

      allResults = rawResults.map((hit) => {
        const doc = documents.find((d) => d._id.toString() === hit.documentId);
        return {
          documentId: hit.documentId,
          documentName: doc ? doc.originalName : "Document",
          documentType: doc ? doc.documentType : "UNKNOWN",
          tags: doc ? doc.tags : [],
          department: doc ? doc.department : "",
          chunkIndex: hit.chunkIndex,
          pageNumber: hit.pageNumber || 1,
          text: hit.text.substring(0, 1000),
          score: hit.score,
        };
      });
    } catch (err) {
      logger.warn(
        `FastAPI vector search failed: ${err.message}. Falling back to MongoDB text matching.`
      );
      // Fallback text match
      const chunks = await DocumentChunk.find({
        documentId: { $in: docIds },
      }).lean();

      for (const chunk of chunks) {
        const doc = documents.find(
          (d) => d._id.toString() === chunk.documentId.toString()
        );
        if (!doc) continue;

        if (chunk.text.toLowerCase().includes(query.toLowerCase())) {
          allResults.push({
            documentId: doc._id.toString(),
            documentName: doc.originalName,
            documentType: doc.documentType,
            tags: doc.tags,
            department: doc.department,
            chunkIndex: chunk.chunkIndex,
            pageNumber: chunk.pageNumber || 1,
            text: chunk.text.substring(0, 1000),
            score: null,
          });
        }
      }
    }
  } else {
    // Return all chunks sorted by document
    const chunks = await DocumentChunk.find({
      documentId: { $in: docIds },
    }).lean();

    for (const chunk of chunks) {
      const doc = documents.find(
        (d) => d._id.toString() === chunk.documentId.toString()
      );
      if (!doc) continue;

      allResults.push({
        documentId: doc._id.toString(),
        documentName: doc.originalName,
        documentType: doc.documentType,
        tags: doc.tags,
        department: doc.department,
        chunkIndex: chunk.chunkIndex,
        pageNumber: chunk.pageNumber || 1,
        text: chunk.text.substring(0, 1000),
        score: null,
      });
    }
    allResults.sort(
      (a, b) =>
        a.documentName.localeCompare(b.documentName) || a.chunkIndex - b.chunkIndex
    );
  }

  const total = allResults.length;
  const results = allResults.slice(offset, offset + limit);

  return { results, total };
};