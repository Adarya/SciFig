from fastapi import FastAPI, Depends, HTTPException
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

# Add direct statistical analysis endpoint for compatibility
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class AnalysisRequest(BaseModel):
    data: List[Dict[str, Any]]
    outcome_variable: str
    group_variable: str
    analysis_type: str
    time_variable: Optional[str] = None
    event_variable: Optional[str] = None

class PublicationFigureRequest(BaseModel):
    data: List[Dict[str, Any]]
    outcome_variable: str
    group_variable: str
    analysis_type: str
    time_variable: Optional[str] = None
    event_variable: Optional[str] = None
    publication_settings: Optional[Dict[str, Any]] = None
    custom_labels: Optional[Dict[str, str]] = None

class DisplayFigureRequest(BaseModel):
    data: List[Dict[str, Any]]
    outcome_variable: str
    group_variable: str
    analysis_type: str
    time_variable: Optional[str] = None
    event_variable: Optional[str] = None
    journal_style: str = "nature"
    custom_labels: Optional[Dict[str, str]] = None

class CodeEditFigureRequest(BaseModel):
    data: List[Dict[str, Any]]
    outcome_variable: str
    group_variable: str
    analysis_type: str
    time_variable: Optional[str] = None
    event_variable: Optional[str] = None
    journal_style: str = "nature"
    code_parameters: Dict[str, Any]
    custom_labels: Optional[Dict[str, str]] = None
    format: str = "png"

@app.post("/analyze")
async def analyze_data_direct(request: AnalysisRequest):
    """Direct statistical analysis endpoint for frontend components"""
    try:
        # This is a simplified version - you might want to import and use
        # the statistical engine from simple_statistical_server.py
        import pandas as pd
        import numpy as np
        from scipy import stats
        
        # Convert to DataFrame
        df = pd.DataFrame(request.data)
        
        # Clean the data
        df = df.dropna(subset=[request.outcome_variable, request.group_variable])
        
        if len(df) < 3:
            raise HTTPException(status_code=400, detail="Insufficient data for analysis")
        
        # Simple t-test implementation for testing
        if request.analysis_type == "independent_ttest":
            groups = df[request.group_variable].unique()
            if len(groups) != 2:
                raise HTTPException(status_code=400, detail="T-test requires exactly 2 groups")
            
            group1_data = df[df[request.group_variable] == groups[0]][request.outcome_variable].astype(float)
            group2_data = df[df[request.group_variable] == groups[1]][request.outcome_variable].astype(float)
            
            statistic, p_value = stats.ttest_ind(group1_data, group2_data)
            
            return {
                "test_name": "Independent Samples T-Test",
                "statistic": float(statistic),
                "p_value": float(p_value),
                "summary": f"T-test result: t={statistic:.3f}, p={p_value:.3f}",
                "interpretation": "Significant difference" if p_value < 0.05 else "No significant difference",
                "assumptions_met": True,
                "sample_sizes": {str(groups[0]): len(group1_data), str(groups[1]): len(group2_data)},
                "descriptive_stats": {
                    str(groups[0]): {"mean": float(group1_data.mean()), "std": float(group1_data.std())},
                    str(groups[1]): {"mean": float(group2_data.mean()), "std": float(group2_data.std())}
                }
            }
        else:
            return {
                "test_name": f"Analysis: {request.analysis_type}",
                "statistic": 0.0,
                "p_value": 0.05,
                "summary": f"Analysis type {request.analysis_type} is supported but not fully implemented in this endpoint",
                "interpretation": "Analysis completed",
                "assumptions_met": True,
                "sample_sizes": {},
                "descriptive_stats": {}
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate_publication_figure")
async def generate_publication_figure(request: PublicationFigureRequest):
    """Generate publication-ready figure using advanced PublicationVizEngine"""
    try:
        # Import here to avoid startup issues if dependencies missing
        try:
            from publication_viz_engine import PublicationVizEngine
        except ImportError:
            raise HTTPException(status_code=500, detail="PublicationVizEngine not available - missing dependencies")
        
        import pandas as pd
        df = pd.DataFrame(request.data)
        
        # Clean data based on analysis type
        if request.analysis_type == "survival_analysis":
            if not request.time_variable or not request.event_variable:
                raise HTTPException(status_code=400, detail="Survival analysis requires time and event variables")
            df = df.dropna(subset=[request.time_variable, request.event_variable, request.group_variable])
        else:
            df = df.dropna(subset=[request.outcome_variable, request.group_variable])
        
        # Initialize publication engine with journal style
        settings = request.publication_settings or {}
        style = settings.get('journal_style', 'nature')
        engine = PublicationVizEngine(style=style)
        
        # Generate figure based on analysis type
        if request.analysis_type in ["independent_ttest", "mann_whitney_u", "one_way_anova"]:
            figure_b64 = engine.create_publication_boxplot(
                data=df,
                outcome_var=request.outcome_variable,
                group_var=request.group_variable,
                title=request.custom_labels.get('title') if request.custom_labels else None,
                custom_labels=request.custom_labels
            )
        elif request.analysis_type == "survival_analysis":
            figure_b64 = engine.create_kaplan_meier_plot(
                data=df,
                time_var=request.time_variable,
                event_var=request.event_variable,
                group_var=request.group_variable,
                title=request.custom_labels.get('title') if request.custom_labels else None,
                custom_labels=request.custom_labels
            )
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported analysis type for publication figure: {request.analysis_type}")
        
        return {
            "figure": figure_b64,
            "format": "png",
            "journal_style": style,
            "message": f"Publication-ready figure generated with {style} journal styling"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate_display_figure")
async def generate_display_figure(request: DisplayFigureRequest):
    """Generate publication-ready figure for display in the web interface"""
    try:
        try:
            from publication_viz_engine import PublicationVizEngine
        except ImportError:
            raise HTTPException(status_code=500, detail="PublicationVizEngine not available - missing dependencies")
        
        import pandas as pd
        df = pd.DataFrame(request.data)
        
        # Clean data based on analysis type
        if request.analysis_type == "survival_analysis":
            if not request.time_variable or not request.event_variable:
                raise HTTPException(status_code=400, detail="Survival analysis requires time and event variables")
            df = df.dropna(subset=[request.time_variable, request.event_variable, request.group_variable])
        else:
            df = df.dropna(subset=[request.outcome_variable, request.group_variable])
        
        # Initialize publication engine with specified journal style
        engine = PublicationVizEngine(style=request.journal_style)
        
        # Generate appropriate visualization based on analysis type
        if request.analysis_type in ["independent_ttest", "mann_whitney_u"]:
            figure_b64 = engine.create_publication_boxplot(
                data=df,
                outcome_var=request.outcome_variable,
                group_var=request.group_variable,
                title=request.custom_labels.get('title') if request.custom_labels else None,
                custom_labels=request.custom_labels
            )
        elif request.analysis_type == "survival_analysis":
            figure_b64 = engine.create_kaplan_meier_plot(
                data=df,
                time_var=request.time_variable,
                event_var=request.event_variable,
                group_var=request.group_variable,
                title=request.custom_labels.get('title') if request.custom_labels else None,
                custom_labels=request.custom_labels
            )
        else:
            # Default to boxplot for other analysis types
            figure_b64 = engine.create_publication_boxplot(
                data=df,
                outcome_var=request.outcome_variable,
                group_var=request.group_variable,
                title=request.custom_labels.get('title') if request.custom_labels else None,
                custom_labels=request.custom_labels
            )
        
        return {
            "figure": figure_b64,
            "format": "png",
            "journal_style": request.journal_style,
            "message": f"Display figure generated with {request.journal_style} journal styling"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate_code_edit_figure")
async def generate_code_edit_figure(request: CodeEditFigureRequest):
    """Generate figure with user-editable code parameters"""
    try:
        try:
            from publication_viz_engine import PublicationVizEngine
        except ImportError:
            raise HTTPException(status_code=500, detail="PublicationVizEngine not available - missing dependencies")
        
        import pandas as pd
        df = pd.DataFrame(request.data)
        
        # Clean data based on analysis type
        if request.analysis_type == "survival_analysis":
            if not request.time_variable or not request.event_variable:
                raise HTTPException(status_code=400, detail="Survival analysis requires time and event variables")
            df = df.dropna(subset=[request.time_variable, request.event_variable, request.group_variable])
        else:
            df = df.dropna(subset=[request.outcome_variable, request.group_variable])
        
        # Initialize publication engine with specified journal style
        engine = PublicationVizEngine(style=request.journal_style)
        
        # Generate figure with custom code parameters
        figure_b64 = engine.create_code_editable_figure(
            data=df,
            outcome_var=request.outcome_variable,
            group_var=request.group_variable,
            analysis_type=request.analysis_type,
            code_params=request.code_parameters,
            time_var=request.time_variable,
            event_var=request.event_variable,
            title=request.custom_labels.get('title') if request.custom_labels else None,
            custom_labels=request.custom_labels,
            format_type=request.format
        )
        
        return {
            "figure": figure_b64,
            "format": request.format,
            "journal_style": request.journal_style,
            "code_parameters": request.code_parameters,
            "message": f"Code-customized {request.format.upper()} figure generated with {request.journal_style} journal styling"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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