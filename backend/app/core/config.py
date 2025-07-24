from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    # API Settings
    PROJECT_NAME: str = "SciFig AI API"
    VERSION: str = "1.0.0"
    
    # CORS
    ALLOWED_HOSTS: List[str] = ["http://localhost:5173", "http://localhost:3000", "https://scifig.ai"]
    
    # Database
    SUPABASE_URL: str = "https://test.supabase.co"
    SUPABASE_ANON_KEY: str = "test-anon-key"
    SUPABASE_SERVICE_KEY: str = "test-service-key"
    
    # Alternative Database (if not using Supabase)
    DATABASE_URL: Optional[str] = None
    
    # File Storage
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 100 * 1024 * 1024  # 100MB
    ALLOWED_EXTENSIONS: List[str] = [".csv", ".xlsx", ".xls"]
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # Security
    SECRET_KEY: str = "test-secret-key-for-development-only"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # External APIs
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    
    # Analytics
    ENABLE_ANALYTICS: bool = True
    
    class Config:
        env_file = ".env"

settings = Settings() 