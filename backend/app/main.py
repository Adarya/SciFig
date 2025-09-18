"""Main FastAPI application"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
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
from .files.routes import router as files_router
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
# In production (Railway), be more permissive with CORS
cors_origins = settings.cors_origins
if not settings.debug:
    # Production: allow Railway domains and common origins
    cors_origins = ["*"]  # Temporarily allow all for Railway debugging
    print(f"🔧 Production CORS: Allowing all origins for Railway deployment")
else:
    print(f"🔧 Development CORS: {cors_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add request logging middleware
app.add_middleware(RequestLoggingMiddleware)

# Include routers with API v1 prefix
print("🔧 Loading API routers...")
try:
    app.include_router(auth_router, prefix="/api/v1")
    print("✅ Auth router loaded")
except Exception as e:
    print(f"❌ Auth router failed: {e}")

try:
    app.include_router(statistical_router, prefix="/api/v1")
    print("✅ Statistical router loaded")
except Exception as e:
    print(f"❌ Statistical router failed: {e}")

try:
    app.include_router(visualization_router, prefix="/api/v1")
    print("✅ Visualization router loaded")
except Exception as e:
    print(f"❌ Visualization router failed: {e}")

try:
    app.include_router(projects_router, prefix="/api/v1")
    print("✅ Projects router loaded")
    print(f"   └─ Routes: {[route.path for route in projects_router.routes]}")
except Exception as e:
    print(f"❌ Projects router failed: {e}")
    import traceback
    print(f"   └─ Traceback: {traceback.format_exc()}")

try:
    app.include_router(analyses_router, prefix="/api/v1")
    print("✅ Analyses router loaded")
except Exception as e:
    print(f"❌ Analyses router failed: {e}")

try:
    app.include_router(figure_analysis_router, prefix="/api/v1")
    print("✅ Figure analysis router loaded")
except Exception as e:
    print(f"❌ Figure analysis router failed: {e}")

try:
    app.include_router(admin_router, prefix="/api/v1")
    print("✅ Admin router loaded")
except Exception as e:
    print(f"❌ Admin router failed: {e}")

try:
    app.include_router(files_router, prefix="/api/v1")
    print("✅ Files router loaded")
    print(f"   └─ Routes: {[route.path for route in files_router.routes]}")
except Exception as e:
    print(f"❌ Files router failed: {e}")
    import traceback
    print(f"   └─ Traceback: {traceback.format_exc()}")

print("🚀 Router loading complete")

# Backward compatibility routes for existing frontend
app.post("/analyze")(stat_analyze)
app.post("/analyze_multivariate")(stat_multivariate)  
app.post("/generate_display_figure")(viz_display)
app.post("/generate_publication_figure")(viz_publication)
app.post("/generate_code_edit_figure")(viz_code_edit)

# Add a simple root endpoint for API info (before static mount)
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

# Debug endpoint to test API routing without auth
@app.get("/api/v1/debug")
async def debug_endpoint():
    """Debug endpoint - no authentication required"""
    import inspect
    
    # Get all registered routes
    routes_info = []
    for route in app.routes:
        if hasattr(route, 'path') and hasattr(route, 'methods'):
            routes_info.append({
                "path": route.path,
                "methods": list(route.methods),
                "name": getattr(route, 'name', 'unknown')
            })
    
    return {
        "message": "API routing is working!",
        "timestamp": time.time(),
        "router_status": {
            "projects_router_loaded": any(r['path'].startswith('/api/v1/projects') for r in routes_info),
            "auth_router_loaded": any(r['path'].startswith('/api/v1/auth') for r in routes_info),
            "total_routes": len(routes_info)
        },
        "all_routes": [r for r in routes_info if r['path'].startswith('/api/v1/')],
        "endpoints_available": [
            "/api/v1/auth/check",
            "/api/v1/projects", 
            "/api/v1/statistical",
            "/api/v1/visualization"
        ]
    }

# Direct test of projects endpoint without router (for debugging)
@app.get("/api/v1/projects-test")
async def test_projects_direct():
    """Direct projects test endpoint - no authentication required"""
    return {
        "message": "Direct projects endpoint works!",
        "note": "This proves the /api/v1/ routing works",
        "actual_projects_endpoint": "/api/v1/projects should work too"
    }

# Test authentication dependencies
@app.get("/api/v1/auth-test")
async def test_auth_dependencies():
    """Test if authentication dependencies can be loaded"""
    try:
        from .auth.dependencies import get_current_active_user
        from .config.database import get_db_client
        return {
            "message": "Auth dependencies loaded successfully",
            "dependencies": ["get_current_active_user", "get_db_client"],
            "status": "ok"
        }
    except Exception as e:
        return {
            "message": "Auth dependencies failed to load",
            "error": str(e),
            "status": "error"
        }

# Static file serving setup (after all API routes)
static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
print(f"🔍 Checking for static files at: {static_dir}")

if os.path.exists(static_dir) and os.path.exists(os.path.join(static_dir, "index.html")):
    print(f"✅ Static files found - enabling full-stack mode")
    
    # Mount static assets directory
    assets_dir = os.path.join(static_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
        print(f"✅ Mounted assets directory: /assets")
    
    # Serve common static files
    @app.api_route("/favicon.ico", methods=["GET", "HEAD"], include_in_schema=False)
    async def favicon():
        favicon_path = os.path.join(static_dir, "favicon.ico")
        if os.path.exists(favicon_path):
            return FileResponse(favicon_path)
        
        # Fallback to vite.svg if it exists
        vite_svg_path = os.path.join(static_dir, "vite.svg")
        if os.path.exists(vite_svg_path):
            return FileResponse(vite_svg_path)
            
        # Return a simple SciFig icon as fallback
        from fastapi.responses import Response
        fallback_svg = '''<?xml version="1.0" encoding="UTF-8"?>
<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="14" fill="#3B82F6"/>
    <text x="16" y="20" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">SF</text>
</svg>'''
        return Response(content=fallback_svg, media_type="image/svg+xml")
        
    @app.api_route("/vite.svg", methods=["GET", "HEAD"], include_in_schema=False)
    async def vite_logo():
        vite_svg_path = os.path.join(static_dir, "vite.svg")
        if os.path.exists(vite_svg_path):
            return FileResponse(vite_svg_path)
        
        # Return a simple SciFig logo SVG as fallback
        from fastapi.responses import Response
        fallback_svg = '''<?xml version="1.0" encoding="UTF-8"?>
<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="14" fill="#3B82F6"/>
    <text x="16" y="20" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">SF</text>
</svg>'''
        return Response(content=fallback_svg, media_type="image/svg+xml")

else:
    print(f"🔧 No static files found - API-only mode")
    
    @app.api_route("/", methods=["GET", "HEAD"], include_in_schema=False)
    async def root_dev():
        """Root endpoint - development mode""" 
        return {
            "message": f"Welcome to {settings.app_name}",
            "version": settings.app_version,
            "status": "running", 
            "mode": "api_only",
            "frontend": "not_built", 
            "docs": "/docs",
            "health": "/health",
            "note": "Frontend not built - run 'yarn build' and restart"
        }


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


# SPA routes (MUST BE LAST - after all API routes)
if os.path.exists(static_dir) and os.path.exists(os.path.join(static_dir, "index.html")):
    
    @app.api_route("/", methods=["GET", "HEAD"], include_in_schema=False)
    async def serve_frontend_root():
        """Serve the React app at root"""
        return FileResponse(os.path.join(static_dir, "index.html"))
    
    @app.api_route("/{full_path:path}", methods=["GET", "HEAD"], include_in_schema=False)
    async def spa_catch_all(full_path: str):
        """SPA catch-all for React Router - serves index.html for all unmatched routes"""
        # Skip API routes (they should have been handled already)
        if full_path.startswith(("api/", "health", "docs", "openapi.json", "redoc")):
            raise HTTPException(404, "API endpoint not found")
            
        # Check if it's a specific static file first
        file_path = os.path.join(static_dir, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        
        # For everything else (React routes), serve index.html
        return FileResponse(os.path.join(static_dir, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload
    ) 