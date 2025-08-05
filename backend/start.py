#!/usr/bin/env python3
"""
SciFig AI Statistical Engine - Startup Script
Modular FastAPI application with Supabase integration
"""

import uvicorn
from app.config.settings import settings

if __name__ == "__main__":
    print(f"🚀 Starting {settings.app_name} v{settings.app_version}")
    print(f"📊 Server will run on http://{settings.host}:{settings.port}")
    print(f"📚 API Documentation: http://{settings.host}:{settings.port}/docs")
    print("=" * 60)
    
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload,
        reload_dirs=["app"] if settings.reload else None
    ) 