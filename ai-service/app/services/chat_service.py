from app.services.gemini_service import generate_content_with_retry, generate_embedding_with_retry
from app.services.qdrant_service import search_relevant_chunks
from app.services.compliance_service import build_context

def generate_rag_answer(query: str, document_id: str, fallback_chunks: list[dict] = None) -> dict:
    """
    Executes RAG semantic search and prompt generation for interactive document chat.
    """
    retrieved_chunks = []
    
    try:
        # Generate embedding for search query
        query_vector = generate_embedding_with_retry(query)
        # Search relevant vectors in Qdrant
        retrieved_chunks = search_relevant_chunks(query_vector, document_id, limit=5)
    except Exception as e:
        print(f"Qdrant RAG search failed: {e}. Checking fallback chunks.")
        
    # If search failed or returned empty, try using fallback chunks
    if not retrieved_chunks and fallback_chunks:
        # Fallback: simple keyword matching or first N chunks if no overlap
        keywords = [word.lower() for word in query.split() if len(word) > 3]
        matched_chunks = []
        for chunk in fallback_chunks:
            chunk_text = chunk.get("text", "").lower()
            score = sum(1 for kw in keywords if kw in chunk_text)
            if score > 0:
                matched_chunks.append((score, chunk))
        
        # Sort by keyword match score
        matched_chunks.sort(key=lambda x: x[0], reverse=True)
        retrieved_chunks = [
            {
                "documentId": document_id,
                "chunkIndex": item[1].get("chunkIndex"),
                "pageNumber": item[1].get("pageNumber", 1),
                "text": item[1].get("text"),
                "score": 0.5  # placeholder score for fallback match
            }
            for item in matched_chunks[:5]
        ]
        
        # If still empty, just take the first few chunks
        if not retrieved_chunks:
            retrieved_chunks = [
                {
                    "documentId": document_id,
                    "chunkIndex": c.get("chunkIndex"),
                    "pageNumber": c.get("pageNumber", 1),
                    "text": c.get("text"),
                    "score": 0.3
                }
                for c in fallback_chunks[:5]
            ]

    if not retrieved_chunks:
        return {
            "answer": "I could not find relevant information in the document.",
            "sources": []
        }

    # Build context and Gemini prompt
    context = build_context(retrieved_chunks)
    prompt = f"""
You are a professional compliance document intelligence assistant.

Analyze the provided document context to answer the user's question. 

Guidelines:
1. Rely on the provided context. You may make reasonable inferences based on the text (for example, if the document contains placeholders like "(Company)", bracketed text, or draft check-boxes, you can infer and explain that it is a template).
2. Keep your answer professional, clear, and direct.
3. If the context does not contain any relevant information to address the question, respond with: "I could not find that information in the document."

Context:
{context}

Question:
{query}
"""
    response_text = generate_content_with_retry(prompt)
    
    sources = []
    for chunk in retrieved_chunks:
        sources.append({
            "documentId": chunk.get("documentId"),
            "chunkIndex": chunk.get("chunkIndex"),
            "pageNumber": chunk.get("pageNumber", 1),
            "score": round(chunk.get("score") or 0.0, 3),
            "text": chunk.get("text"),
            "snippet": chunk.get("text")[:500] if chunk.get("text") else ""
        })
        
    return {
        "answer": response_text,
        "sources": sources
    }
