# Compliance Intelligence Platform — Interview Note

## Overview

The **Compliance Intelligence Platform** is a full-stack, AI-powered application designed to automate compliance auditing and document analysis. It allows organizations to upload policy documents (PDFs), run automated compliance checks against industry frameworks (e.g., SOC 2), perform semantic search across document contents, ask natural-language questions about documents via a RAG (Retrieval-Augmented Generation) chatbot, and track compliance trends over time. The system is architected as a microservice-based application with three primary tiers: a React frontend, a Node.js/Express backend API server, and a Python FastAPI AI microservice.

---

## 1. Tech Stack & Role of Each Technology

### Frontend — `/frontend/`

| Technology | Purpose in the Project |
|---|---|
| **React 19** | Core UI library for building component-based, reactive user interfaces. Handles routing, state, and rendering of all pages. |
| **Vite** | Build tool and development server. Provides fast HMR (Hot Module Replacement), optimized production builds, and native ESM support. |
| **TailwindCSS v4** | Utility-first CSS framework for styling. Enables rapid UI development with consistent design tokens and responsive layouts. |
| **React Router v7** | Client-side routing for navigation between pages (Dashboard, Documents, Analyze, QA, Reports, etc.). Implements protected/guest route guards. |
| **React Query (@tanstack/react-query)** | Server-state management library. Handles API data fetching, caching, background refetching, and optimistic updates. Reduces boilerplate for async operations. |
| **Axios** | HTTP client for making API requests to the backend Express server. Configured with interceptors for auth token injection. |
| **react-hook-form** | Lightweight form validation library. Used for login/register forms and document upload workflows. |
| **Recharts** | Charting library for rendering trend analytics graphs (compliance scores over time, risk distributions). |
| **Lucide React** | Icon library providing consistent SVG icons across the UI. |

### Backend — `/backend/`

| Technology | Purpose in the Project |
|---|---|
| **Node.js + Express v5** | Web server framework for building RESTful APIs. Routes, middleware, controllers, and services all run in this tier. Handles authentication, file uploads, orchestration of compliance audits, and reporting. |
| **MongoDB + Mongoose** | Primary database for persisting users, documents, document chunks, assessments, workspaces, audit jobs, and compliance frameworks. Mongoose provides schema validation, indexing, and query building. |
| **Multer** | Middleware for handling `multipart/form-data` (file uploads). Manages PDF uploads to the `/uploads/` directory. |
| **JWT (jsonwebtoken)** | Token-based authentication. Issues signed JWTs on login, validated by `authMiddleware` on protected routes. |
| **bcryptjs** | Password hashing for secure user credential storage. |
| **Winston** | Structured logging service. Logs request IDs, audit progress, and errors with configurable log levels and transports. |
| **Bull + Redis** | Background job queue for processing asynchronous compliance audits. Jobs are pushed to Redis, processed by workers, with progress tracking. |
| **Compression** | Gzip/brotli compression middleware for reducing API response payload sizes. |
| **CORS** | Cross-Origin Resource Sharing middleware to allow frontend (port 5173) to call backend (port 5000) during development. |
| **Qdrant JS Client** | Vector database client for interacting with Qdrant (though most vector operations go through the FastAPI microservice). |
| **dotenv** | Environment variable management from `.env` files. |

### AI Microservice — `/ai-service/`

| Technology | Purpose in the Project |
|---|---|
| **Python + FastAPI** | High-performance async Python web framework for the AI microservice. Handles all AI/ML operations: PDF text extraction, text chunking, embeddings, compliance analysis, RAG chat, and report generation. |
| **Google Gemini AI (@google/genai)** | LLM provider for all AI operations — compliance control evaluation, document classification, RAG answer generation, recommendations, and report writing. Uses `gemini-2.0-flash` or similar models via the GenAI SDK. |
| **Qdrant (Python client)** | Vector database for storing and searching document chunk embeddings. Enables semantic similarity search across document collections. |
| **PyMuPDF (fitz)** | PDF parsing library for extracting raw text and page-level content from uploaded PDF documents. |
| **Pydantic** | Data validation via request/response models for FastAPI endpoints. Ensures type safety for all API payloads. |
| **Uvicorn** | ASGI server for running the FastAPI application. |

### Infrastructure & DevOps

| Technology | Purpose in the Project |
|---|---|
| **Docker + Docker Compose** | Containerization of all services (backend, frontend, MongoDB). `docker-compose.yml` defines service dependencies, ports, volumes, and health checks. |
| **Nginx** | (Configured via `nginx.conf`) Acts as a reverse proxy for the frontend in production, serving static builds and proxying `/api` requests to the backend. |
| **Redis** | In-memory data store used by Bull for the background job queue. Manages job states, retries, and concurrency. |

---

## 2. Features & Internal Workings

### Feature 1: Document Upload & Processing Pipeline

**What it does:**  
Users upload PDF documents through the frontend UI. The system extracts text, splits it into chunks, generates vector embeddings, and stores everything for later compliance analysis and semantic search.

**How it works internally:**

1. **Upload** — The frontend (`Documents.jsx`) sends a `multipart/form-data` POST request to `/api/documents/upload` via React Query's `useMutation`. The backend's `uploadMiddleware` uses Multer to save the file to `/uploads/` with a UUID filename.
2. **Document Record Creation** — `documentController.js` creates a MongoDB `Document` document with metadata (userId, originalName, filePath, status: "uploaded").
3. **FastAPI Processing** — The backend calls `fastapi.service.js → processPDF(filePath)` which POSTs to the AI microservice at `/ai/document/process`. The microservice:
   - Extracts raw text via `PyMuPDF` (`pdf_service.py`)
   - Cleans the text (`processing_service.py`) by removing excessive whitespace, null characters, and noise
   - Splits text into chunks of ~1500 characters with 200-char overlap using `chunk_text()`
   - Returns chunks with page numbers back to the backend
4. **MongoDB Chunk Storage** — Backend stores each chunk as a `DocumentChunk` record (documentId, chunkIndex, pageNumber, text).
5. **Embedding & Vector Storage** — Backend calls `embedDocument(documentId, chunks)` which POSTs to `/ai/document/embed`. The microservice:
   - Generates a vector embedding for each chunk using `generate_embedding_with_retry()` (Gemini Embedding API)
   - Upserts each embedding into Qdrant via `upsert_chunk()`, storing vector + payload (documentId, chunkIndex, pageNumber, text)
   - Returns Qdrant point ID mappings
6. **Status Update** — Backend updates the Document status to "completed" with the total chunk count.

**Fallback:** If Qdrant is unreachable, the system still stores chunks in MongoDB, allowing compliance analysis and RAG to work from MongoDB fallback data.

---

### Feature 2: Compliance Audit (Single & Multi-Document)

**What it does:**  
Users select a document (or multiple documents via Workspaces) and a compliance framework (e.g., SOC 2). The system evaluates each framework control against the document evidence, producing a risk score, control statuses (COMPLIANT/PARTIALLY/NON_COMPLIANT/NOT_APPLICABLE), gap analysis, and recommendations.

**How Single-Document Audit Works:**

1. **Trigger** — Frontend sends a POST to `/api/compliance/analyze` with `documentId` and `framework`.
2. **Backend Orchestration** — `complianceController.js` calls `compliance.service.js → analyzeCompliance(documentId, framework)`.
3. **Framework Controls** — `framework.service.js` loads predefined compliance controls from `config/complianceControls.js` (5 controls: DATA_PROTECTION, ACCESS_CONTROL, RISK_MANAGEMENT, INCIDENT_RESPONSE, AUDIT_LOGGING).
4. **Context Retrieval** — Backend fetches the first 20 document chunks from MongoDB (`DocumentChunk`) as fallback context.
5. **FastAPI Analysis** — Backend POSTs to `/ai/compliance/analyze` with documentId, framework name, controls, and fallback chunks.
6. **AI Evaluation** (in `compliance_service.py`):
   - Retrieves up to 20 chunks from Qdrant via `scroll_chunks()` (or uses fallback chunks if Qdrant fails)
   - Builds a context string from all chunks
   - Sends a detailed prompt to Gemini (`generate_content_with_retry()`) instructing it to:
     - Classify the document type (e.g., SECURITY_POLICY, RESUME, CONTRACT)
     - Determine applicability (APPLICABLE vs NOT_APPLICABLE)
     - Evaluate each control against the document evidence
     - For each control, produce: status, evidence summary, source chunk references, gap analysis (gap description, business risk, recommendation)
   - Parses the JSON response using `extract_json()`
7. **Post-processing** — Resolves source chunk references, adds confidence scores based on evidence count, calculates risk score (20 pts per NON_COMPLIANT, 10 per PARTIALLY_COMPLIANT, max 100).
8. **Result Storage** — Backend saves the assessment to MongoDB `Assessment` model and returns the result to the frontend.

**How Multi-Document Audit Works (Enterprise):**

1. **Workspace Context** — Users define Workspaces that group related documents (e.g., all policies for a specific client or department).
2. **Batch Processing** — `enterpriseCompliance.service.js → analyzeMultiDocumentCompliance()` processes controls in batches (configurable concurrency, default 5).
3. **For each control batch:**
   - **Step 1 (Vector Search):** Performs semantic search via FastAPI's `/ai/search` across all document vector embeddings using the control name + description as the query. Retrieves top 10 most relevant chunks across all documents.
   - **Fallback:** If Qdrant search fails, falls back to fetching chunks directly from MongoDB per document.
   - **Step 2 (Context Building):** Assembles a unified context string from the retrieved chunks, labeled by document name and chunk index.
   - **Step 3 (Control Evaluation):** POSTs to `/ai/compliance/evaluate-control` which sends a single control + context to Gemini for evaluation.
   - **Step 4 (Citation Building):** Maps source chunk indexes back to the retrieved chunks to build citation objects (documentName, pageNumber, chunkIndex, similarityScore, evidenceSnippet).
   - **Step 5 (Confidence Calculation):** Calculates a confidence score based on evidence count (0-1.0 scale) and control status.
4. **Progress Tracking** — After each batch, the job updates its progress in the Bull queue (e.g., "5/20 controls completed"), which the frontend polls to show a progress bar.
5. **Aggregation** — Counts compliant/partial/non-compliant/not-applicable controls, calculates overall risk score and compliance percentage.
6. **Persistence** — Results are saved as `Assessment` documents in MongoDB.

---

### Feature 3: RAG-Powered Document Q&A

**What it does:**  
Users ask natural-language questions about a document's contents (e.g., "What is the data retention policy?"). The system retrieves relevant chunks via vector search and generates a contextual answer using Gemini.

**How it works internally:**

1. **Query** — Frontend (`DocumentQA.jsx`) sends a POST to `/api/rag/chat` with `{ query, documentId }`.
2. **Backend** — `ragController.js` calls `rag.service.js → generateRagAnswer()`.
3. **Fallback Preparation** — Backend fetches all document chunks from MongoDB as a fallback context array.
4. **FastAPI Processing** — POSTs to `/ai/chat` with query, documentId, and fallback chunks.
5. **AI Answer Generation** (in `chat_service.py`):
   - Retrieves top 20 relevant chunks from Qdrant via semantic search (query → embedding → vector search)
   - If Qdrant fails, uses fallback chunks from MongoDB
   - Constructs a prompt with the chunks as context + the user's question
   - Sends to Gemini which generates a concise, evidence-based answer with citations to specific chunks and page numbers
   - Returns `{ answer, citations: [{ chunkIndex, pageNumber, text, score }] }`

---

### Feature 4: Semantic Search

**What it does:**  
Users search across all their documents using natural language queries (e.g., "find documents mentioning access control"). The system returns ranked, relevant text snippets with similarity scores.

**How it works internally:**

1. **Query** — Frontend (`SemanticSearch.jsx`) sends POST to `/api/enterprise/search` with query, optional filters (workspaceId, tags, department, date range).
2. **Filtering** — `enterpriseCompliance.service.js → semanticSearch()` builds a MongoDB query filter for documents (by workspace, department, tags, creation date).
3. **Document ID Resolution** — Queries MongoDB for matching documents, extracting their IDs.
4. **Vector Search** — Calls FastAPI's `/ai/search` which:
   - Generates a query embedding via Gemini
   - Performs vector similarity search in Qdrant filtered by documentIds
   - Returns ranked results with similarity scores
5. **Fallback** — If Qdrant is unavailable, performs text matching in MongoDB (`$regex` on chunk text).
6. **Enrichment** — Each result is enriched with document metadata (documentName, documentType, tags, department).
7. **Pagination** — Results are sliced by `offset` and `limit` parameters.

---

### Feature 5: Trend Analytics & Reports

**What it does:**  
Tracks compliance scores over time, visualizes risk distributions, and generates professional compliance reports.

**How Trend Analytics works:**

1. **Data Aggregation** — `trend.service.js` queries the `Assessment` collection, grouping assessments by date or time period using MongoDB aggregation pipelines (`$group`, `$avg`, `$bucket`).
2. **Metrics Calculated:**
   - Average risk score per day/week/month
   - Control status distributions (compliant vs non-compliant counts over time)
   - Control health by category (e.g., Data Protection trends vs Access Control trends)
3. **API Endpoint** — `trendController.js` exposes `/api/trends` with query parameters for timeframe (7d, 30d, 90d, 1y) and document/workspace filters.
4. **Visualization** — Frontend uses Recharts to render line charts (riskScore over time), bar charts (control distribution), and radial gauge charts (overall compliance percentage).

**How Report Generation works:**

1. **Trigger** — User clicks "Generate Report" on an assessment result.
2. **FastAPI** — Backend POSTs the full assessment JSON to `/ai/report/generate`.
3. **AI Report** — The microservice sends a prompt to Gemini that includes the entire assessment, asking it to generate a professional compliance report with:
   - Executive Summary
   - Overall Risk rating
   - Top Risks (list)
   - Recommendations (list)
4. **Structured JSON** — Returns parsed JSON in a standard format, stored as part of the `Assessment` document.
5. **Frontend** — `ReportDetails.jsx` renders the report in a formatted, readable layout.

---

### Feature 6: Change Impact Analysis

**What it does:**  
Compares two compliance assessments (e.g., old vs new version of a policy document) to identify what changed — new risks, resolved risks, status regressions, and evidence differences.

**How it works internally:**

1. **Input** — User provides two document IDs (old and new version).
2. **Dual Assessment** — `enterpriseCompliance.service.js → analyzeChangeImpact()` runs a full compliance audit on both documents independently.
3. **Diff Computation** (in `compliance_service.py → analyze_change_impact()`):
   - Maps controls by `controlId` from both assessments
   - Identifies **new risks**: controls in new assessment that are NON_COMPLIANT or PARTIALLY_COMPLIANT where the old was COMPLIANT
   - Identifies **resolved risks**: controls that improved from NON_COMPLIANT to COMPLIANT
   - Identifies **changed controls**: any status change, with old→new values
   - Compares **evidence citations**: which chunk references were added or removed
   - Calculates **risk delta**: newRiskScore - oldRiskScore
4. **Result** — Returns a delta report with summary counts and detailed diffs.

---

### Feature 7: Background Job Queue for Audits

**What it does:**  
Long-running compliance audits (especially multi-document) are queued as background jobs so the user doesn't have to wait synchronously. Progress is tracked and reported.

**How it works:**

1. **Job Creation** — When a multi-document audit is triggered, `jobQueue.service.js` creates a Bull job in Redis with type `compliance_audit`, containing documentIds, framework, workspaceId, and userId.
2. **Queue Processing** — `jobQueue.start()` initializes a worker that pulls jobs from the Redis queue and processes them.
3. **Job Handler** — Registered in `server.js` line 56-95: calls `analyzeMultiDocumentCompliance()` with a progress callback that updates the job's progress in Redis via `jobQueue.updateProgress()`.
4. **Progress Polling** — The frontend polls a status endpoint (`/api/jobs/:id`) to get the current progress percentage, displaying a progress bar to the user.
5. **Completion** — When the job finishes, the assessment is saved to MongoDB, and the frontend redirects to the assessment details page.

---

### Feature 8: Authentication & Multi-Tenant Workspaces

**What it does:**  
Supports user registration/login with JWT authentication and multi-tenant document organization via Workspaces.

**Authentication:**
1. **Registration** — POST `/api/auth/register` with email/password. Backend hashes the password via bcryptjs, creates a User document in MongoDB.
2. **Login** — POST `/api/auth/login` validates credentials, returns a JWT token.
3. **Protected Routes** — `authMiddleware.js` validates the JWT on every protected request, attaching `req.user` for downstream use.

**Workspaces (Multi-Tenancy):**
1. **Workspace CRUD** — Users create workspaces (e.g., "Client A", "Q4 Audit"). Each workspace has a name, description, and member list.
2. **Document Association** — Documents can be assigned to a workspace via `workspaceId` field.
3. **Multi-Audit** — Users select a workspace and trigger a compliance audit across all documents in that workspace, enabling organization-level compliance assessment.

---

### Feature 9: Document Classification & Tagging

**What it does:**  
Automatically classifies uploaded documents into types (POLICY, PROCEDURE, CONTRACT, RESUME, etc.) with confidence scores, and supports manual tagging.

**How it works:**

1. **Classification Trigger** — After document processing (text extraction), the backend calls FastAPI's `/ai/classify` with the extracted text (first 2000 chars) and filename.
2. **AI Classification** — Gemini analyzes the text and file metadata, classifying it into one of 8 types (e.g., `SECURITY_POLICY`, `VENDOR_DOCUMENT`, `RESUME`) with a confidence score and reasoning.
3. **Storage** — The `documentType` and `classificationConfidence` fields are updated on the Document record.
4. **NOT_APPLICABLE handling** — If a document is classified as a RESUME or unrelated document, compliance assessments automatically set `assessmentStatus: "NOT_APPLICABLE"` and skip control evaluation.

---

### Feature 10: Dashboard & Analytics

**What it does:**  
The frontend Dashboard provides an at-a-glance view of compliance posture: risk score gauge, control status breakdown, recent assessments, and document statistics.

**Data Sources:**
- **Risk Score** — Aggregated from the latest assessment's `riskScore` field.
- **Control Distribution** — Pie chart showing COMPLIANT vs PARTIALLY_COMPLIANT vs NON_COMPLIANT counts.
- **Recent Assessments** — Last 5-10 assessments sorted by `createdAt` desc.
- **Document Stats** — Total document count, documents by type.
- **Quick Actions** — Links to upload, analyze, view reports.

---

## 3. Architecture Flow Diagram (Conceptual)

```
┌─────────────────────────────────────────────────────────────────┐
│                       Frontend (React + Vite)                   │
│  Port 5173 (Dev) / Port 80 (Prod via Nginx)                    │
│  Pages: Dashboard, Documents, Analyze, QA, Search, Reports...   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP (Axios)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Backend (Node.js + Express)                     │
│  Port 5000                                                     │
│  Routes → Controllers → Services → Models                       │
│  Auth Middleware │ File Upload (Multer) │ Bull Queue (Redis)    │
└─────────┬────────────────────┬───────────────────┬──────────────┘
          │                    │                   │
          ▼                    ▼                   ▼
┌─────────────────┐  ┌────────────────┐  ┌──────────────────┐
│   MongoDB        │  │   Qdrant       │  │   FastAPI AI     │
│  (Primary DB)    │  │ (Vector Store) │  │   Microservice   │
│  Users           │  │ Embeddings     │  │   Port 8000      │
│  Documents       │  │ Semantic       │  │   PDF Processing │
│  Chunks          │  │ Search         │  │   Gemini AI      │
│  Assessments     │  │                │  │   Embeddings     │
│  Workspaces      │  │                │  │   Compliance     │
│  Audit Jobs      │  │                │  │   RAG / Chat     │
└─────────────────┘  └────────────────┘  └──────────────────┘
```

---

## 4. Key Design Decisions & Trade-offs

| Decision | Rationale |
|---|---|
| **Python FastAPI for AI, Node.js for backend** | Leverages Python's rich AI/ML ecosystem (Gemini SDK, PyMuPDF, Qdrant) while keeping the API server in JavaScript for consistent full-stack development. |
| **MongoDB as primary + Qdrant for vectors** | MongoDB provides reliable document storage with flexible schemas; Qdrant provides high-performance vector similarity search. The system gracefully degrades if Qdrant is unavailable by using MongoDB fallback. |
| **Fallback chunks in MongoDB** | Every chunk stored in both Qdrant (vector) and MongoDB (text). Ensures compliance analysis and RAG work even when the vector database is down. |
| **Bull/Redis for background jobs** | Long audits (multi-document with 5+ controls) can take minutes. Queuing them prevents HTTP timeouts and allows progress tracking. |
| **Gemini as sole LLM provider** | Single provider simplifies architecture; retry logic with exponential backoff handles transient API failures. |
| **Batch processing with concurrency control** | Multi-document audits process controls in parallel batches (default 5) to balance speed vs API rate limits. |

---

## 5. Summary Statistics

- **Frontend Pages:** 15+ (Login, Register, Dashboard, Documents, Analyze, QA, History, AssessmentDetails, Reports, ReportDetails, Trends, Workspaces, WorkspaceDetail, MultiAudit, SemanticSearch)
- **Backend Routes/Endpoints:** 30+ RESTful endpoints across auth, documents, compliance, RAG, search, reports, trends, workspaces, enterprise
- **AI Microservice Endpoints:** 10 (process, embed, delete, analyze, evaluate-control, recommendations, change-impact, search, chat, report/generate, classify)
- **MongoDB Models:** 7 (User, Document, DocumentChunk, Assessment, Workspace, AuditJob, DocumentVersion, ComplianceFramework)
- **Compliance Controls:** 5 standard controls (expandable via config)
- **Docker Services:** 3 (backend, frontend, mongodb) + external dependencies (Redis, Qdrant)

---

*Document prepared for interview purposes — covers architecture, tech stack, features, and internal workings of the Compliance Intelligence Platform v2.0.0.*