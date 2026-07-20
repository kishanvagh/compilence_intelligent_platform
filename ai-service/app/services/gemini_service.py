import time
import re
import ssl
import urllib3
import google.generativeai as genai
from app.core.config import settings

# If BYPASS_TLS is enabled, configure ssl and urllib3 to ignore certificate validation
if settings.BYPASS_TLS:
    print("BYPASS_TLS is enabled. Disabling TLS certificate validation for Gemini API.")
    ssl._create_default_https_context = ssl._create_unverified_context
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

if settings.GEMINI_API_KEY:
    transport = "rest" if settings.BYPASS_TLS else None
    genai.configure(api_key=settings.GEMINI_API_KEY, transport=transport)
else:
    print("Warning: GEMINI_API_KEY is not set.")

def generate_content_with_retry(prompt: str, model_name: str = "gemini-2.0-flash", **kwargs) -> str:
    """
    Generates text content using Gemini with automatic 429 quota retries and model fallback chain:
    gemini-2.0-flash → gemini-2.5-flash → gemini-2.0-flash-lite
    """
    attempts = 5
    current_model = model_name
    fallback_chain = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-2.0-flash-lite"]
    
    for attempt in range(attempts):
        try:
            model = genai.GenerativeModel(current_model)
            response = model.generate_content(prompt, **kwargs)
            return response.text
        except Exception as e:
            err_msg = str(e)
            is_rate_limit = (
                "429" in err_msg 
                or "RESOURCE_EXHAUSTED" in err_msg 
                or "quota" in err_msg.lower() 
                or "rate limit" in err_msg.lower()
            )
            
            if is_rate_limit and attempt < attempts - 1:
                print(f"Gemini API rate limit/quota exceeded (attempt {attempt + 1}/{attempts}) for model {current_model}.")
                
                # Move to next model in the fallback chain
                try:
                    current_idx = fallback_chain.index(current_model)
                    if current_idx + 1 < len(fallback_chain):
                        next_model = fallback_chain[current_idx + 1]
                        print(f"Falling back model from {current_model} to {next_model} due to quota constraints.")
                        current_model = next_model
                except ValueError:
                    pass  # current_model not in fallback chain, keep it
                
                # Extract wait time or use exponential backoff with longer delays
                delay = (2.0 ** attempt) * 5
                retry_match = re.search(r"retry in ([\d\.]+)s", err_msg, re.IGNORECASE)
                if retry_match:
                    delay = float(retry_match.group(1)) + 2.0  # seconds + buffer
                
                print(f"Waiting {delay}s before retrying model call...")
                time.sleep(delay)
            else:
                # Throw non-rate-limit errors or final attempt failure
                raise e
                
    raise Exception("Max retry attempts reached for Gemini content generation.")

def generate_embedding_with_retry(text: str, model_name: str = "models/gemini-embedding-001") -> list[float]:
    """
    Generates 768-dimensional text embedding with automatic 429 rate limit retries.
    """
    attempts = 3
    for attempt in range(attempts):
        try:
            # We explicitly target the 768-dimension models/gemini-embedding-001
            result = genai.embed_content(
                model=model_name,
                content=text,
                task_type="retrieval_document",
                output_dimensionality=768
            )
            return result["embedding"]
        except Exception as e:
            err_msg = str(e)
            is_rate_limit = (
                "429" in err_msg 
                or "RESOURCE_EXHAUSTED" in err_msg 
                or "quota" in err_msg.lower() 
                or "rate limit" in err_msg.lower()
            )
            
            if is_rate_limit and attempt < attempts - 1:
                delay = (2.0 ** attempt) * 2
                retry_match = re.search(r"retry in ([\d\.]+)s", err_msg, re.IGNORECASE)
                if retry_match:
                    delay = float(retry_match.group(1)) + 1.0
                print(f"Embedding rate limit/quota exceeded. Waiting {delay}s...")
                time.sleep(delay)
            else:
                raise e

    raise Exception("Max retry attempts reached for Gemini embedding generation.")
