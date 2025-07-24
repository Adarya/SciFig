from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime

from app.services.statistical_engine import EngineOrchestrator
from app.services.figure_generator import FigureGenerator
from app.services.auth import get_current_user_optional
from app.models.database import Analysis, Dataset

router = APIRouter()

class AnalysisRequest(BaseModel):
    dataset_id: str
    outcome_variable: str
    group_variable: Optional[str] = None
    time_variable: Optional[str] = None
    event_variable: Optional[str] = None
    analysis_type: Optional[str] = None  # Let system recommend if not specified
    parameters: Optional[Dict[str, Any]] = {}

class AnalysisResponse(BaseModel):
    analysis_id: str
    status: str
    data_profile: Optional[Dict[str, Any]] = None
    recommendation: Optional[Dict[str, Any]] = None
    results: Optional[Dict[str, Any]] = None
    assumptions_checked: Optional[Dict[str, Any]] = None
    warnings: Optional[List[str]] = None
    execution_time_ms: Optional[int] = None
    created_at: datetime

@router.post("/run", response_model=AnalysisResponse)
async def run_analysis(
    request: AnalysisRequest,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user_optional)
) -> AnalysisResponse:
    """
    Run statistical analysis on uploaded dataset
    """
    
    try:
        # Generate analysis ID
        analysis_id = str(uuid.uuid4())
        start_time = datetime.now()
        
        # For now, use mock data since we don't have full database integration yet
        # In production, this would fetch the actual dataset from the database
        mock_data = [
            {"group": "Drug A", "outcome": 0.85, "age": 45},
            {"group": "Drug B", "outcome": 0.72, "age": 52},
            {"group": "Drug A", "outcome": 0.91, "age": 38},
            {"group": "Drug B", "outcome": 0.68, "age": 41},
            {"group": "Drug A", "outcome": 0.88, "age": 47},
            {"group": "Drug B", "outcome": 0.74, "age": 55},
            {"group": "Drug A", "outcome": 0.92, "age": 43},
            {"group": "Drug B", "outcome": 0.71, "age": 49},
            {"group": "Drug A", "outcome": 0.89, "age": 44},
            {"group": "Drug B", "outcome": 0.69, "age": 51},
            {"group": "Drug A", "outcome": 0.87, "age": 46},
            {"group": "Drug B", "outcome": 0.73, "age": 48},
            {"group": "Drug A", "outcome": 0.90, "age": 42},
            {"group": "Drug B", "outcome": 0.70, "age": 53},
            {"group": "Drug A", "outcome": 0.86, "age": 45},
            {"group": "Drug B", "outcome": 0.75, "age": 50}
        ]
        
        # Run statistical analysis
        orchestrator = EngineOrchestrator()
        analysis_result = orchestrator.run_analysis(
            data=mock_data,
            outcome_var=request.outcome_variable,
            group_var=request.group_variable,
            time_var=request.time_variable,
            event_var=request.event_variable
        )
        
        # Calculate execution time
        execution_time = int((datetime.now() - start_time).total_seconds() * 1000)
        
        # Determine status
        status = "completed" if "error" not in analysis_result else "failed"
        
        # Schedule figure generation in background
        if status == "completed":
            background_tasks.add_task(
                generate_figure_background,
                analysis_id,
                analysis_result,
                request.outcome_variable,
                request.group_variable
            )
        
        response = AnalysisResponse(
            analysis_id=analysis_id,
            status=status,
            data_profile=analysis_result.get("data_profile"),
            recommendation=analysis_result.get("recommendation"),
            results=analysis_result.get("final_result"),
            assumptions_checked=analysis_result.get("assumptions_checked"),
            warnings=[],  # TODO: Extract warnings from results
            execution_time_ms=execution_time,
            created_at=start_time
        )
        
        # TODO: Save analysis to database
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.get("/{analysis_id}")
async def get_analysis(
    analysis_id: str,
    current_user = Depends(get_current_user_optional)
) -> AnalysisResponse:
    """
    Get analysis results by ID
    """
    # TODO: Implement database lookup
    # For now, return mock response
    return AnalysisResponse(
        analysis_id=analysis_id,
        status="completed",
        data_profile={
            "sample_size": 16,
            "outcome_type": "continuous",
            "n_groups": 2
        },
        recommendation={
            "primary": "t_test",
            "reasoning": "Two groups, continuous outcome"
        },
        results={
            "test_name": "Student's t-test",
            "p_value": 0.001,
            "statistic": {"t": 4.23, "df": 14},
            "effect_size": {"cohens_d": 1.2, "interpretation": "large"}
        },
        execution_time_ms=245,
        created_at=datetime.now()
    )

@router.get("/{analysis_id}/figures")
async def get_analysis_figures(
    analysis_id: str,
    current_user = Depends(get_current_user_optional)
) -> List[Dict[str, Any]]:
    """
    Get generated figures for an analysis
    """
    # TODO: Implement database lookup for figures
    return [
        {
            "figure_id": str(uuid.uuid4()),
            "type": "box_plot",
            "url": f"/static/figures/{analysis_id}_box_plot.png",
            "format": "png",
            "dpi": 300,
            "created_at": datetime.now()
        }
    ]

@router.post("/{analysis_id}/figures/regenerate")
async def regenerate_figures(
    analysis_id: str,
    style: str = "nature",
    format: str = "png",
    dpi: int = 300,
    current_user = Depends(get_current_user_optional)
) -> Dict[str, str]:
    """
    Regenerate figures with different styling
    """
    # TODO: Implement figure regeneration
    return {"message": f"Figure regeneration started for analysis {analysis_id}"}

async def generate_figure_background(
    analysis_id: str,
    analysis_result: Dict[str, Any],
    outcome_var: str,
    group_var: str
):
    """
    Background task to generate figures
    """
    try:
        generator = FigureGenerator()
        
        # Generate figure based on analysis type
        if analysis_result.get("final_result", {}).get("test_name", "").lower().find("t-test") >= 0:
            figure_path = await generator.generate_box_plot(
                analysis_id=analysis_id,
                data=analysis_result,
                outcome_var=outcome_var,
                group_var=group_var
            )
            
            # TODO: Save figure info to database
            print(f"Generated figure: {figure_path}")
            
    except Exception as e:
        print(f"Figure generation failed for analysis {analysis_id}: {str(e)}")

@router.get("/")
async def list_analyses(
    limit: int = 10,
    offset: int = 0,
    current_user = Depends(get_current_user_optional)
) -> List[AnalysisResponse]:
    """
    List user's analyses with pagination
    """
    # TODO: Implement database query with user filtering
    return [] 