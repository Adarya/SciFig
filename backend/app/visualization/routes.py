"""Visualization routes"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional, Dict, Any, List
import pandas as pd

from .services import PublicationVizService
from ..auth.dependencies import get_optional_user
from ..auth.models import UserResponse
from ..statistical.models import AnalysisRequest, MultivariateAnalysisRequest
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/visualization", tags=["visualization"])


class PublicationFigureRequest(BaseModel):
    """Publication figure request model"""
    data: List[Dict[str, Any]]
    outcome_variable: str
    group_variable: str
    analysis_type: str
    time_variable: Optional[str] = None
    event_variable: Optional[str] = None
    format: str = "png"
    custom_labels: Optional[Dict[str, str]] = None
    publication_settings: Optional[Dict[str, Any]] = None


class DisplayFigureRequest(BaseModel):
    """Display figure request model"""
    data: List[Dict[str, Any]]
    outcome_variable: str
    group_variable: str
    analysis_type: str
    time_variable: Optional[str] = None
    event_variable: Optional[str] = None
    custom_labels: Optional[Dict[str, str]] = None
    journal_style: str = "nature"


class CodeEditFigureRequest(BaseModel):
    """Code editable figure request model"""
    data: List[Dict[str, Any]]
    outcome_variable: str
    group_variable: str
    analysis_type: str
    time_variable: Optional[str] = None
    event_variable: Optional[str] = None
    custom_labels: Optional[Dict[str, str]] = None
    journal_style: str = "nature"
    code_parameters: Dict[str, Any] = {}
    format: str = "png"


@router.post("/generate_publication_figure")
async def generate_publication_figure(
    request: PublicationFigureRequest,
    current_user: Optional[UserResponse] = Depends(get_optional_user)
):
    """Generate publication-ready figure using advanced visualization engine"""
    try:
        df = pd.DataFrame(request.data)
        
        # Clean data based on analysis type
        if request.analysis_type == "survival_analysis":
            if not request.time_variable or not request.event_variable:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Survival analysis requires time and event variables"
                )
            df = df.dropna(subset=[request.time_variable, request.event_variable, request.group_variable])
        else:
            df = df.dropna(subset=[request.outcome_variable, request.group_variable])
        
        # Initialize visualization service
        settings = request.publication_settings or {}
        style = settings.get('journal_style', 'nature')
        viz_service = PublicationVizService(style=style)
        
        # Generate figure based on analysis type
        if request.analysis_type in ["independent_ttest", "mann_whitney_u", "one_way_anova"]:
            figure_b64 = viz_service.create_publication_boxplot(
                data=df,
                outcome_var=request.outcome_variable,
                group_var=request.group_variable,
                title=request.custom_labels.get('title') if request.custom_labels else None,
                custom_labels=request.custom_labels,
                format_type=request.format
            )
        
        elif request.analysis_type == "survival_analysis":
            figure_b64 = viz_service.create_kaplan_meier_plot(
                data=df,
                time_var=request.time_variable,
                event_var=request.event_variable,
                group_var=request.group_variable,
                title=request.custom_labels.get('title') if request.custom_labels else None,
                custom_labels=request.custom_labels,
                format_type=request.format
            )
        
        elif request.analysis_type == "correlation_analysis":
            numeric_vars = df.select_dtypes(include=['number']).columns.tolist()
            if len(numeric_vars) < 2:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Insufficient numeric variables for correlation analysis"
                )
            
            figure_b64 = viz_service.create_correlation_heatmap(
                data=df,
                variables=numeric_vars[:10],
                method='pearson',
                title=request.custom_labels.get('title') if request.custom_labels else "Correlation Matrix"
            )
        
        elif request.analysis_type == "chi_square":
            figure_b64 = viz_service.create_contingency_heatmap(
                data=df,
                outcome_var=request.outcome_variable,
                group_var=request.group_variable,
                title=request.custom_labels.get('title') if request.custom_labels else "Contingency Table",
                custom_labels=request.custom_labels,
                format_type=request.format
            )
        
        else:
            # Default to box plot
            figure_b64 = viz_service.create_publication_boxplot(
                data=df,
                outcome_var=request.outcome_variable,
                group_var=request.group_variable,
                title=request.custom_labels.get('title') if request.custom_labels else None,
                custom_labels=request.custom_labels,
                format_type=request.format
            )
        
        return {
            "figure": figure_b64,
            "format": request.format,
            "message": f"Publication-quality {request.format.upper()} generated successfully using {style} journal style"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Figure generation failed: {str(e)}"
        )


@router.post("/generate_display_figure")
async def generate_display_figure(
    request: DisplayFigureRequest,
    current_user: Optional[UserResponse] = Depends(get_optional_user)
):
    """Generate publication-ready figure for display in the web interface"""
    try:
        print(f"DEBUG: Received request with data length: {len(request.data)}")
        print(f"DEBUG: Analysis type: {request.analysis_type}")
        
        df = pd.DataFrame(request.data)
        print(f"DEBUG: Initial DataFrame shape: {df.shape}")
        
        if df.empty:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty dataset provided"
            )
        
        # Clean data based on analysis type
        if request.analysis_type in ["survival_analysis", "kaplan_meier"]:
            if not request.time_variable or not request.event_variable:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Survival analysis requires time and event variables"
                )
            
            missing_cols = []
            for col in [request.time_variable, request.event_variable, request.group_variable]:
                if col not in df.columns:
                    missing_cols.append(col)
            if missing_cols:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Missing required columns: {missing_cols}"
                )
            
            df = df.dropna(subset=[request.time_variable, request.event_variable, request.group_variable])
            
            if df.empty:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No valid data remaining after removing NaN values"
                )
        else:
            df = df.dropna(subset=[request.outcome_variable, request.group_variable])
        
        # Initialize visualization service
        viz_service = PublicationVizService(style=request.journal_style)
        
        # Determine visualization based on analysis type
        groups = df[request.group_variable].unique()
        n_groups = len(groups)
        print(f"DEBUG: Found {n_groups} groups: {groups}")
        
        # Generate figure based on analysis type
        if request.analysis_type in ["independent_ttest", "mann_whitney_u", "one_way_anova"]:
            figure_b64 = viz_service.create_publication_boxplot(
                data=df,
                outcome_var=request.outcome_variable,
                group_var=request.group_variable,
                title=request.custom_labels.get('title') if request.custom_labels else None,
                custom_labels=request.custom_labels
            )
            
        elif request.analysis_type in ["survival_analysis", "kaplan_meier"]:
            print(f"DEBUG: Calling create_kaplan_meier_plot with cleaned data")
            figure_b64 = viz_service.create_kaplan_meier_plot(
                data=df,
                time_var=request.time_variable,
                event_var=request.event_variable,
                group_var=request.group_variable,
                title=request.custom_labels.get('title') if request.custom_labels else "Kaplan-Meier Survival Curves",
                custom_labels=request.custom_labels
            )
            
        elif request.analysis_type == "correlation_analysis":
            numeric_vars = df.select_dtypes(include=['number']).columns.tolist()
            if len(numeric_vars) < 2:
                # Fallback to box plot
                figure_b64 = viz_service.create_publication_boxplot(
                    data=df,
                    outcome_var=request.outcome_variable,
                    group_var=request.group_variable,
                    title=request.custom_labels.get('title') if request.custom_labels else None,
                    custom_labels=request.custom_labels
                )
            else:
                figure_b64 = viz_service.create_correlation_heatmap(
                    data=df,
                    variables=numeric_vars[:8],
                    method='pearson',
                    title=request.custom_labels.get('title') if request.custom_labels else "Correlation Matrix"
                )
                
        elif request.analysis_type == "chi_square":
            figure_b64 = viz_service.create_contingency_heatmap(
                data=df,
                outcome_var=request.outcome_variable,
                group_var=request.group_variable,
                title=request.custom_labels.get('title') if request.custom_labels else "Contingency Table",
                custom_labels=request.custom_labels
            )
            
        else:
            # Default visualization - box plot
            figure_b64 = viz_service.create_publication_boxplot(
                data=df,
                outcome_var=request.outcome_variable,
                group_var=request.group_variable,
                title=request.custom_labels.get('title') if request.custom_labels else None,
                custom_labels=request.custom_labels
            )
        
        # Calculate dynamic figure dimensions
        data_complexity = "simple" if n_groups <= 2 else "medium" if n_groups <= 4 else "complex"
        
        return {
            "figure": figure_b64,
            "format": "png",
            "journal_style": request.journal_style,
            "data_complexity": data_complexity,
            "n_groups": n_groups,
            "message": f"Display figure generated with {request.journal_style} journal styling"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        print(f"ERROR in generate_display_figure: {str(e)}")
        print(f"ERROR traceback: {error_traceback}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Display figure generation failed: {str(e)}"
        )


@router.post("/generate_code_edit_figure")
async def generate_code_edit_figure(
    request: CodeEditFigureRequest,
    current_user: Optional[UserResponse] = Depends(get_optional_user)
):
    """Generate figure with user-editable code parameters"""
    try:
        df = pd.DataFrame(request.data)
        
        # Clean data based on analysis type
        if request.analysis_type == "survival_analysis":
            if not request.time_variable or not request.event_variable:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Survival analysis requires time and event variables"
                )
            df = df.dropna(subset=[request.time_variable, request.event_variable, request.group_variable])
        else:
            df = df.dropna(subset=[request.outcome_variable, request.group_variable])
        
        # Initialize visualization service
        viz_service = PublicationVizService(style=request.journal_style)
        
        # Generate figure with custom code parameters
        figure_b64 = viz_service.create_code_editable_figure(
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
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Code editable figure generation failed: {str(e)}"
        )


@router.get("/styles")
async def get_available_styles():
    """Get available journal styles for figures"""
    return {
        "styles": [
            {
                "id": "nature",
                "name": "Nature",
                "description": "Nature journal styling with clean, professional appearance"
            },
            {
                "id": "science",
                "name": "Science",
                "description": "Science magazine styling with bold, impactful visuals"
            },
            {
                "id": "cell",
                "name": "Cell",
                "description": "Cell journal styling with vibrant, detailed figures"
            },
            {
                "id": "nejm",
                "name": "NEJM",
                "description": "New England Journal of Medicine medical styling"
            }
        ],
        "default": "nature"
    }


@router.get("/formats")
async def get_available_formats():
    """Get available output formats for figures"""
    return {
        "formats": [
            {
                "id": "png",
                "name": "PNG",
                "description": "High-quality raster format, best for web display",
                "recommended_for": ["web", "presentations"]
            },
            {
                "id": "pdf",
                "name": "PDF",
                "description": "Vector format, best for publications and print",
                "recommended_for": ["publications", "print"]
            },
            {
                "id": "svg",
                "name": "SVG",
                "description": "Scalable vector format, best for web and editing",
                "recommended_for": ["web", "editing"]
            },
            {
                "id": "eps",
                "name": "EPS",
                "description": "Encapsulated PostScript, best for high-end publishing",
                "recommended_for": ["publishing", "professional_print"]
            }
        ],
        "default": "png"
    } 