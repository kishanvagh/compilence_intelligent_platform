import os
import sys
import tempfile
from dotenv import load_dotenv

# Resolve and load environment variables from backend/.env at startup
load_dotenv()

sys.stderr.write(f"BYPASS_TLS value: {os.getenv('BYPASS_TLS')}\n")

# --- Apply Global SSL/TLS Bypass Monkey-Patch immediately before any other module loads ---
if os.getenv("BYPASS_TLS", "false").lower() == "true":
    import ssl
    sys.stderr.write("Applying global SSL/TLS bypass monkey-patch...\n")
    
    # 1. Define standard unverified SSLContext factory for ssl module
    def patched_create_default_context(*args, **kwargs):
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        return context
        
    ssl.create_default_context = patched_create_default_context
    ssl._create_default_https_context = patched_create_default_context
    
    # 2. Patch requests Session.send to force verify=False
    try:
        import requests
        orig_send = requests.Session.send
        def patched_send(self, request, **kwargs):
            kwargs['verify'] = False
            return orig_send(self, request, **kwargs)
        requests.Session.send = patched_send
        sys.stderr.write("requests Session.send successfully patched to verify=False.\n")
    except Exception as e:
        sys.stderr.write(f"Failed to patch requests Session.send: {e}\n")
        
    # 3. Patch urllib3 by wrapping its create_urllib3_context functions
    try:
        import urllib3.util.ssl_
        orig_urllib3_create = urllib3.util.ssl_.create_urllib3_context
        
        def patched_urllib3_create(*args, **kwargs):
            kwargs['cert_reqs'] = ssl.CERT_NONE
            args_list = list(args)
            if len(args_list) >= 2:
                args_list[1] = ssl.CERT_NONE
            context = orig_urllib3_create(*args_list, **kwargs)
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE
            return context
            
        urllib3.util.ssl_.create_urllib3_context = patched_urllib3_create
        urllib3.util.create_urllib3_context = patched_urllib3_create
        sys.stderr.write("urllib3 SSL context successfully patched.\n")
    except Exception as e:
        sys.stderr.write(f"Failed to patch urllib3: {e}\n")
        
    try:
        import requests.packages.urllib3.util.ssl_
        orig_requests_create = requests.packages.urllib3.util.ssl_.create_urllib3_context
        
        def patched_requests_create(*args, **kwargs):
            kwargs['cert_reqs'] = ssl.CERT_NONE
            args_list = list(args)
            if len(args_list) >= 2:
                args_list[1] = ssl.CERT_NONE
            context = orig_requests_create(*args_list, **kwargs)
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE
            return context
            
        requests.packages.urllib3.util.ssl_.create_urllib3_context = patched_requests_create
        sys.stderr.write("requests urllib3 SSL context successfully patched.\n")
    except Exception as e:
        pass
        
    sys.stderr.write("Global SSLContext and create_default_context monkey-patches applied at startup.\n")

from typing import List, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from app.services.pdf_service import extract_text_from_pdf, extract_pages_from_pdf
from app.services.processing_service import chunk_text, clean_text
from app.services.gemini_service import generate_content_with_retry, generate_embedding_with_retry
from app.services.qdrant_service import (
    upsert_chunk,
    delete_document_vectors,
    get_qdrant_client,
    COLLECTION_NAME
)
from app.services.compliance_service import (
    analyze_document_compliance,
    evaluate_single_control,
    generate_recommendations,
    analyze_change_impact,
    extract_json
)
from app.services.chat_service import generate_rag_answer

app = FastAPI(title="Compliance Intelligence AI Microservice")

# --- Pydantic Models for Inputs ---

class ProcessRequest(BaseModel):
    filePath: str

class EmbedChunkItem(BaseModel):
    chunkIndex: int
    pageNumber: int
    text: str

class EmbedRequest(BaseModel):
    documentId: str
    chunks: List[EmbedChunkItem]

class DeleteRequest(BaseModel):
    documentId: str

class AnalyzeRequest(BaseModel):
    documentId: str
    framework: str
    frameworkControls: List[dict]
    fallbackChunks: Optional[List[dict]] = None

class SingleControlRequest(BaseModel):
    control: dict
    context: str
    framework: str
    documentName: str

class RecommendationsRequest(BaseModel):
    framework: str
    failedControls: List[dict]

class ChangeImpactRequest(BaseModel):
    oldAssessment: dict
    newAssessment: dict

class SearchRequest(BaseModel):
    query: str
    documentIds: List[str]
    limit: Optional[int] = 20

class ChatRequest(BaseModel):
    query: str
    documentId: str
    fallbackChunks: Optional[List[dict]] = None

class ReportRequest(BaseModel):
    assessment: dict

class ClassifyRequest(BaseModel):
    extractedText: str
    fileName: Optional[str] = ""

# --- Routes ---

@app.get("/")
def home():
    return {
        "status": "online",
        "message": "Compliance Intelligence AI Microservice is running."
    }

class ProcessPDFBase64Request(BaseModel):
    fileName: str
    fileBase64: str

@app.post("/ai/document/process")
def process_pdf_base64(data: ProcessPDFBase64Request):
    """
    Parses a PDF from base64-encoded content, cleans text, and splits into chunks.
    Accepts JSON with fileName and fileBase64 fields from the Node.js backend.
    """
    try:
        # Decode base64 content to temporary file
        import base64
        file_bytes = base64.b64decode(data.fileBase64)
        suffix = ".pdf"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name
        
        raw_text = extract_text_from_pdf(tmp_path)
        cleaned = clean_text(raw_text)
        pages = extract_pages_from_pdf(tmp_path)
        
        # Clean up temp file
        os.unlink(tmp_path)
        
        # Split pages into chunks
        chunks = []
        chunk_index = 0
        
        if pages:
            for page in pages:
                page_chunks = chunk_text(page["text"])
                for p_chunk in page_chunks:
                    chunks.append({
                        "chunkIndex": chunk_index,
                        "pageNumber": page["pageNumber"],
                        "text": p_chunk
                    })
                    chunk_index += 1
        else:
            doc_chunks = chunk_text(cleaned)
            for chunk in doc_chunks:
                chunks.append({
                    "chunkIndex": chunk_index,
                    "pageNumber": 1,
                    "text": chunk
                })
                chunk_index += 1
                
        return {
            "status": "success",
            "extractedText": cleaned,
            "chunks": chunks
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/document/embed")
def embed_document(data: EmbedRequest):
    """
    Generates embeddings for chunks and upserts them to Qdrant.
    """
    mappings = []
    try:
        for chunk in data.chunks:
            # Generate embedding via Gemini
            embedding = generate_embedding_with_retry(chunk.text)
            
            # Upsert into Qdrant
            point_id = upsert_chunk(
                document_id=data.documentId,
                chunk_index=chunk.chunkIndex,
                page_number=chunk.pageNumber,
                text=chunk.text,
                embedding=embedding
            )
            
            mappings.append({
                "chunkIndex": chunk.chunkIndex,
                "qdrantPointId": point_id
            })
            
        return {
            "status": "success",
            "mappings": mappings
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/document/delete")
def delete_document(data: DeleteRequest):
    """
    Deletes all vector mappings for a document.
    """
    try:
        success = delete_document_vectors(data.documentId)
        return {
            "status": "success" if success else "failed"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/compliance/analyze")
def analyze_compliance(data: AnalyzeRequest):
    """
    Executes compliance audit for a document against framework controls.
    """
    try:
        result = analyze_document_compliance(
            document_id=data.documentId,
            framework=data.framework,
            framework_controls=data.frameworkControls,
            fallback_chunks=data.fallbackChunks
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/compliance/evaluate-control")
def evaluate_control_endpoint(data: SingleControlRequest):
    """
    Evaluates a single control for multi-document concurrency pipeline.
    """
    try:
        result = evaluate_single_control(
            control=data.control,
            context=data.context,
            framework=data.framework,
            document_name=data.documentName
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/compliance/recommendations")
def recommendations_endpoint(data: RecommendationsRequest):
    """
    Generates remediation recommendations.
    """
    try:
        result = generate_recommendations(
            framework=data.framework,
            failed_controls=data.failedControls
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/compliance/change-impact")
def change_impact_endpoint(data: ChangeImpactRequest):
    """
    Computes diff between old and new compliance assessments.
    """
    try:
        result = analyze_change_impact(
            old_assessment=data.oldAssessment,
            new_assessment=data.newAssessment
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/search")
def search_endpoint(data: SearchRequest):
    """
    Performs query embedding and similarity search across selected documents.
    """
    client = get_qdrant_client()
    if not client:
        return {"results": [], "total": 0}
        
    try:
        from qdrant_client.models import Filter, FieldCondition, MatchAny
        
        # Generate query vector
        query_vector = generate_embedding_with_retry(data.query)
        
        # Build filter for matching documentIds
        query_filter = Filter(
            must=[
                FieldCondition(
                    key="documentId",
                    match=MatchAny(any=[str(did) for did in data.documentIds])
                )
            ]
        )
        
        hits = client.search(
            collection_name=COLLECTION_NAME,
            query_vector=query_vector,
            query_filter=query_filter,
            limit=data.limit
        )
        
        results = [
            {
                "documentId": hit.payload.get("documentId"),
                "chunkIndex": hit.payload.get("chunkIndex"),
                "pageNumber": hit.payload.get("pageNumber", 1),
                "text": hit.payload.get("text"),
                "score": hit.score
            }
            for hit in hits
        ]
        
        return {
            "results": results,
            "total": len(results)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/chat")
def chat_endpoint(data: ChatRequest):
    """
    Handles conversational RAG questions.
    """
    try:
        result = generate_rag_answer(
            query=data.query,
            document_id=data.documentId,
            fallback_chunks=data.fallbackChunks
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/report/generate")
def report_endpoint(data: ReportRequest):
    """
    Generates a structured compliance report.
    """
    import json
    try:
        assessment_json = json.dumps(data.assessment, indent=2)
        prompt = f"""
You are a senior compliance consultant.

Given the compliance assessment below,
generate a professional report.

Return ONLY valid JSON.

Format:

{{
  "executiveSummary": "",
  "overallRisk": "",
  "topRisks": [],
  "recommendations": []
}}

Assessment:

{assessment_json}
"""
        response_text = generate_content_with_retry(prompt)
        return extract_json(response_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/classify")
def classify_endpoint(data: ClassifyRequest):
    """
    Classifies raw text.
    """
    from app.services.compliance_service import classify_document
    try:
        result = classify_document(
            extracted_text=data.extractedText,
            file_name=data.fileName
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))