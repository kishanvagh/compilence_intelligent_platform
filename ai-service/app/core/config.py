import os
from dotenv import load_dotenv

# Load environment variables from backend/.env if it exists
backend_env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../backend/.env"))
if os.path.exists(backend_env_path):
    load_dotenv(backend_env_path)
else:
    load_dotenv()

class Settings:
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    QDRANT_URL: str = os.getenv("QDRANT_URL", "")
    QDRANT_API_KEY: str = os.getenv("QDRANT_API_KEY", "")
    BYPASS_TLS: bool = os.getenv("BYPASS_TLS", "false").lower() == "true"

    def validate(self):
        if not self.GEMINI_API_KEY:
            print("Warning: GEMINI_API_KEY is not configured.")
        if not self.QDRANT_URL or not self.QDRANT_API_KEY:
            print("Warning: QDRANT_URL or QDRANT_API_KEY is not configured.")

settings = Settings()
settings.validate()

# Apply global SSL/TLS certificate verification bypass if BYPASS_TLS is enabled
if settings.BYPASS_TLS:
    import ssl
    def patched_init(self, *args, **kwargs):
        self.check_hostname = False
        self.verify_mode = ssl.CERT_NONE
    ssl.SSLContext.__init__ = patched_init
    print("Global SSLContext monkey-patch applied: TLS verification disabled.")

