"""Statistical analysis routes"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
import pandas as pd

from .models import AnalysisRequest, MultivariateAnalysisRequest, StatisticalResult, MultivariateResult
from .services import StatisticalAnalysisService
from ..auth.dependencies import get_current_active_user, get_optional_user
from ..auth.models import UserResponse

router = APIRouter(prefix="/api/v1/statistical", tags=["statistical analysis"])


@router.post("/analyze", response_model=StatisticalResult)
async def analyze_data(
    request: AnalysisRequest,
    current_user: Optional[UserResponse] = Depends(get_optional_user)
):
    """Perform statistical analysis on the provided data"""
    try:
        # Convert to DataFrame
        df = pd.DataFrame(request.data)
        
        # Initialize statistical service
        stats_service = StatisticalAnalysisService()
        
        # Perform analysis
        result = stats_service.perform_analysis(
            df=df,
            analysis_type=request.analysis_type,
            outcome_var=request.outcome_variable,
            group_var=request.group_variable,
            time_var=request.time_variable,
            event_var=request.event_variable
        )
        
        return result
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )


@router.post("/analyze_multivariate", response_model=MultivariateResult)
async def analyze_multivariate(
    request: MultivariateAnalysisRequest,
    current_user: Optional[UserResponse] = Depends(get_optional_user)
):
    """Perform multivariate statistical analysis with forest plot visualization"""
    try:
        # Convert to DataFrame
        df = pd.DataFrame(request.data)
        
        # Initialize statistical service
        stats_service = StatisticalAnalysisService()
        
        # Perform multivariate analysis
        result = stats_service.perform_multivariate_analysis(
            df=df,
            outcome_var=request.outcome_variable,
            predictor_vars=request.predictor_variables,
            model_type=request.model_type,
            time_var=request.time_variable,
            event_var=request.event_variable
        )
        
        return result
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        print(f"ERROR in analyze_multivariate: {str(e)}")
        print(f"ERROR traceback: {error_traceback}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Multivariate analysis failed: {str(e)}"
        )


@router.get("/methods")
async def get_available_methods():
    """Get list of available statistical methods"""
    return {
        "univariate_methods": [
            {
                "id": "independent_ttest",
                "name": "Independent Samples T-Test",
                "description": "Compare means between two independent groups",
                "requirements": ["numeric_outcome", "categorical_group_2_levels"]
            },
            {
                "id": "mann_whitney_u",
                "name": "Mann-Whitney U Test",
                "description": "Non-parametric test to compare two independent groups",
                "requirements": ["numeric_outcome", "categorical_group_2_levels"]
            },
            {
                "id": "one_way_anova",
                "name": "One-Way ANOVA",
                "description": "Compare means across multiple groups",
                "requirements": ["numeric_outcome", "categorical_group_multiple_levels"]
            },
            {
                "id": "chi_square",
                "name": "Chi-Square Test of Independence",
                "description": "Test association between two categorical variables",
                "requirements": ["categorical_outcome", "categorical_group"]
            },
            {
                "id": "survival_analysis",
                "name": "Kaplan-Meier Survival Analysis",
                "description": "Analyze time-to-event data with censoring",
                "requirements": ["time_variable", "event_variable", "categorical_group"]
            }
        ],
        "multivariate_methods": [
            {
                "id": "logistic_regression",
                "name": "Logistic Regression",
                "description": "Model binary outcomes with multiple predictors",
                "requirements": ["binary_outcome", "multiple_predictors"]
            },
            {
                "id": "linear_regression",
                "name": "Linear Regression",
                "description": "Model continuous outcomes with multiple predictors",
                "requirements": ["numeric_outcome", "multiple_predictors"]
            },
            {
                "id": "cox_regression",
                "name": "Cox Proportional Hazards Regression",
                "description": "Model survival data with multiple predictors",
                "requirements": ["time_variable", "event_variable", "multiple_predictors"]
            }
        ]
    }


@router.get("/validation/data")
async def validate_data_for_analysis(
    analysis_type: str,
    outcome_variable: str,
    group_variable: Optional[str] = None,
    time_variable: Optional[str] = None,
    event_variable: Optional[str] = None
):
    """Validate data requirements for a specific analysis type"""
    
    validation_rules = {
        "independent_ttest": {
            "required_vars": ["outcome_variable", "group_variable"],
            "outcome_type": "numeric",
            "group_levels": 2,
            "min_sample_size": 3
        },
        "mann_whitney_u": {
            "required_vars": ["outcome_variable", "group_variable"],
            "outcome_type": "numeric",
            "group_levels": 2,
            "min_sample_size": 3
        },
        "one_way_anova": {
            "required_vars": ["outcome_variable", "group_variable"],
            "outcome_type": "numeric",
            "group_levels": "2+",
            "min_sample_size": 3
        },
        "chi_square": {
            "required_vars": ["outcome_variable", "group_variable"],
            "outcome_type": "categorical",
            "group_levels": "2+",
            "min_sample_size": 5
        },
        "survival_analysis": {
            "required_vars": ["time_variable", "event_variable", "group_variable"],
            "outcome_type": "time_to_event",
            "group_levels": "1+",
            "min_sample_size": 10
        }
    }
    
    if analysis_type not in validation_rules:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown analysis type: {analysis_type}"
        )
    
    rules = validation_rules[analysis_type]
    
    # Check required variables
    provided_vars = {
        "outcome_variable": outcome_variable,
        "group_variable": group_variable,
        "time_variable": time_variable,
        "event_variable": event_variable
    }
    
    missing_vars = [
        var for var in rules["required_vars"] 
        if not provided_vars.get(var)
    ]
    
    if missing_vars:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing required variables for {analysis_type}: {missing_vars}"
        )
    
    return {
        "analysis_type": analysis_type,
        "validation_rules": rules,
        "status": "valid",
        "message": f"Data requirements met for {analysis_type}"
    } 