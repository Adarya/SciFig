"""Statistical analysis models"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class AnalysisRequest(BaseModel):
    """Base analysis request model"""
    data: List[Dict[str, Any]]
    outcome_variable: str
    group_variable: str
    analysis_type: str
    time_variable: Optional[str] = None
    event_variable: Optional[str] = None


class MultivariateAnalysisRequest(BaseModel):
    """Multivariate analysis request model"""
    data: List[Dict[str, Any]]
    outcome_variable: str
    predictor_variables: List[str]
    analysis_type: str = "multivariate_analysis"
    time_variable: Optional[str] = None
    event_variable: Optional[str] = None
    model_type: Optional[str] = None


class StatisticalResult(BaseModel):
    """Statistical analysis result model"""
    test_name: str
    statistic: float
    p_value: float
    effect_size: Optional[Dict[str, Any]] = None
    confidence_interval: Optional[List[float]] = None
    summary: str
    interpretation: str
    assumptions_met: bool
    sample_sizes: Dict[str, int]
    descriptive_stats: Dict[str, Any]


class MultivariateResult(BaseModel):
    """Multivariate analysis result model"""
    analysis_type: str
    model_type: str
    results: List[Dict[str, Any]]
    model_summary: Dict[str, Any]
    forest_plot: str
    sample_size: int
    formula: str
    message: str 