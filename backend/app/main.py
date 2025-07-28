from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from contextlib import asynccontextmanager

from app.api.v1 import analysis, files, auth, projects
from app.core.config import settings
from app.core.database import init_db, check_db_connection, db_health_check
from app.services.database_service import create_sample_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan events - startup and shutdown
    """
    # Startup
    print("🚀 Starting SciFig AI API...")
    
    # Initialize database
    try:
        init_db()
        db_connected = await check_db_connection()
        if db_connected:
            print("✅ Database connection established")
            
            # Create sample data if needed (only in development)
            if settings.PROJECT_NAME == "SciFig AI API":  # Development mode
                try:
                    create_sample_data()
                    print("✅ Sample data created/verified")
                except Exception as e:
                    print(f"⚠️  Sample data creation skipped: {e}")
        else:
            print("❌ Database connection failed")
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
    
    # Create directories
    for directory in ["static", "uploads", "static/figures"]:
        if not os.path.exists(directory):
            os.makedirs(directory)
            print(f"📁 Created directory: {directory}")
    
    print("🎉 SciFig AI API startup complete!")
    
    yield
    
    # Shutdown
    print("🛑 Shutting down SciFig AI API...")


app = FastAPI(
    title="SciFig AI API",
    description="Statistical Analysis API for Scientific Figures",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_HOSTS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])  # Include auth first with prefix
app.include_router(analysis.router, prefix="/api/v1", tags=["analysis"])
app.include_router(files.router, prefix="/api/v1", tags=["files"])
app.include_router(projects.router, prefix="/api/v1/projects", tags=["projects"])

# Static files for serving generated figures
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def root():
    return {
        "message": "SciFig AI API",
        "version": "1.0.0",
        "description": "Statistical Analysis API for Scientific Figures",
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "api": "/api/v1"
        }
    }

@app.get("/health")
async def health_check():
    """Comprehensive health check including database status"""
    db_status = await db_health_check()
    
    return {
        "status": "healthy" if db_status["status"] == "healthy" else "degraded",
        "version": "1.0.0",
        "database": db_status,
        "services": {
            "statistical_engine": "operational",
            "file_processor": "operational", 
            "figure_generator": "operational"
        }
    }

@app.get("/api/v1/status")
async def api_status():
    """Detailed API status and configuration"""
    return {
        "api_version": "1.0.0",
        "environment": "development" if settings.PROJECT_NAME == "SciFig AI API" else "production",
        "features": {
            "authentication": True,
            "file_upload": True,
            "statistical_analysis": True,
            "figure_generation": True,
            "real_time": False  # Will be True in Phase 2
        },
        "limits": {
            "max_file_size": settings.MAX_FILE_SIZE,
            "allowed_extensions": settings.ALLOWED_EXTENSIONS
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 