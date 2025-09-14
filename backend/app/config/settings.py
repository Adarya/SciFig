"""Application configuration settings"""

import os
import sys
from typing import Optional, List
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator, ValidationError


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
        default="http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:3000,https://*.up.railway.app,https://*.railway.app",
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
    
    @field_validator('supabase_url')
    @classmethod
    def validate_supabase_url(cls, v):
        """Validate Supabase URL format"""
        if not v.startswith('https://'):
            raise ValueError('Supabase URL must start with https://')
        if '.supabase.co' not in v and 'localhost' not in v:
            raise ValueError('Invalid Supabase URL format')
        return v
    
    @field_validator('supabase_anon_key', 'supabase_service_role_key')
    @classmethod 
    def validate_supabase_keys(cls, v):
        """Validate Supabase keys are not placeholder values"""
        if not v or v in ['your-anon-key-here', 'your-service-role-key-here']:
            raise ValueError('Supabase keys must be properly configured')
        if len(v) < 20:  # Supabase keys are typically much longer
            raise ValueError('Invalid Supabase key format')
        return v
    
    @field_validator('secret_key')
    @classmethod
    def validate_secret_key(cls, v):
        """Validate JWT secret key"""
        if not v or v == 'your-super-secret-jwt-key-here-make-it-long-and-random':
            raise ValueError('JWT secret key must be properly configured')
        if len(v) < 32:
            raise ValueError('JWT secret key must be at least 32 characters long')
        return v
    
    def validate_environment(self) -> None:
        """Validate all required environment variables are properly set"""
        validation_errors = []
        
        # Check for placeholder values
        placeholder_checks = [
            ('SUPABASE_URL', self.supabase_url, 'https://your-project-id.supabase.co'),
            ('SUPABASE_ANON_KEY', self.supabase_anon_key, 'your-anon-key-here'),
            ('SUPABASE_SERVICE_ROLE_KEY', self.supabase_service_role_key, 'your-service-role-key-here'),
            ('SECRET_KEY', self.secret_key, 'your-super-secret-jwt-key-here-make-it-long-and-random'),
        ]
        
        for env_name, value, placeholder in placeholder_checks:
            if value == placeholder:
                validation_errors.append(f"{env_name} is still set to placeholder value")
        
        # Check required directories exist or can be created
        try:
            if not os.path.exists(self.upload_dir):
                os.makedirs(self.upload_dir, exist_ok=True)
        except Exception as e:
            validation_errors.append(f"Cannot create upload directory '{self.upload_dir}': {e}")
        
        # Validate numeric values
        if self.port < 1 or self.port > 65535:
            validation_errors.append("Port must be between 1 and 65535")
        
        if self.max_file_size < 1024:  # At least 1KB
            validation_errors.append("Max file size must be at least 1KB")
        
        if self.access_token_expire_minutes < 1:
            validation_errors.append("Access token expiration must be at least 1 minute")
        
        if validation_errors:
            error_msg = "Environment validation failed:\n" + "\n".join(f"  - {error}" for error in validation_errors)
            print(f"❌ {error_msg}")
            print("\n💡 Please check your .env file and ensure all required variables are properly set.")
            print("   Copy from env.example and update with your actual values.")
            raise ValueError(error_msg)
        
        print("✅ Environment validation passed")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


def create_settings() -> Settings:
    """Create and validate settings instance"""
    try:
        settings = Settings()
        settings.validate_environment()
        return settings
    except ValidationError as e:
        print(f"❌ Configuration validation failed:")
        for error in e.errors():
            field = ".".join(str(x) for x in error['loc'])
            print(f"  - {field}: {error['msg']}")
        print("\n💡 Please check your .env file and ensure all required variables are properly set.")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Failed to load configuration: {e}")
        sys.exit(1)


# Global settings instance
settings = create_settings() 