from urllib.parse import urlparse
import uuid
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
from app.core.config import settings

COLLECTION_NAME = "document_chunks"

def get_qdrant_client() -> QdrantClient:
    """
    Initializes and returns a lazy Qdrant client.
    """
    url = settings.QDRANT_URL
    api_key = settings.QDRANT_API_KEY
    
    if not url or not api_key:
        print("Warning: Qdrant URL or API Key is not set.")
        return None
        
    try:
        parsed = urlparse(url)
        host = parsed.hostname
        port = parsed.port or (443 if parsed.scheme == "https" else 6333)
        https = parsed.scheme == "https"
        
        verify = not settings.BYPASS_TLS
        prefer_grpc = False if settings.BYPASS_TLS else True
        
        return QdrantClient(
            host=host,
            port=port,
            api_key=api_key,
            https=https,
            timeout=30.0,
            verify=verify,
            prefer_grpc=prefer_grpc,
            check_version=False
        )
    except Exception as e:
        print(f"Error initializing Qdrant client: {e}")
        return None

def collection_exists() -> bool:
    """
    Checks if the standard collection exists.
    """
    client = get_qdrant_client()
    if not client:
        return False
    try:
        collections = client.get_collections().collections
        return any(c.name == COLLECTION_NAME for c in collections)
    except Exception as e:
        print(f"Error checking collection existence: {e}")
        return False

def ensure_collection() -> bool:
    """
    Ensures that the Qdrant collection exists and has the correct vector size (768).
    """
    client = get_qdrant_client()
    if not client:
        return False
        
    try:
        exists = collection_exists()
        if not exists:
            print(f"Collection '{COLLECTION_NAME}' not found. Creating it now...")
            client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(size=768, distance=Distance.COSINE)
            )
            # Create payload index for documentId to allow fast filtering
            client.create_payload_index(
                collection_name=COLLECTION_NAME,
                field_name="documentId",
                field_schema="keyword"
            )
            print("Qdrant collection and payload index created successfully.")
            return True
        return False
    except Exception as e:
        print(f"Failed to ensure Qdrant collection: {e}")
        return False

def upsert_chunk(document_id: str, chunk_index: int, page_number: int, text: str, embedding: list[float]) -> str:
    """
    Upserts a single chunk vector to Qdrant.
    """
    client = get_qdrant_client()
    if not client:
        raise Exception("Qdrant client not initialized.")
        
    ensure_collection()
    point_id = str(uuid.uuid4())
    
    client.upsert(
        collection_name=COLLECTION_NAME,
        points=[
            PointStruct(
                id=point_id,
                vector=embedding,
                payload={
                    "documentId": str(document_id),
                    "chunkIndex": int(chunk_index),
                    "pageNumber": int(page_number),
                    "text": text
                }
            )
        ]
    )
    return point_id

def delete_document_vectors(document_id: str) -> bool:
    """
    Deletes all vector points associated with the specified documentId.
    """
    client = get_qdrant_client()
    if not client:
        return False
        
    try:
        client.delete(
            collection_name=COLLECTION_NAME,
            points_selector=Filter(
                must=[
                    FieldCondition(
                        key="documentId",
                        match=MatchValue(value=str(document_id))
                    )
                ]
            )
        )
        return True
    except Exception as e:
        print(f"Error deleting vectors from Qdrant: {e}")
        return False

def scroll_chunks(document_id: str, limit: int = 20) -> list[dict]:
    """
    Retrieves document chunks using Qdrant scroll.
    """
    client = get_qdrant_client()
    if not client:
        return []
        
    try:
        ensure_collection()
        response = client.scroll(
            collection_name=COLLECTION_NAME,
            scroll_filter=Filter(
                must=[
                    FieldCondition(
                        key="documentId",
                        match=MatchValue(value=str(document_id))
                    )
                ]
            ),
            limit=limit,
            with_vectors=False
        )
        points = response[0]
        return [
            {
                "documentId": p.payload.get("documentId"),
                "chunkIndex": p.payload.get("chunkIndex"),
                "pageNumber": p.payload.get("pageNumber", 1),
                "text": p.payload.get("text"),
                "score": None
            }
            for p in points
        ]
    except Exception as e:
        print(f"Error scrolling chunks from Qdrant: {e}")
        return []

def search_relevant_chunks(query_vector: list[float], document_id: str, limit: int = 20) -> list[dict]:
    """
    Performs similarity search in Qdrant filtered by documentId.
    """
    client = get_qdrant_client()
    if not client:
        return []
        
    try:
        ensure_collection()
        query_filter = Filter(
            must=[
                FieldCondition(
                    key="documentId",
                    match=MatchValue(value=str(document_id))
                )
            ]
        )
        
        hits = client.search(
            collection_name=COLLECTION_NAME,
            query_vector=query_vector,
            query_filter=query_filter,
            limit=limit
        )
        
        return [
            {
                "documentId": hit.payload.get("documentId"),
                "chunkIndex": hit.payload.get("chunkIndex"),
                "pageNumber": hit.payload.get("pageNumber", 1),
                "text": hit.payload.get("text"),
                "score": hit.score,
                "snippet": hit.payload.get("text", "")[:500]
            }
            for hit in hits
        ]
    except Exception as e:
        print(f"Error searching Qdrant: {e}")
        return []
