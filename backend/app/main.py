"""Main FastAPI application"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .config.settings import settings
from .config.database import db_manager
from .auth.routes import router as auth_router
from .statistical.routes import router as statistical_router
from .visualization.routes import router as visualization_router
from .projects.routes import router as projects_router
from .analyses.routes import router as analyses_router
from .figure_analysis.routes import router as figure_analysis_router
from .statistical.routes import analyze_data as stat_analyze, analyze_multivariate as stat_multivariate
from .visualization.routes import (
    generate_display_figure as viz_display,
    generate_publication_figure as viz_publication,
    generate_code_edit_figure as viz_code_edit
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    print(f"🚀 Starting {settings.app_name} v{settings.app_version}")
    
    try:
        await db_manager.init_database()
        print("✅ Database initialization completed")
    except Exception as e:
        print(f"⚠️  Database initialization failed: {e}")
        print("🔄 Continuing without database initialization...")
    
    yield
    
    # Shutdown
    print("👋 Shutting down SciFig AI Statistical Engine")


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Advanced statistical analysis and visualization platform for scientific research",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with API v1 prefix
app.include_router(auth_router, prefix="/api/v1")
app.include_router(statistical_router, prefix="/api/v1")
app.include_router(visualization_router, prefix="/api/v1")
app.include_router(projects_router, prefix="/api/v1")
app.include_router(analyses_router, prefix="/api/v1")
app.include_router(figure_analysis_router, prefix="/api/v1")

# Backward compatibility routes for existing frontend
app.post("/analyze")(stat_analyze)
app.post("/analyze_multivariate")(stat_multivariate)  
app.post("/generate_display_figure")(viz_display)
app.post("/generate_publication_figure")(viz_publication)
app.post("/generate_code_edit_figure")(viz_code_edit)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": f"Welcome to {settings.app_name}",
        "version": settings.app_version,
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        db_healthy = await db_manager.health_check()
        return {
            "status": "healthy" if db_healthy else "degraded",
            "service": settings.app_name,
            "version": settings.app_version,
            "database": "connected" if db_healthy else "disconnected"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "service": settings.app_name,
            "version": settings.app_version,
            "database": "error",
            "error": str(e)
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload
    ) 