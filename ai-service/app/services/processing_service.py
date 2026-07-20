def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> list[str]:
    """
    Splits text into chunks of specified size with overlap.
    """
    chunks = []
    start = 0
    text_length = len(text)
    
    if text_length == 0:
        return []
        
    while start < text_length:
        end = start + chunk_size
        chunks.append(text[start:end])
        start += (chunk_size - overlap)
        
    return chunks

def clean_text(text: str) -> str:
    """
    Cleans and normalizes extracted text.
    """
    if not text:
        return ""
    # Strip whitespace
    return text.strip()
