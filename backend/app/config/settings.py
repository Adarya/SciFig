"""Application configuration settings"""

import os
from typing import Optional, List
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    app_name: str = "SciFig AI Statistical Engine"
    app_version: str = "2.0.0"
    debug: bool = Field(default=False, description="Debug mode")
    
    # Server
    host: str = Field(default="0.0.0.0", description="Host to bind to")
    port: int = Field(default=8000, description="Port to bind to")
    reload: bool = Field(default=False, description="Auto-reload on code changes")
    
    # CORS
    allowed_origins: str = Field(
        default="http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:3000",
        description="Allowed CORS origins (comma-separated)"
    )
    
    # Supabase Configuration
    supabase_url: str = Field(..., description="Supabase project URL")
    supabase_anon_key: str = Field(..., description="Supabase anonymous key")
    supabase_service_role_key: str = Field(..., description="Supabase service role key")
    
    # Authentication
    secret_key: str = Field(..., description="Secret key for JWT tokens")
    algorithm: str = Field(default="HS256", description="JWT algorithm")
    access_token_expire_minutes: int = Field(default=30, description="Access token expiration")
    refresh_token_expire_days: int = Field(default=7, description="Refresh token expiration")
    
    # File Upload
    max_file_size: int = Field(default=50 * 1024 * 1024, description="Max file size in bytes (50MB)")
    upload_dir: str = Field(default="uploads", description="Upload directory")
    
    # Statistical Analysis
    max_dataset_size: int = Field(default=100000, description="Maximum dataset size for analysis")
    cache_results: bool = Field(default=True, description="Cache analysis results")
    
    @field_validator('allowed_origins')
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse comma-separated CORS origins"""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',')]
        return v
    
    @property
    def cors_origins(self) -> List[str]:
        """Get CORS origins as a list"""
        if isinstance(self.allowed_origins, str):
            return [origin.strip() for origin in self.allowed_origins.split(',')]
        return self.allowed_origins
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Global settings instance
settings = Settings() 