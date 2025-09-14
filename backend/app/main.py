"""Main FastAPI application"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import time
import os

from .config.settings import settings
from .config.database import db_manager
from .utils.logging import RequestLoggingMiddleware, StructuredLogger
from .auth.routes import router as auth_router
from .statistical.routes import router as statistical_router
from .visualization.routes import router as visualization_router
from .projects.routes import router as projects_router
from .analyses.routes import router as analyses_router
from .figure_analysis.routes import router as figure_analysis_router
from .admin.routes import router as admin_router
from .statistical.routes import analyze_data as stat_analyze, analyze_multivariate as stat_multivariate
from .visualization.routes import (
    generate_display_figure as viz_display,
    generate_publication_figure as viz_publication,
    generate_code_edit_figure as viz_code_edit
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger = StructuredLogger()
    
    # Startup
    print(f"🚀 Starting {settings.app_name} v{settings.app_version}")
    logger.info(
        "Application starting",
        app_name=settings.app_name,
        app_version=settings.app_version,
        environment="development" if settings.debug else "production"
    )
    
    print("🔗 Attempting database initialization...")
    try:
        await db_manager.init_database()
        logger.info("Database initialization completed")
        print("✅ Database initialization completed")
    except Exception as e:
        logger.error("Database initialization failed", error=e)
        print(f"⚠️ Database initialization failed: {e}")
        print("🔄 Continuing without database initialization")
    
    print("🎉 Application startup completed")
    logger.info("Application startup completed")
    
    yield
    
    # Shutdown
    print("👋 Application shutting down")
    logger.info("Application shutting down")


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

# Add request logging middleware
app.add_middleware(RequestLoggingMiddleware)

# Include routers with API v1 prefix
app.include_router(auth_router, prefix="/api/v1")
app.include_router(statistical_router, prefix="/api/v1")
app.include_router(visualization_router, prefix="/api/v1")
app.include_router(projects_router, prefix="/api/v1")
app.include_router(analyses_router, prefix="/api/v1")
app.include_router(figure_analysis_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")

# Backward compatibility routes for existing frontend
app.post("/analyze")(stat_analyze)
app.post("/analyze_multivariate")(stat_multivariate)  
app.post("/generate_display_figure")(viz_display)
app.post("/generate_publication_figure")(viz_publication)
app.post("/generate_code_edit_figure")(viz_code_edit)

@app.get("/api")
async def api_root():
    """API root endpoint"""
    return {
        "message": f"Welcome to {settings.app_name}",
        "version": settings.app_version,
        "status": "running",
        "docs": "/docs",
        "api_version": "v1"
    }

# Serve static files (frontend) if static directory exists
# This should be last to not override API routes
static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
if os.path.exists(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")


@app.get("/health")
async def health_check():
    """Comprehensive health check endpoint"""
    import os
    import psutil
    import time
    
    start_time = time.time()
    health_status = {"timestamp": time.time(), "checks": {}}
    overall_healthy = True
    
    try:
        # Database connectivity check
        db_start = time.time()
        try:
            db_healthy = await db_manager.health_check()
            db_response_time = (time.time() - db_start) * 1000
            health_status["checks"]["database"] = {
                "status": "healthy" if db_healthy else "unhealthy",
                "response_time_ms": round(db_response_time, 2),
                "details": "Connected to Supabase" if db_healthy else "Failed to connect"
            }
            if not db_healthy:
                overall_healthy = False
        except Exception as e:
            db_response_time = (time.time() - db_start) * 1000
            health_status["checks"]["database"] = {
                "status": "unhealthy",
                "response_time_ms": round(db_response_time, 2),
                "details": f"Database error: {str(e)}"
            }
            overall_healthy = False
        
        # System resources check
        try:
            memory_usage = psutil.virtual_memory()
            disk_usage = psutil.disk_usage('/')
            cpu_percent = psutil.cpu_percent(interval=0.1)
            
            # Define thresholds
            memory_threshold = 90  # 90% memory usage
            disk_threshold = 90    # 90% disk usage
            cpu_threshold = 90     # 90% CPU usage
            
            memory_healthy = memory_usage.percent < memory_threshold
            disk_healthy = disk_usage.percent < disk_threshold
            cpu_healthy = cpu_percent < cpu_threshold
            
            health_status["checks"]["system"] = {
                "status": "healthy" if (memory_healthy and disk_healthy and cpu_healthy) else "degraded",
                "memory": {
                    "usage_percent": round(memory_usage.percent, 1),
                    "available_mb": round(memory_usage.available / 1024 / 1024, 1),
                    "healthy": memory_healthy
                },
                "disk": {
                    "usage_percent": round(disk_usage.percent, 1),
                    "free_gb": round(disk_usage.free / 1024 / 1024 / 1024, 1),
                    "healthy": disk_healthy
                },
                "cpu": {
                    "usage_percent": round(cpu_percent, 1),
                    "healthy": cpu_healthy
                }
            }
            
            if not (memory_healthy and disk_healthy and cpu_healthy):
                overall_healthy = False
                
        except Exception as e:
            health_status["checks"]["system"] = {
                "status": "unknown",
                "details": f"Could not check system resources: {str(e)}"
            }
        
        # Upload directory check
        try:
            upload_dir_exists = os.path.exists(settings.upload_dir)
            upload_dir_writable = os.access(settings.upload_dir, os.W_OK) if upload_dir_exists else False
            
            upload_status = "healthy" if (upload_dir_exists and upload_dir_writable) else "unhealthy"
            health_status["checks"]["upload_directory"] = {
                "status": upload_status,
                "path": settings.upload_dir,
                "exists": upload_dir_exists,
                "writable": upload_dir_writable
            }
            
            if upload_status == "unhealthy":
                overall_healthy = False
                
        except Exception as e:
            health_status["checks"]["upload_directory"] = {
                "status": "unhealthy",
                "details": f"Upload directory check failed: {str(e)}"
            }
            overall_healthy = False
        
        # Configuration check
        try:
            config_issues = []
            
            # Check for placeholder values (non-critical but important to flag)
            if 'your-project-id' in settings.supabase_url:
                config_issues.append("Supabase URL contains placeholder")
            if len(settings.secret_key) < 32:
                config_issues.append("JWT secret key is too short")
            
            config_status = "healthy" if not config_issues else "warning"
            health_status["checks"]["configuration"] = {
                "status": config_status,
                "issues": config_issues if config_issues else None
            }
            
        except Exception as e:
            health_status["checks"]["configuration"] = {
                "status": "unknown",
                "details": f"Configuration check failed: {str(e)}"
            }
        
        # Calculate total response time
        total_response_time = (time.time() - start_time) * 1000
        
        # Overall status
        health_status.update({
            "status": "healthy" if overall_healthy else ("degraded" if any(
                check.get("status") in ["degraded", "warning"] 
                for check in health_status["checks"].values()
            ) else "unhealthy"),
            "service": settings.app_name,
            "version": settings.app_version,
            "environment": "development" if settings.debug else "production",
            "uptime_seconds": time.time() - start_time,  # This would be actual uptime in a real implementation
            "response_time_ms": round(total_response_time, 2)
        })
        
        return health_status
        
    except Exception as e:
        # Fallback for any unexpected errors
        return {
            "status": "unhealthy",
            "service": settings.app_name,
            "version": settings.app_version,
            "error": f"Health check failed: {str(e)}",
            "timestamp": time.time()
        }


@app.get("/readiness")
async def readiness_check():
    """Simple readiness check for load balancers and orchestrators"""
    try:
        # Quick database connectivity check
        db_healthy = await db_manager.health_check()
        if db_healthy:
            return {"status": "ready", "timestamp": time.time()}
        else:
            raise HTTPException(status_code=503, detail="Service not ready - database unavailable")
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service not ready: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload
    ) 