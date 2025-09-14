"""Visualization routes"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional, Dict, Any, List
import pandas as pd

from .services import PublicationVizService
from ..auth.dependencies import get_optional_user
from ..auth.models import UserResponse
from ..statistical.models import AnalysisRequest, MultivariateAnalysisRequest
from .templates import template_library, FigureTemplate, TemplateCategory
from .ai_suggestions import ai_plot_suggestor, AnalysisGoal
from pydantic import BaseModel

router = APIRouter(prefix="/visualization", tags=["visualization"])


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


class HeatmapRequest(BaseModel):
    """Heatmap visualization request"""
    data: List[Dict[str, Any]]
    x_var: Optional[str] = None
    y_var: Optional[str] = None
    value_var: Optional[str] = None
    title: Optional[str] = None
    custom_labels: Optional[Dict[str, str]] = None
    cmap: str = "RdBu_r"
    show_values: bool = True
    cluster_rows: bool = False
    cluster_cols: bool = False
    format: str = "png"
    journal_style: str = "nature"


@router.post("/generate_heatmap")
async def generate_heatmap(
    request: HeatmapRequest,
    current_user: Optional[UserResponse] = Depends(get_optional_user)
):
    """Generate publication-quality heatmap with optional clustering"""
    try:
        df = pd.DataFrame(request.data)
        
        viz_service = PublicationVizService(style=request.journal_style)
        
        figure_b64 = viz_service.create_heatmap(
            data=df,
            x_var=request.x_var,
            y_var=request.y_var,
            value_var=request.value_var,
            title=request.title,
            custom_labels=request.custom_labels,
            cmap=request.cmap,
            show_values=request.show_values,
            cluster_rows=request.cluster_rows,
            cluster_cols=request.cluster_cols,
            format_type=request.format
        )
        
        return {
            "figure": figure_b64,
            "format": request.format,
            "style": request.journal_style,
            "type": "heatmap"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Heatmap generation failed: {str(e)}"
        )


class VolcanoPlotRequest(BaseModel):
    """Volcano plot request for differential expression"""
    data: List[Dict[str, Any]]
    log2fc_col: str
    pvalue_col: str
    gene_col: Optional[str] = None
    fc_threshold: float = 1.0
    pvalue_threshold: float = 0.05
    title: Optional[str] = None
    highlight_genes: Optional[List[str]] = None
    format: str = "png"
    journal_style: str = "nature"


@router.post("/generate_volcano_plot")
async def generate_volcano_plot(
    request: VolcanoPlotRequest,
    current_user: Optional[UserResponse] = Depends(get_optional_user)
):
    """Generate volcano plot for differential expression analysis"""
    try:
        df = pd.DataFrame(request.data)
        
        viz_service = PublicationVizService(style=request.journal_style)
        
        figure_b64 = viz_service.create_volcano_plot(
            data=df,
            log2fc_col=request.log2fc_col,
            pvalue_col=request.pvalue_col,
            gene_col=request.gene_col,
            fc_threshold=request.fc_threshold,
            pvalue_threshold=request.pvalue_threshold,
            title=request.title,
            highlight_genes=request.highlight_genes,
            format_type=request.format
        )
        
        return {
            "figure": figure_b64,
            "format": request.format,
            "style": request.journal_style,
            "type": "volcano"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Volcano plot generation failed: {str(e)}"
        )


class ViolinPlotRequest(BaseModel):
    """Violin plot request"""
    data: List[Dict[str, Any]]
    outcome_variable: str
    group_variable: str
    title: Optional[str] = None
    custom_labels: Optional[Dict[str, str]] = None
    show_box: bool = True
    show_points: bool = True
    show_stats: bool = True
    format: str = "png"
    journal_style: str = "nature"


@router.post("/generate_violin_plot")
async def generate_violin_plot(
    request: ViolinPlotRequest,
    current_user: Optional[UserResponse] = Depends(get_optional_user)
):
    """Generate violin plot with statistical annotations"""
    try:
        df = pd.DataFrame(request.data)
        df = df.dropna(subset=[request.outcome_variable, request.group_variable])
        
        viz_service = PublicationVizService(style=request.journal_style)
        
        figure_b64 = viz_service.create_violin_plot(
            data=df,
            outcome_var=request.outcome_variable,
            group_var=request.group_variable,
            title=request.title,
            custom_labels=request.custom_labels,
            show_box=request.show_box,
            show_points=request.show_points,
            show_stats=request.show_stats,
            format_type=request.format
        )
        
        return {
            "figure": figure_b64,
            "format": request.format,
            "style": request.journal_style,
            "type": "violin"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Violin plot generation failed: {str(e)}"
        )


class ROCCurveRequest(BaseModel):
    """ROC curve request"""
    y_true: List[int]
    y_scores: List[float]
    title: Optional[str] = None
    multi_class: Optional[Dict[str, Dict[str, List]]] = None
    format: str = "png"
    journal_style: str = "nature"


@router.post("/generate_roc_curve")
async def generate_roc_curve(
    request: ROCCurveRequest,
    current_user: Optional[UserResponse] = Depends(get_optional_user)
):
    """Generate ROC curve with AUC calculation"""
    try:
        import numpy as np
        
        viz_service = PublicationVizService(style=request.journal_style)
        
        if request.multi_class:
            # Convert multi_class dict to proper format
            multi_class_data = {}
            for class_name, class_data in request.multi_class.items():
                y_t = np.array(class_data['y_true'])
                y_s = np.array(class_data['y_scores'])
                multi_class_data[class_name] = (y_t, y_s)
            
            figure_b64 = viz_service.create_roc_curve(
                y_true=None,
                y_scores=None,
                title=request.title,
                multi_class=multi_class_data,
                format_type=request.format
            )
        else:
            figure_b64 = viz_service.create_roc_curve(
                y_true=np.array(request.y_true),
                y_scores=np.array(request.y_scores),
                title=request.title,
                format_type=request.format
            )
        
        return {
            "figure": figure_b64,
            "format": request.format,
            "style": request.journal_style,
            "type": "roc_curve"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ROC curve generation failed: {str(e)}"
        )


# Template Management Endpoints

@router.get("/templates")
async def get_all_templates():
    """Get all available figure templates"""
    templates = list(template_library.templates.values())
    return {
        "templates": templates,
        "categories": [category.value for category in TemplateCategory],
        "total_count": len(templates)
    }


@router.get("/templates/category/{category}")
async def get_templates_by_category(category: TemplateCategory):
    """Get templates by category"""
    templates = template_library.get_templates_by_category(category)
    return {
        "category": category.value,
        "templates": templates,
        "count": len(templates)
    }


@router.get("/templates/{template_id}")
async def get_template(template_id: str):
    """Get a specific template by ID"""
    template = template_library.get_template(template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template '{template_id}' not found"
        )
    return template


@router.get("/templates/search/{query}")
async def search_templates(query: str):
    """Search templates by name, description, or tags"""
    templates = template_library.search_templates(query)
    return {
        "query": query,
        "templates": templates,
        "count": len(templates)
    }


class TemplateRecommendationRequest(BaseModel):
    """Request for template recommendations based on data"""
    data: List[Dict[str, Any]]
    analysis_goal: Optional[str] = None


@router.post("/templates/recommend")
async def get_template_recommendations(
    request: TemplateRecommendationRequest,
    current_user: Optional[UserResponse] = Depends(get_optional_user)
):
    """Get template recommendations based on data characteristics"""
    try:
        # Analyze data structure
        if not request.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No data provided for analysis"
            )
        
        df = pd.DataFrame(request.data)
        
        # Analyze data characteristics
        data_shape = analyze_data_characteristics(df)
        
        # Get recommendations
        recommendations = template_library.get_recommended_templates(data_shape)
        
        return {
            "data_characteristics": data_shape,
            "recommendations": recommendations,
            "analysis_goal": request.analysis_goal,
            "count": len(recommendations)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Template recommendation failed: {str(e)}"
        )


def analyze_data_characteristics(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Analyze data characteristics to provide intelligent recommendations
    """
    # Basic data structure
    characteristics = {
        "total_rows": len(df),
        "total_columns": len(df.columns),
        "column_names": list(df.columns),
    }
    
    # Column type analysis
    numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
    categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
    datetime_cols = df.select_dtypes(include=['datetime64']).columns.tolist()
    
    characteristics.update({
        "num_numeric_cols": len(numeric_cols),
        "num_categorical_cols": len(categorical_cols),
        "num_datetime_cols": len(datetime_cols),
        "numeric_columns": numeric_cols,
        "categorical_columns": categorical_cols,
        "datetime_columns": datetime_cols,
    })
    
    # Special column detection
    characteristics["has_time_column"] = any(
        col.lower() in ['time', 'days', 'months', 'years', 'duration', 'followup', 'follow_up']
        for col in df.columns
    )
    
    characteristics["has_event_column"] = any(
        col.lower() in ['event', 'status', 'death', 'deceased', 'outcome', 'censored']
        for col in df.columns
    )
    
    # Group analysis
    if categorical_cols:
        group_sizes = {}
        for col in categorical_cols[:3]:  # Check first 3 categorical columns
            unique_vals = df[col].nunique()
            if unique_vals <= 10:  # Reasonable number of groups
                group_sizes[col] = unique_vals
        
        if group_sizes:
            characteristics["num_groups"] = min(group_sizes.values())
            characteristics["group_columns"] = group_sizes
    
    # Binary outcome detection
    if numeric_cols:
        binary_cols = []
        for col in numeric_cols:
            unique_vals = df[col].dropna().unique()
            if len(unique_vals) == 2 and set(unique_vals).issubset({0, 1, 0.0, 1.0}):
                binary_cols.append(col)
        characteristics["binary_columns"] = binary_cols
        characteristics["has_binary_outcome"] = len(binary_cols) > 0
    
    # Expression/genomics data detection
    if len(numeric_cols) > 50:  # Likely expression matrix
        characteristics["likely_expression_data"] = True
        # Check for gene-like column names
        gene_patterns = ['gene', 'symbol', 'ensembl', 'entrez']
        characteristics["has_gene_identifiers"] = any(
            any(pattern in col.lower() for pattern in gene_patterns)
            for col in df.columns
        )
    
    # Correlation analysis suitability
    if len(numeric_cols) >= 3:
        characteristics["suitable_for_correlation"] = True
        # Calculate sample correlation to assess multicollinearity
        if len(df) > 10:
            corr_matrix = df[numeric_cols].corr().abs()
            high_corr_pairs = (corr_matrix > 0.7).sum().sum() - len(numeric_cols)  # Exclude diagonal
            characteristics["high_correlation_pairs"] = high_corr_pairs
    
    # Time series detection
    if datetime_cols or characteristics["has_time_column"]:
        characteristics["suitable_for_time_series"] = True
        if 'subject' in ' '.join(df.columns).lower() or 'id' in ' '.join(df.columns).lower():
            characteristics["longitudinal_data"] = True
    
    # Missing data analysis
    missing_data = df.isnull().sum()
    characteristics["columns_with_missing"] = missing_data[missing_data > 0].to_dict()
    characteristics["missing_data_percentage"] = (missing_data.sum() / (len(df) * len(df.columns))) * 100
    
    return characteristics


class AIPlotSuggestionRequest(BaseModel):
    """Request for AI-powered plot suggestions"""
    data: List[Dict[str, Any]]
    analysis_goal: Optional[AnalysisGoal] = None
    top_k: int = 5


@router.post("/ai/suggest_plots")
async def get_ai_plot_suggestions(
    request: AIPlotSuggestionRequest,
    current_user: Optional[UserResponse] = Depends(get_optional_user)
):
    """Get AI-powered plot type suggestions based on data analysis"""
    try:
        if not request.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No data provided for analysis"
            )
        
        df = pd.DataFrame(request.data)
        
        # Analyze data characteristics
        data_characteristics = analyze_data_characteristics(df)
        
        # Get AI recommendations
        suggestions = ai_plot_suggestor.suggest_plots(
            data_characteristics=data_characteristics,
            analysis_goal=request.analysis_goal,
            top_k=request.top_k
        )
        
        # Enhance suggestions with template information
        enhanced_suggestions = []
        for suggestion in suggestions:
            enhanced_suggestion = suggestion.dict()
            if suggestion.template_id:
                template = template_library.get_template(suggestion.template_id)
                if template:
                    enhanced_suggestion['template_info'] = template.dict()
            enhanced_suggestions.append(enhanced_suggestion)
        
        return {
            "data_characteristics": {
                # Return key characteristics for transparency
                "total_rows": data_characteristics["total_rows"],
                "total_columns": data_characteristics["total_columns"],
                "num_numeric_cols": data_characteristics["num_numeric_cols"],
                "num_categorical_cols": data_characteristics["num_categorical_cols"],
                "has_time_column": data_characteristics.get("has_time_column", False),
                "has_event_column": data_characteristics.get("has_event_column", False),
                "has_binary_outcome": data_characteristics.get("has_binary_outcome", False),
                "suitable_for_correlation": data_characteristics.get("suitable_for_correlation", False),
                "likely_expression_data": data_characteristics.get("likely_expression_data", False),
                "num_groups": data_characteristics.get("num_groups", 0)
            },
            "analysis_goal": request.analysis_goal,
            "suggestions": enhanced_suggestions,
            "total_suggestions": len(enhanced_suggestions),
            "ai_confidence": "high" if enhanced_suggestions and enhanced_suggestions[0]["score"] > 0.7 else "moderate"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI plot suggestion failed: {str(e)}"
        )


@router.get("/ai/analysis_goals")
async def get_analysis_goals():
    """Get available analysis goals for AI suggestions"""
    return {
        "analysis_goals": [
            {
                "id": goal.value,
                "name": goal.value.replace('_', ' ').title(),
                "description": _get_goal_description(goal)
            }
            for goal in AnalysisGoal
        ]
    }


def _get_goal_description(goal: AnalysisGoal) -> str:
    """Get human-readable description for analysis goals"""
    descriptions = {
        AnalysisGoal.COMPARE_GROUPS: "Compare differences between two or more groups",
        AnalysisGoal.SHOW_CORRELATION: "Visualize relationships and correlations between variables",
        AnalysisGoal.SHOW_DISTRIBUTION: "Display the distribution and shape of data",
        AnalysisGoal.TIME_SERIES: "Analyze trends and patterns over time",
        AnalysisGoal.SURVIVAL_ANALYSIS: "Study time-to-event data with censoring",
        AnalysisGoal.DIFFERENTIAL_EXPRESSION: "Identify significantly changed genes or proteins",
        AnalysisGoal.CLASSIFICATION: "Evaluate classification model performance",
        AnalysisGoal.EXPLORATORY: "General data exploration and pattern discovery"
    }
    return descriptions.get(goal, "General analysis purpose") 